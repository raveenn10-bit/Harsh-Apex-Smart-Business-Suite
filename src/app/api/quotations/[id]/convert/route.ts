import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch quotation
    const quoteRows = await dbQuery<{
      id: string;
      quotation_number: string;
      customer_id: string | null;
      subtotal: number;
      discount_amount: number;
      tax_amount: number;
      total_amount: number;
      status: string;
      notes: string | null;
    }>(
      `SELECT * FROM quotations WHERE id = $1 AND business_id = $2`,
      [id, session.business_id]
    );

    if (quoteRows.length === 0) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const quote = quoteRows[0];

    // Fetch quotation items
    const items = await dbQuery<{
      product_id: string | null;
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>(
      `SELECT product_id, description, quantity, unit_price, total_price FROM quotation_items WHERE quotation_id = $1`,
      [id]
    );

    // Business settings for invoice prefix & numbers
    const settingsRows = await dbQuery<{
      invoice_prefix: string;
      next_invoice_number: number;
    }>(
      `SELECT invoice_prefix, next_invoice_number FROM business_settings WHERE business_id = $1`,
      [session.business_id]
    );

    const prefix = settingsRows[0]?.invoice_prefix || 'HA-INV-';
    const nextNum = settingsRows[0]?.next_invoice_number || 101;
    const invoiceNumber = `${prefix}${String(nextNum).padStart(5, '0')}`;

    // Create Invoice
    const invoiceResult = await dbQuery<{ id: string }>(
      `
      INSERT INTO invoices (
        business_id, customer_id, invoice_number, issue_date, due_date,
        subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes
      ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', $4, $5, $6, $7, 0, $7, 'unpaid', $8)
      RETURNING id
      `,
      [
        session.business_id,
        quote.customer_id,
        invoiceNumber,
        quote.subtotal,
        quote.discount_amount,
        quote.tax_amount,
        quote.total_amount,
        `Converted from quotation ${quote.quotation_number}`,
      ]
    );

    const invoiceId = invoiceResult[0].id;

    // Create Invoice Items
    for (const it of items) {
      await dbQuery(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoiceId, it.product_id, it.description, it.quantity, it.unit_price, it.total_price]
      );
    }

    // Update Quotation status to accepted
    await dbQuery(
      `UPDATE quotations SET status = 'accepted' WHERE id = $1 AND business_id = $2`,
      [id, session.business_id]
    );

    // Increment next invoice number
    await dbQuery(
      `UPDATE business_settings SET next_invoice_number = next_invoice_number + 1 WHERE business_id = $1`,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      message: `Quotation ${quote.quotation_number} successfully converted to Invoice ${invoiceNumber}!`,
    });
  } catch (error) {
    console.error('Failed to convert quotation:', error);
    return NextResponse.json({ error: 'Failed to convert quotation to invoice' }, { status: 500 });
  }
}
