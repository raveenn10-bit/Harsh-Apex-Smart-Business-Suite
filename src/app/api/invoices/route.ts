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
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    let sql = `
      SELECT i.id, i.invoice_number, i.issue_date, i.due_date,
             i.subtotal, i.discount_amount, i.tax_amount, i.total_amount,
             i.paid_amount, i.balance_amount, i.status, i.notes,
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.business_id = $1
    `;
    const params: unknown[] = [session.business_id];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND i.status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY i.created_at DESC`;

    const invoices = await dbQuery(sql, params);

    return NextResponse.json({
      success: true,
      invoices,
      total: invoices.length,
    });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
