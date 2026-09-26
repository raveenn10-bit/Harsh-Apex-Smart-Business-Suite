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

    const quotations = await dbQuery(
      `
      SELECT q.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address,
             b.name as business_name, b.phone as business_phone, b.email as business_email, b.address as business_address,
             bs.receipt_header, bs.receipt_footer
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      JOIN businesses b ON q.business_id = b.id
      LEFT JOIN business_settings bs ON b.id = bs.business_id
      WHERE q.id = $1 AND q.business_id = $2
      `,
      [id, session.business_id]
    );

    if (quotations.length === 0) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const quotation = quotations[0];

    const items = await dbQuery(
      `SELECT id, product_id, description, quantity, unit_price, total_price FROM quotation_items WHERE quotation_id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      quotation,
      items,
    });
  } catch (error) {
    console.error('Failed to fetch quotation:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  }
}
