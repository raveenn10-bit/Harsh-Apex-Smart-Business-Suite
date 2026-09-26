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
    const range = searchParams.get('range') || '30'; // days

    // 1. Sales by date
    const salesByDay = await dbQuery<{ day: string; daily_revenue: string; order_count: string }>(
      `
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as day,
             COALESCE(SUM(total_amount), 0) as daily_revenue,
             COUNT(*) as order_count
      FROM orders
      WHERE business_id = $1 AND status != 'cancelled'
        AND created_at >= NOW() - ($2 || ' days')::INTERVAL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY day DESC
      LIMIT 30
      `,
      [session.business_id, range]
    );

    // 2. Top-selling items
    const topProducts = await dbQuery<{
      name: string;
      sku: string;
      total_qty: string;
      total_revenue: string;
      total_cost: string;
      gross_profit: string;
    }>(
      `
      SELECT p.name, p.sku,
             SUM(oi.quantity) as total_qty,
             SUM(oi.total_price) as total_revenue,
             SUM(oi.quantity * oi.cost_price) as total_cost,
             SUM(oi.total_price - (oi.quantity * oi.cost_price)) as gross_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.business_id = $1 AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_revenue DESC
      LIMIT 10
      `,
      [session.business_id]
    );

    // 3. Payment methods distribution
    const paymentMethods = await dbQuery<{ payment_method: string; total_amount: string; count: string }>(
      `
      SELECT payment_method,
             COALESCE(SUM(amount), 0) as total_amount,
             COUNT(*) as count
      FROM payments
      WHERE business_id = $1
      GROUP BY payment_method
      ORDER BY total_amount DESC
      `,
      [session.business_id]
    );

    // 4. Inventory Valuation
    const valuation = await dbQuery<{ total_items: string; total_units: string; cost_value: string; retail_value: string }>(
      `
      SELECT COUNT(*) as total_items,
             COALESCE(SUM(stock_quantity), 0) as total_units,
             COALESCE(SUM(stock_quantity * cost_price), 0) as cost_value,
             COALESCE(SUM(stock_quantity * selling_price), 0) as retail_value
      FROM products
      WHERE business_id = $1 AND status = 'active'
      `,
      [session.business_id]
    );

    return NextResponse.json({
      success: true,
      sales_by_day: salesByDay.reverse(),
      top_products: topProducts,
      payment_methods: paymentMethods,
      valuation: valuation[0] || {
        total_items: '0',
        total_units: '0',
        cost_value: '0',
        retail_value: '0',
      },
    });
  } catch (error) {
    console.error('Failed to generate business reports:', error);
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 });
  }
}
