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
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('q');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let sql = `
      SELECT e.id, e.expense_number, e.expense_date, e.description,
             e.amount, e.payment_method, e.receipt_url, e.notes, e.created_at,
             ec.id as category_id, ec.name as category_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.business_id = $1
    `;
    const params: unknown[] = [session.business_id];

    if (categoryId && categoryId !== 'all') {
      params.push(categoryId);
      sql += ` AND e.category_id = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (e.description ILIKE $${params.length} OR e.expense_number ILIKE $${params.length})`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND e.expense_date >= $${params.length}::DATE`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND e.expense_date <= $${params.length}::DATE`;
    }

    sql += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

    const expenses = await dbQuery(sql, params);

    // Summary calculations
    const totalSpent = expenses.reduce((acc, row) => acc + Number(row.amount || 0), 0);

    return NextResponse.json({
      success: true,
      expenses,
      total: expenses.length,
      total_spent: totalSpent,
    });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { category_id, description, amount, payment_method = 'cash', expense_date, notes } = body;

    if (!description || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Description and a positive amount are required' }, { status: 400 });
    }

    // Generate unique expense number
    const countResult = await dbQuery<{ count: string }>(
      `SELECT count(*) FROM expenses WHERE business_id = $1`,
      [session.business_id]
    );
    const nextNum = parseInt(countResult[0]?.count || '0', 10) + 1;
    const expenseNumber = `EXP-${String(nextNum).padStart(5, '0')}`;

    const dateVal = expense_date ? expense_date : new Date().toISOString().split('T')[0];

    const result = await dbQuery<{ id: string }>(
      `
      INSERT INTO expenses (
        business_id, category_id, expense_number, expense_date,
        description, amount, payment_method, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
      `,
      [
        session.business_id,
        category_id || null,
        expenseNumber,
        dateVal,
        description.trim(),
        Number(amount),
        payment_method,
        notes || null
      ]
    );

    return NextResponse.json({
      success: true,
      expense_id: result[0].id,
      expense_number: expenseNumber,
      message: 'Expense recorded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
