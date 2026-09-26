import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const status = searchParams.get('status');

    let sql = `
      SELECT q.id, q.quotation_number, q.issue_date, q.valid_until,
             q.subtotal, q.discount_amount, q.tax_amount, q.total_amount,
             q.status, q.notes, q.created_at,
             c.name as customer_name, c.phone as customer_phone
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.business_id = $1
    `;
    const params: unknown[] = [session.business_id];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND q.status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (q.quotation_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY q.created_at DESC`;

    const quotations = await dbQuery(sql, params);

    return NextResponse.json({
      success: true,
      quotations,
      total: quotations.length,
    });
  } catch (error) {
    console.error('Failed to fetch quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customer_id, items, discount_amount = 0, valid_days = 30, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Quotation requires at least one line item' }, { status: 400 });
    }

    // Settings for quotation prefix
    const settingsRows = await dbQuery<{ quotation_prefix: string; next_quotation_number: number }>(
      `SELECT quotation_prefix, next_quotation_number FROM business_settings WHERE business_id = $1`,
      [session.business_id]
    );

    const qPrefix = settingsRows[0]?.quotation_prefix || 'HA-QTN-';
    const nextQNum = settingsRows[0]?.next_quotation_number || 101;
    const qNumber = `${qPrefix}${String(nextQNum).padStart(5, '0')}`;

    let subtotal = 0;
    const validatedItems: Array<{
      product_id: string | null;
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }> = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10) || 1;
      const price = parseFloat(item.unit_price) || 0;
      const total = qty * price;
      subtotal += total;

      validatedItems.push({
        product_id: item.product_id || null,
        description: item.description || 'Quoted Item',
        quantity: qty,
        unit_price: price,
        total_price: total,
      });
    }

    const discount = Math.max(0, parseFloat(discount_amount) || 0);
    const totalAmount = Math.max(0, subtotal - discount);

    // Create quotation
    const quoteResult = await dbQuery<{ id: string }>(
      `
      INSERT INTO quotations (
        business_id, quotation_number, customer_id, issue_date, valid_until,
        subtotal, discount_amount, tax_amount, total_amount, status, notes
      ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + ($4 || ' days')::INTERVAL, $5, $6, 0, $7, 'sent', $8)
      RETURNING id
      `,
      [session.business_id, qNumber, customer_id || null, valid_days, subtotal, discount, totalAmount, notes || null]
    );

    const quoteId = quoteResult[0].id;

    for (const it of validatedItems) {
      await dbQuery(
        `INSERT INTO quotation_items (quotation_id, product_id, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [quoteId, it.product_id, it.description, it.quantity, it.unit_price, it.total_price]
      );
    }

    // Increment quotation number
    await dbQuery(
      `UPDATE business_settings SET next_quotation_number = next_quotation_number + 1 WHERE business_id = $1`,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      quotation_id: quoteId,
      quotation_number: qNumber,
      message: 'Quotation created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create quotation:', error);
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
  }
}
