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
    const department = searchParams.get('department');
    const search = searchParams.get('q');

    let sql = `
      SELECT e.id, e.employee_id_number, e.name, e.email, e.phone,
             e.position, e.department, e.salary, e.join_date, e.status, e.created_at,
             r.name as role_name, r.code as role_code
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      WHERE e.business_id = $1
    `;
    const params: unknown[] = [session.business_id];

    if (department && department !== 'all') {
      params.push(department);
      sql += ` AND e.department = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (e.name ILIKE $${params.length} OR e.employee_id_number ILIKE $${params.length} OR e.position ILIKE $${params.length})`;
    }

    sql += ` ORDER BY e.name ASC`;

    const employees = await dbQuery(sql, params);

    return NextResponse.json({
      success: true,
      employees,
      total: employees.length,
    });
  } catch (error) {
    console.error('Failed to fetch staff members:', error);
    return NextResponse.json({ error: 'Failed to fetch staff directory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, position, department = 'Operations', salary = 0, role_code = 'STAFF' } = body;

    if (!name || !position) {
      return NextResponse.json({ error: 'Name and Position are required' }, { status: 400 });
    }

    // Role lookup
    const roleRows = await dbQuery<{ id: string }>(
      `SELECT id FROM roles WHERE code = $1 LIMIT 1`,
      [role_code]
    );
    const roleId = roleRows[0]?.id || null;

    // Generate unique employee ID number
    const countRows = await dbQuery<{ count: string }>(
      `SELECT count(*) FROM employees WHERE business_id = $1`,
      [session.business_id]
    );
    const nextNum = parseInt(countRows[0]?.count || '0', 10) + 1;
    const employeeIdNumber = `EMP-${String(nextNum).padStart(4, '0')}`;

    const result = await dbQuery<{ id: string }>(
      `
      INSERT INTO employees (
        business_id, employee_id_number, name, email, phone,
        position, department, role_id, salary, join_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, 'active')
      RETURNING id
      `,
      [
        session.business_id,
        employeeIdNumber,
        name.trim(),
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        position.trim(),
        department.trim(),
        roleId,
        Number(salary) || 0
      ]
    );

    return NextResponse.json({
      success: true,
      employee_id: result[0].id,
      employee_id_number: employeeIdNumber,
      message: 'Staff member added successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create staff member:', error);
    return NextResponse.json({ error: 'Failed to register employee' }, { status: 500 });
  }
}
