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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const records = await dbQuery(
      `
      SELECT a.id, a.work_date, a.check_in, a.check_out, a.status, a.notes,
             e.id as employee_id, e.name as employee_name, e.employee_id_number, e.position, e.department
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id AND a.work_date = $2
      WHERE e.business_id = $1 AND e.status = 'active'
      ORDER BY e.name ASC
      `,
      [session.business_id, date]
    );

    return NextResponse.json({
      success: true,
      date,
      attendance: records,
    });
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employee_id, action = 'check_in', notes } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check existing attendance record for today
    const existing = await dbQuery<{ id: string; check_in: string | null; check_out: string | null }>(
      `SELECT id, check_in, check_out FROM attendance WHERE business_id = $1 AND employee_id = $2 AND work_date = $3`,
      [session.business_id, employee_id, today]
    );

    if (existing.length === 0) {
      // Clock in
      await dbQuery(
        `
        INSERT INTO attendance (business_id, employee_id, work_date, check_in, status, notes)
        VALUES ($1, $2, $3, NOW(), 'present', $4)
        `,
        [session.business_id, employee_id, today, notes || null]
      );

      return NextResponse.json({
        success: true,
        message: 'Clock-in recorded successfully at ' + new Date().toLocaleTimeString(),
      });
    } else {
      // Clock out
      await dbQuery(
        `
        UPDATE attendance
        SET check_out = NOW(), notes = COALESCE($4, notes)
        WHERE id = $1
        `,
        [existing[0].id, session.business_id, employee_id, notes || null]
      );

      return NextResponse.json({
        success: true,
        message: 'Clock-out recorded successfully at ' + new Date().toLocaleTimeString(),
      });
    }
  } catch (error) {
    console.error('Failed to log attendance clocking:', error);
    return NextResponse.json({ error: 'Failed to process clocking action' }, { status: 500 });
  }
}
