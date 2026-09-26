import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const query = prompt.toLowerCase().trim();

    // Fetch tenant contextual data to ground the AI response in real numbers
    const [revRes, topProdRes, lowStockRes, clientRes, expRes] = await Promise.all([
      dbQuery<{ total_revenue: string; order_count: string }>(
        `SELECT COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(*) as order_count FROM orders WHERE business_id = $1 AND status != 'cancelled'`,
        [session.business_id]
      ),
      dbQuery<{ name: string; total_qty: string; total_rev: string }>(
        `
        SELECT p.name, SUM(oi.quantity) as total_qty, SUM(oi.total_price) as total_rev
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.business_id = $1
        GROUP BY p.name ORDER BY total_rev DESC LIMIT 3
        `,
        [session.business_id]
      ),
      dbQuery<{ name: string; stock_quantity: number; min_stock_level: number }>(
        `SELECT name, stock_quantity, min_stock_level FROM products WHERE business_id = $1 AND stock_quantity <= min_stock_level AND status = 'active' LIMIT 5`,
        [session.business_id]
      ),
      dbQuery<{ total_customers: string; outstanding_total: string }>(
        `SELECT COUNT(*) as total_customers, COALESCE(SUM(outstanding_balance), 0) as outstanding_total FROM customers WHERE business_id = $1`,
        [session.business_id]
      ),
      dbQuery<{ total_expense: string }>(
        `SELECT COALESCE(SUM(amount), 0) as total_expense FROM expenses WHERE business_id = $1`,
        [session.business_id]
      )
    ]);

    const totalRev = Number(revRes[0]?.total_revenue || 0);
    const orderCount = Number(revRes[0]?.order_count || 0);
    const totalExp = Number(expRes[0]?.total_expense || 0);
    const estProfit = totalRev - totalExp;
    const lowStockItems = lowStockRes;
    const topProducts = topProdRes;
    const clientCount = Number(clientRes[0]?.total_customers || 0);
    const outstandingDebt = Number(clientRes[0]?.outstanding_total || 0);

    let answer = '';
    let category = 'general';

    if (query.includes('sales') || query.includes('revenue') || query.includes('profit') || query.includes('income')) {
      category = 'financial_analysis';
      answer = `Based on your live verified transaction records for **${session.business_name}**:\n\n` +
        `• **Gross Sales Revenue:** Rs. ${totalRev.toLocaleString('en-LK', { minimumFractionDigits: 2 })}\n` +
        `• **Total Completed Orders:** ${orderCount} transactions\n` +
        `• **Total Recorded Expenses:** Rs. ${totalExp.toLocaleString('en-LK', { minimumFractionDigits: 2 })}\n` +
        `• **Current Net Operational Surplus:** Rs. ${estProfit.toLocaleString('en-LK', { minimumFractionDigits: 2 })}\n\n` +
        `💡 **Advisor Insight:** Your average order value is **Rs. ${orderCount > 0 ? Math.round(totalRev / orderCount).toLocaleString('en-LK') : '0'}**. ` +
        (estProfit > 0 
          ? `Your business is operating at a positive operating surplus. Consider reinvesting into high-velocity inventory.` 
          : `Expenses are tracking closely with sales. Monitor recurring overheads in your Expenses tab.`);

    } else if (query.includes('stock') || query.includes('inventory') || query.includes('reorder') || query.includes('low')) {
      category = 'inventory_alert';
      if (lowStockItems.length === 0) {
        answer = `Great news! None of your products are currently breaching minimum safety thresholds. All inventory levels are healthy across your warehouse catalog.`;
      } else {
        const itemsList = lowStockItems.map(i => `• **${i.name}**: ${i.stock_quantity} units remaining (Min threshold: ${i.min_stock_level})`).join('\n');
        answer = `⚠️ **Critical Inventory Reorder Alert:**\n\nThe following items have dropped below safety levels and need purchase orders:\n\n${itemsList}\n\n` +
          `📦 **Action Step:** Initiate supplier restock via the Inventory Management panel to avoid stockouts during peak retail hours.`;
      }

    } else if (query.includes('best seller') || query.includes('top product') || query.includes('popular') || query.includes('sell')) {
      category = 'product_intelligence';
      if (topProducts.length === 0) {
        answer = `You haven't logged order line items yet. Start ringing up sales on the POS counter to generate product rankings!`;
      } else {
        const topList = topProducts.map((p, idx) => `**#${idx + 1} ${p.name}** — ${p.total_qty} units sold (Rs. ${Number(p.total_rev).toLocaleString('en-LK')})`).join('\n');
        answer = `Here are your current best-performing products by sales revenue:\n\n${topList}\n\n` +
          `📈 **Recommendation:** Feature these top items prominently near the counter or on your e-commerce storefront for upsell bundles.`;
      }

    } else if (query.includes('customer') || query.includes('debt') || query.includes('credit') || query.includes('client')) {
      category = 'crm_intelligence';
      answer = `Here is your current client portfolio status:\n\n` +
        `• **Registered Customers:** ${clientCount} accounts\n` +
        `• **Total Unsettled Credit / Receivables:** Rs. ${outstandingDebt.toLocaleString('en-LK', { minimumFractionDigits: 2 })}\n\n` +
        (outstandingDebt > 0 
          ? `⚠️ You have Rs. ${outstandingDebt.toLocaleString('en-LK')} pending recovery. Use our **WhatsApp Simulator** to send automated polite payment reminders with one tap!`
          : `✅ Clean receivables! No overdue customer balances detected.`);

    } else {
      category = 'strategic_recommendations';
      answer = `### 🌟 Harsh Apex AI Executive Summary for ${session.business_name}\n\n` +
        `1. **Cash Flow Health:** You have recorded **Rs. ${totalRev.toLocaleString('en-LK')}** in gross revenue across **${orderCount}** sales.\n` +
        `2. **Inventory Watch:** ${lowStockItems.length > 0 ? `⚠️ ${lowStockItems.length} SKU(s) require reordering soon.` : `✅ Stock levels are well balanced.`}\n` +
        `3. **Customer Credit:** Rs. ${outstandingDebt.toLocaleString('en-LK')} outstanding in customer credit balances.\n\n` +
        `🚀 **Strategic Priority for This Week:**\n` +
        `• Send automated WhatsApp receipts for all POS checkouts to grow customer mobile contact lists.\n` +
        `• Reorder low-stock SKUs before weekend rush.\n` +
        `• Run a promotional WhatsApp campaign to re-engage past clients.`;
    }

    return NextResponse.json({
      success: true,
      answer,
      category,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to generate AI Assistant response:', error);
    return NextResponse.json({ error: 'AI Assistant temporarily unavailable' }, { status: 500 });
  }
}
