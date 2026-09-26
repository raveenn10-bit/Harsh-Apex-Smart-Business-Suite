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
    const search = searchParams.get('q') || '';

    let sql = `
      SELECT id, name, phone, email, address, avatar_url, 
             total_purchases, total_orders, outstanding_balance, 
             last_purchase_at, created_at
      FROM customers
      WHERE business_id = $1
    `;
    const params: unknown[] = [session.business_id];

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    sql += ` ORDER BY total_purchases DESC, name ASC`;

    const customers = await dbQuery(sql, params);

    return NextResponse.json({
      success: true,
      customers,
      total: customers.length,
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, address } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const result = await dbQuery<{ id: string }>(
      `
      INSERT INTO customers (
        business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance
      ) VALUES ($1, $2, $3, $4, $5, 0, 0, 0)
      RETURNING id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, created_at
      `,
      [
        session.business_id,
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
      ]
    );

    return NextResponse.json({
      success: true,
      customer: result[0],
      message: 'Customer registered successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
