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

    const customers = await dbQuery(
      `SELECT * FROM customers WHERE id = $1 AND business_id = $2`,
      [id, session.business_id]
    );

    if (customers.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customers[0];

    // Fetch recent orders
    const orders = await dbQuery(
      `SELECT id, order_number, total_amount, payment_status, payment_method, created_at
       FROM orders
       WHERE customer_id = $1 AND business_id = $2
       ORDER BY created_at DESC LIMIT 10`,
      [id, session.business_id]
    );

    // Fetch recent invoices
    const invoices = await dbQuery(
      `SELECT id, invoice_number, total_amount, balance_amount, status, issue_date, due_date
       FROM invoices
       WHERE customer_id = $1 AND business_id = $2
       ORDER BY created_at DESC LIMIT 10`,
      [id, session.business_id]
    );

    // Fetch notes
    const notes = await dbQuery(
      `SELECT id, note, created_at
       FROM customer_notes
       WHERE customer_id = $1 AND business_id = $2
       ORDER BY created_at DESC`,
      [id, session.business_id]
    );

    return NextResponse.json({
      success: true,
      customer,
      orders,
      invoices,
      notes,
    });
  } catch (error) {
    console.error('Failed to fetch customer profile:', error);
    return NextResponse.json({ error: 'Failed to fetch customer profile' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, phone, email, address } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updated = await dbQuery(
      `
      UPDATE customers
      SET name = $1, phone = $2, email = $3, address = $4, updated_at = NOW()
      WHERE id = $5 AND business_id = $6
      RETURNING *
      `,
      [name.trim(), phone?.trim() || null, email?.trim() || null, address?.trim() || null, id, session.business_id]
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Customer not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: updated[0],
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await dbQuery(
      `DELETE FROM customers WHERE id = $1 AND business_id = $2 RETURNING id`,
      [id, session.business_id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer removed successfully',
    });
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
