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
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
    }

    const notes = await dbQuery(
      `
      SELECT cn.id, cn.note, cn.created_at,
             p.full_name as author_name
      FROM customer_notes cn
      LEFT JOIN profiles p ON cn.created_by = p.id
      WHERE cn.business_id = $1 AND cn.customer_id = $2
      ORDER BY cn.created_at DESC
      `,
      [session.business_id, customerId]
    );

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error('Failed to fetch customer notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customer_id, note } = body;

    if (!customer_id || !note || !note.trim()) {
      return NextResponse.json({ error: 'customer_id and note text are required' }, { status: 400 });
    }

    const result = await dbQuery<{ id: string }>(
      `
      INSERT INTO customer_notes (business_id, customer_id, note, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [session.business_id, customer_id, note.trim(), session.profile_id || null]
    );

    return NextResponse.json({
      success: true,
      note_id: result[0].id,
      message: 'Note logged successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create customer note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
