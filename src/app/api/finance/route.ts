import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Total Revenue from completed orders
    const revenueRows = await dbQuery<{ total_revenue: string; order_count: string }>(
      `
      SELECT COALESCE(SUM(total_amount), 0) as total_revenue,
             COUNT(*) as order_count
      FROM orders
      WHERE business_id = $1 AND status != 'cancelled'
      `,
      [session.business_id]
    );
    const totalRevenue = parseFloat(revenueRows[0]?.total_revenue || '0');
    const orderCount = parseInt(revenueRows[0]?.order_count || '0', 10);

    // 2. COGS (Cost of Goods Sold)
    const cogsRows = await dbQuery<{ cogs: string }>(
      `
      SELECT COALESCE(SUM(oi.quantity * oi.cost_price), 0) as cogs
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.business_id = $1 AND o.status != 'cancelled'
      `,
      [session.business_id]
    );
    const cogs = parseFloat(cogsRows[0]?.cogs || '0');

    // 3. Gross Profit
    const grossProfit = totalRevenue - cogs;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 4. Operating Expenses
    const expenseRows = await dbQuery<{ total_expense: string; expense_count: string }>(
      `
      SELECT COALESCE(SUM(amount), 0) as total_expense,
             COUNT(*) as expense_count
      FROM expenses
      WHERE business_id = $1
      `,
      [session.business_id]
    );
    const totalExpenses = parseFloat(expenseRows[0]?.total_expense || '0');
    const expenseCount = parseInt(expenseRows[0]?.expense_count || '0', 10);

    // 5. Net Profit
    const netProfit = grossProfit - totalExpenses;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 6. Cash Flow & Receivables
    const paymentsRows = await dbQuery<{ total_collected: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total_collected FROM payments WHERE business_id = $1`,
      [session.business_id]
    );
    const totalCollected = parseFloat(paymentsRows[0]?.total_collected || '0');

    const receivablesRows = await dbQuery<{ total_receivables: string }>(
      `SELECT COALESCE(SUM(balance_amount), 0) as total_receivables FROM invoices WHERE business_id = $1 AND status != 'paid'`,
      [session.business_id]
    );
    const totalReceivables = parseFloat(receivablesRows[0]?.total_receivables || '0');

    // 7. Expense by Category Breakdown
    const categoryBreakdown = await dbQuery<{ category_name: string; total_amount: string; count: string }>(
      `
      SELECT COALESCE(ec.name, 'General Overhead') as category_name,
             COALESCE(SUM(e.amount), 0) as total_amount,
             COUNT(e.id) as count
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.business_id = $1
      GROUP BY ec.name
      ORDER BY total_amount DESC
      `,
      [session.business_id]
    );

    // 8. Monthly Trends (recent 6 months)
    const monthlySales = await dbQuery<{ month: string; revenue: string }>(
      `
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
             COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE business_id = $1 AND status != 'cancelled'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
      `,
      [session.business_id]
    );

    const monthlyExpenses = await dbQuery<{ month: string; expense: string }>(
      `
      SELECT TO_CHAR(expense_date, 'YYYY-MM') as month,
             COALESCE(SUM(amount), 0) as expense
      FROM expenses
      WHERE business_id = $1
      GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
      `,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      summary: {
        total_revenue: totalRevenue,
        order_count: orderCount,
        cogs,
        gross_profit: grossProfit,
        gross_margin_percent: Math.round(grossMarginPercent * 10) / 10,
        total_expenses: totalExpenses,
        expense_count: expenseCount,
        net_profit: netProfit,
        net_margin_percent: Math.round(netMarginPercent * 10) / 10,
        total_collected: totalCollected,
        total_receivables: totalReceivables,
      },
      category_breakdown: categoryBreakdown,
      monthly_sales: monthlySales.reverse(),
      monthly_expenses: monthlyExpenses.reverse(),
    });
  } catch (error) {
    console.error('Failed to fetch finance summary:', error);
    return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
  }
}
