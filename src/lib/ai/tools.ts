/**
 * Server-side AI business query tools.
 * business_id is ALWAYS injected from the verified server session.
 * These functions NEVER accept business_id from AI model output.
 */
import { dbQuery } from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

// ─── Tool Functions ──────────────────────────────────────────────────────────

export async function getTodaySales(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count
       FROM orders
       WHERE business_id = $1
         AND status != 'cancelled'
         AND DATE(created_at) = CURRENT_DATE`,
      [businessId]
    );
    return { ok: true, data: { total_revenue: Number(rows[0]?.total || 0), order_count: Number(rows[0]?.count || 0) } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getMonthlySales(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count
       FROM orders
       WHERE business_id = $1
         AND status != 'cancelled'
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
      [businessId]
    );
    return { ok: true, data: { total_revenue: Number(rows[0]?.total || 0), order_count: Number(rows[0]?.count || 0) } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getMonthlyRevenue(businessId: string): Promise<ToolResult> {
  return getMonthlySales(businessId);
}

export async function getMonthlyExpenses(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE business_id = $1
         AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)`,
      [businessId]
    );
    return { ok: true, data: { total_expenses: Number(rows[0]?.total || 0) } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getMonthlyProfit(businessId: string): Promise<ToolResult> {
  const [revResult, expResult] = await Promise.all([
    getMonthlyRevenue(businessId),
    getMonthlyExpenses(businessId),
  ]);
  if (!revResult.ok || !expResult.ok) return { ok: false, error: 'Failed to calculate profit' };
  const rev = (revResult.data as { total_revenue: number }).total_revenue;
  const exp = (expResult.data as { total_expenses: number }).total_expenses;
  return { ok: true, data: { monthly_revenue: rev, monthly_expenses: exp, net_profit: rev - exp } };
}

export async function getLowStockProducts(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ name: string; stock_quantity: number; min_stock_level: number; sku: string }>(
      `SELECT name, sku, stock_quantity, min_stock_level
       FROM products
       WHERE business_id = $1
         AND stock_quantity <= min_stock_level
         AND status = 'active'
       ORDER BY stock_quantity ASC LIMIT 10`,
      [businessId]
    );
    return { ok: true, data: { low_stock_items: rows, count: rows.length } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getTopSellingProducts(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ name: string; total_qty: string; total_revenue: string }>(
      `SELECT p.name,
              SUM(oi.quantity) AS total_qty,
              SUM(oi.total_price) AS total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.business_id = $1
       GROUP BY p.name
       ORDER BY total_revenue DESC LIMIT 5`,
      [businessId]
    );
    return { ok: true, data: { top_products: rows.map(r => ({ ...r, total_qty: Number(r.total_qty), total_revenue: Number(r.total_revenue) })) } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getTopCustomers(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ name: string; total_orders: string; total_spent: string; outstanding_balance: number }>(
      `SELECT c.name,
              COUNT(o.id) AS total_orders,
              COALESCE(SUM(o.total_amount), 0) AS total_spent,
              c.outstanding_balance
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id AND o.business_id = $1
       WHERE c.business_id = $1
       GROUP BY c.id, c.name, c.outstanding_balance
       ORDER BY total_spent DESC LIMIT 5`,
      [businessId]
    );
    return { ok: true, data: { top_customers: rows.map(r => ({ ...r, total_orders: Number(r.total_orders), total_spent: Number(r.total_spent) })) } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getUnpaidInvoices(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ id: string; customer_name: string; total_amount: number; due_date: string }>(
      `SELECT i.id, c.name AS customer_name, i.total_amount, i.due_date
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.business_id = $1
         AND i.status IN ('unpaid', 'overdue')
       ORDER BY i.due_date ASC LIMIT 10`,
      [businessId]
    );
    return { ok: true, data: { unpaid_invoices: rows, count: rows.length } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getRecentOrders(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ id: string; customer_name: string | null; total_amount: number; status: string; created_at: string }>(
      `SELECT o.id, c.name AS customer_name, o.total_amount, o.status, o.created_at
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.business_id = $1
       ORDER BY o.created_at DESC LIMIT 10`,
      [businessId]
    );
    return { ok: true, data: { recent_orders: rows } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getInventorySummary(businessId: string): Promise<ToolResult> {
  try {
    const rows = await dbQuery<{ total_products: string; total_value: string; low_stock_count: string; out_of_stock_count: string }>(
      `SELECT
         COUNT(*) AS total_products,
         COALESCE(SUM(stock_quantity * cost_price), 0) AS total_value,
         COUNT(*) FILTER (WHERE stock_quantity <= min_stock_level AND stock_quantity > 0) AS low_stock_count,
         COUNT(*) FILTER (WHERE stock_quantity = 0) AS out_of_stock_count
       FROM products
       WHERE business_id = $1 AND status = 'active'`,
      [businessId]
    );
    const r = rows[0];
    return {
      ok: true,
      data: {
        total_products: Number(r?.total_products || 0),
        total_inventory_value: Number(r?.total_value || 0),
        low_stock_count: Number(r?.low_stock_count || 0),
        out_of_stock_count: Number(r?.out_of_stock_count || 0),
      },
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── Tool Registry (server-side dispatch, business_id always bound by caller) ─

export type ToolName =
  | 'getTodaySales'
  | 'getMonthlySales'
  | 'getMonthlyRevenue'
  | 'getMonthlyExpenses'
  | 'getMonthlyProfit'
  | 'getLowStockProducts'
  | 'getTopSellingProducts'
  | 'getTopCustomers'
  | 'getUnpaidInvoices'
  | 'getRecentOrders'
  | 'getInventorySummary';

const toolFunctions: Record<ToolName, (bid: string) => Promise<ToolResult>> = {
  getTodaySales,
  getMonthlySales,
  getMonthlyRevenue,
  getMonthlyExpenses,
  getMonthlyProfit,
  getLowStockProducts,
  getTopSellingProducts,
  getTopCustomers,
  getUnpaidInvoices,
  getRecentOrders,
  getInventorySummary,
};

/**
 * Execute a named tool with a server-enforced business_id.
 * The AI model CANNOT pass a business_id — it's always from the session.
 */
export async function executeBusinessTool(name: string, businessId: string): Promise<ToolResult> {
  const fn = toolFunctions[name as ToolName];
  if (!fn) return { ok: false, error: `Unknown tool: ${name}` };
  return fn(businessId);
}

// ─── Gemini Function Declarations (what the model sees — NO business_id arg) ─

export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: 'getTodaySales',
    description: "Get today's total sales revenue and order count for the business.",
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getMonthlySales',
    description: "Get this month's total sales revenue and order count.",
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getMonthlyRevenue',
    description: 'Get total revenue earned this calendar month.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getMonthlyExpenses',
    description: 'Get total expenses recorded this calendar month.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getMonthlyProfit',
    description: 'Get net profit (revenue minus expenses) for this month.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getLowStockProducts',
    description: 'List products that have dropped below their minimum stock threshold and need reordering.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getTopSellingProducts',
    description: 'Get the top 5 best-selling products by revenue.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getTopCustomers',
    description: 'Get top 5 customers by total spending.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getUnpaidInvoices',
    description: 'Get a list of unpaid or overdue invoices.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getRecentOrders',
    description: 'Get the 10 most recent sales orders.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getInventorySummary',
    description: 'Get an overview of inventory: total products, stock value, low stock count, and out-of-stock count.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
];
