import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leaves = await dbQuery(
      `
      SELECT lr.id, lr.leave_type, lr.start_date, lr.end_date, lr.reason,
             lr.status, lr.created_at,
             e.name as employee_name, e.employee_id_number, e.position, e.department,
             p.full_name as approved_by_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN profiles p ON lr.approved_by = p.id
      WHERE lr.business_id = $1
      ORDER BY lr.created_at DESC
      `,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error('Failed to fetch leave requests:', error);
    return NextResponse.json({ error: 'Failed to fetch leave records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employee_id, leave_type = 'annual', start_date, end_date, reason } = body;

    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json({ error: 'Employee, start date, and end date are required' }, { status: 400 });
    }

    const result = await dbQuery<{ id: string }>(
      `
      INSERT INTO leave_requests (
        business_id, employee_id, leave_type, start_date, end_date, reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id
      `,
      [session.business_id, employee_id, leave_type, start_date, end_date, reason || null]
    );

    return NextResponse.json({
      success: true,
      leave_id: result[0].id,
      message: 'Leave request submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit leave request:', error);
    return NextResponse.json({ error: 'Failed to submit leave request' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body; // 'approved' or 'rejected'

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid ID and status are required' }, { status: 400 });
    }

    await dbQuery(
      `
      UPDATE leave_requests
      SET status = $1, approved_by = $2
      WHERE id = $3 AND business_id = $4
      `,
      [status, session.profile_id || null, id, session.business_id]
    );

    return NextResponse.json({
      success: true,
      message: `Leave request has been marked as ${status}`,
    });
  } catch (error) {
    console.error('Failed to update leave status:', error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}
