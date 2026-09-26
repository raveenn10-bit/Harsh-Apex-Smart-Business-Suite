import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';
import { hasFeature } from '@/lib/auth/permissions';

interface CheckoutItem {
  product_id: string;
  quantity: number;
  unit_price?: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      customer_id, 
      items, 
      discount_amount = 0, 
      payment_method = 'cash', 
      amount_tendered,
      notes 
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Add at least one item.' }, { status: 400 });
    }

    // 1. Fetch business settings for invoice prefix & numbers
    const settingsRows = await dbQuery<{
      invoice_prefix: string;
      next_invoice_number: number;
      enable_tax: boolean;
      tax_rate: number;
      receipt_header: string;
      receipt_footer: string;
    }>(
      `SELECT invoice_prefix, next_invoice_number, enable_tax, tax_rate, receipt_header, receipt_footer
       FROM business_settings
       WHERE business_id = $1`,
      [session.business_id]
    );

    const settings = settingsRows[0] || {
      invoice_prefix: 'HA-INV-',
      next_invoice_number: 101,
      enable_tax: false,
      tax_rate: 0,
      receipt_header: 'Thank you for choosing Harsh Apex Solutions',
      receipt_footer: 'Goods sold are not returnable without original receipt.',
    };

    // 2. Validate products and calculate totals server-side
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      product_id: string;
      name: string;
      sku: string;
      quantity: number;
      unit_price: number;
      cost_price: number;
      total_price: number;
      current_stock: number;
    }> = [];

    for (const item of items as CheckoutItem[]) {
      const prods = await dbQuery<{
        id: string;
        name: string;
        sku: string;
        selling_price: number;
        cost_price: number;
        stock_quantity: number;
      }>(
        `SELECT id, name, sku, selling_price, cost_price, stock_quantity
         FROM products
         WHERE id = $1 AND business_id = $2`,
        [item.product_id, session.business_id]
      );

      if (prods.length === 0) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 });
      }

      const prod = prods[0];
      const qty = parseInt(String(item.quantity), 10);
      if (qty <= 0) {
        return NextResponse.json({ error: `Invalid quantity for product ${prod.name}` }, { status: 400 });
      }

      if (prod.stock_quantity < qty) {
        return NextResponse.json({
          error: `Insufficient stock for "${prod.name}". Available: ${prod.stock_quantity}, Requested: ${qty}`,
        }, { status: 400 });
      }

      const unitPrice = Number(prod.selling_price);
      const lineTotal = unitPrice * qty;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        product_id: prod.id,
        name: prod.name,
        sku: prod.sku,
        quantity: qty,
        unit_price: unitPrice,
        cost_price: Number(prod.cost_price),
        total_price: lineTotal,
        current_stock: prod.stock_quantity,
      });
    }

    const discount = Math.max(0, Number(discount_amount) || 0);
    const taxableAmount = Math.max(0, calculatedSubtotal - discount);
    const taxRate = settings.enable_tax ? Number(settings.tax_rate) : 0;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const grandTotal = taxableAmount + taxAmount;

    // Check payment method
    const validPaymentMethods = ['cash', 'card', 'bank_transfer'];
    const pMethod = validPaymentMethods.includes(payment_method) ? payment_method : 'cash';

    // Invoice & Order numbering
    const invoiceNumStr = String(settings.next_invoice_number).padStart(5, '0');
    const invoiceNumber = `${settings.invoice_prefix || 'HA-INV-'}${invoiceNumStr}`;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // 3. Create Order
    const orderResult = await dbQuery<{ id: string }>(
      `
      INSERT INTO orders (
        business_id, order_number, customer_id, status, payment_status, 
        payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_by
      ) VALUES ($1, $2, $3, 'completed', 'paid', $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
      `,
      [
        session.business_id,
        orderNumber,
        customer_id || null,
        pMethod,
        calculatedSubtotal,
        discount,
        taxAmount,
        grandTotal,
        notes || 'POS Retail Checkout',
        session.user_id || null,
      ]
    );
    const orderId = orderResult[0].id;

    // 4. Create Order Items & Update Inventory
    for (const item of validatedItems) {
      await dbQuery(
        `INSERT INTO order_items (
          business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7)`,
        [session.business_id, orderId, item.product_id, item.quantity, item.unit_price, item.cost_price, item.total_price]
      );

      const newStock = item.current_stock - item.quantity;
      const status = newStock === 0 ? 'out_of_stock' : 'active';

      // Reduce product stock
      await dbQuery(
        `UPDATE products SET stock_quantity = $1, status = $2, updated_at = NOW() WHERE id = $3 AND business_id = $4`,
        [newStock, status, item.product_id, session.business_id]
      );

      // Update inventory table
      await dbQuery(
        `UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE product_id = $2 AND business_id = $3`,
        [newStock, item.product_id, session.business_id]
      );

      // Create stock movement
      await dbQuery(
        `INSERT INTO stock_movements (
          business_id, product_id, movement_type, quantity, previous_quantity, new_quantity, reference_id, notes, created_by
        ) VALUES ($1, $2, 'SALE', $3, $4, $5, $6, 'POS sale transaction', $7)`,
        [
          session.business_id,
          item.product_id,
          item.quantity,
          item.current_stock,
          newStock,
          invoiceNumber,
          session.user_id || null,
        ]
      );
    }

    // 5. Create Invoice
    const invoiceResult = await dbQuery<{ id: string }>(
      `
      INSERT INTO invoices (
        business_id, order_id, customer_id, invoice_number, issue_date, due_date,
        subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE, $5, $6, $7, $8, $8, 0, 'paid', $9)
      RETURNING id
      `,
      [
        session.business_id,
        orderId,
        customer_id || null,
        invoiceNumber,
        calculatedSubtotal,
        discount,
        taxAmount,
        grandTotal,
        notes || 'Generated at POS counter',
      ]
    );
    const invoiceId = invoiceResult[0].id;

    // 6. Create Invoice Items
    for (const item of validatedItems) {
      await dbQuery(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoiceId, item.product_id, item.name, item.quantity, item.unit_price, item.total_price]
      );
    }

    // 7. Record Payment
    await dbQuery(
      `INSERT INTO payments (
        business_id, invoice_id, order_id, customer_id, amount, payment_method, payment_reference, payment_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [session.business_id, invoiceId, orderId, customer_id || null, grandTotal, pMethod, `REC-${invoiceNumber}`]
    );

    // 8. Update Customer record if customer selected
    let customerInfo = null;
    if (customer_id) {
      await dbQuery(
        `UPDATE customers
         SET total_purchases = total_purchases + $1,
             total_orders = total_orders + 1,
             last_purchase_at = NOW(),
             updated_at = NOW()
         WHERE id = $2 AND business_id = $3`,
        [grandTotal, customer_id, session.business_id]
      );

      const cData = await dbQuery<{ name: string; phone: string; email: string }>(
        `SELECT name, phone, email FROM customers WHERE id = $1 AND business_id = $2`,
        [customer_id, session.business_id]
      );
      if (cData.length > 0) customerInfo = cData[0];
    }

    // 9. Increment next invoice number
    await dbQuery(
      `UPDATE business_settings SET next_invoice_number = next_invoice_number + 1 WHERE business_id = $1`,
      [session.business_id]
    );

    // 10. WhatsApp simulation if tenant tier has whatsapp
    const canWhatsApp = hasFeature(session, 'whatsapp');
    let whatsappDispatched = false;
    if (canWhatsApp && customerInfo?.phone) {
      await dbQuery(
        `INSERT INTO whatsapp_messages (
          business_id, customer_id, phone, template_name, message_content, status, reference_id, sent_at
        ) VALUES ($1, $2, $3, 'payment_received', $4, 'delivered', $5, NOW())`,
        [
          session.business_id,
          customer_id,
          customerInfo.phone,
          `Thank you for your purchase at ${session.business_name}! Invoice: ${invoiceNumber}. Total: Rs. ${grandTotal.toFixed(2)}.`,
          invoiceNumber,
        ]
      );
      whatsappDispatched = true;
    }

    const changeDue = pMethod === 'cash' && amount_tendered ? Math.max(0, Number(amount_tendered) - grandTotal) : 0;

    return NextResponse.json({
      success: true,
      receipt: {
        business_name: session.business_name,
        invoice_number: invoiceNumber,
        order_number: orderNumber,
        date: new Date().toISOString(),
        customer: customerInfo ? { name: customerInfo.name, phone: customerInfo.phone } : { name: 'Walk-in Customer' },
        items: validatedItems,
        subtotal: calculatedSubtotal,
        discount_amount: discount,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        payment_method: pMethod,
        amount_tendered: amount_tendered || grandTotal,
        change_due: changeDue,
        header: settings.receipt_header,
        footer: settings.receipt_footer,
        whatsapp_sent: whatsappDispatched,
      },
      message: 'Sale successfully processed and inventory updated!',
    });
  } catch (error) {
    console.error('POS Checkout error:', error);
    return NextResponse.json({ error: 'Failed to process checkout transaction' }, { status: 500 });
  }
}
