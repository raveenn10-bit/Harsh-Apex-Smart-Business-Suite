import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const invoices = await dbQuery(
      `
      SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address,
             b.name as business_name, b.phone as business_phone, b.email as business_email, b.address as business_address,
             bs.receipt_header, bs.receipt_footer
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      JOIN businesses b ON i.business_id = b.id
      LEFT JOIN business_settings bs ON b.id = bs.business_id
      WHERE i.id = $1 AND i.business_id = $2
      `,
      [id, session.business_id]
    );

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    const items = await dbQuery(
      `SELECT id, description, quantity, unit_price, total_price FROM invoice_items WHERE invoice_id = $1`,
      [id]
    );

    const payments = await dbQuery(
      `SELECT id, amount, payment_method, payment_reference, payment_date FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      invoice,
      items,
      payments,
    });
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}
