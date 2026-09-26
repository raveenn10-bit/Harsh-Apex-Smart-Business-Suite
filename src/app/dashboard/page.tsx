import { getCurrentSession } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Receipt,
  Sparkles,
  Store,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  // Real database metrics for this tenant workspace
  const businessId = session.business_id;

  // 1. Orders count & revenue
  const orderStats = await query<{ count: string; total: string }>(
    `SELECT COUNT(*)::text as count, COALESCE(SUM(total_amount), 0)::text as total
     FROM orders WHERE business_id = $1`,
    [businessId]
  );
  const totalOrders = parseInt(orderStats[0]?.count || '0', 10);
  const totalRevenue = parseFloat(orderStats[0]?.total || '0');

  // 2. Customers count
  const custStats = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM customers WHERE business_id = $1`,
    [businessId]
  );
  const totalCustomers = parseInt(custStats[0]?.count || '0', 10);

  // 3. Low stock count
  const lowStockStats = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM products 
     WHERE business_id = $1 AND stock_quantity <= min_stock_level`,
    [businessId]
  );
  const lowStockCount = parseInt(lowStockStats[0]?.count || '0', 10);

  // 4. Recent orders
  const recentOrders = await query<{
    id: string;
    order_number: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
    customer_name: string | null;
  }>(
    `SELECT o.id, o.order_number, o.total_amount, o.payment_method, o.payment_status, o.created_at,
            c.name as customer_name
     FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE o.business_id = $1
     ORDER BY o.created_at DESC LIMIT 5`,
    [businessId]
  );

  // 5. Low stock product alerts
  const lowStockProducts = await query<{
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    min_stock_level: number;
  }>(
    `SELECT id, name, sku, stock_quantity, min_stock_level
     FROM products
     WHERE business_id = $1 AND stock_quantity <= min_stock_level
     ORDER BY stock_quantity ASC LIMIT 4`,
    [businessId]
  );

  const isBusinessOrPremium = session.package_code === 'BUSINESS' || session.package_code === 'PREMIUM';
  const isPremium = session.package_code === 'PREMIUM';

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              {session.business_name}
            </span>
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20 text-[10px] font-bold"
            >
              {session.package_code} SUITE
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {session.full_name}
          </h1>
          <p className="text-xs text-white/70">
            Real-time multi-tenant dashboard &bull; Isolated Workspace ID: {session.business_slug}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/pos">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-blue-500/30">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Open POS Register
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs h-10 px-3.5 rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Assistant Insight (If Premium) */}
      {isPremium && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-800/40 text-purple-900 dark:text-purple-200 flex items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-950 dark:text-purple-100 flex items-center gap-1.5">
                Harsh Apex AI Business Intelligence
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500 text-white font-black">ACTIVE</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Predicted weekly demand is trending +14.2%. Replenish high-turnover staples before the weekend rush.
              </p>
            </div>
          </div>
          <Link href="/ai-assistant">
            <Button size="sm" variant="ghost" className="text-purple-700 dark:text-purple-300 text-xs shrink-0 font-bold hover:bg-purple-100 dark:hover:bg-purple-900/50">
              Ask AI <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400/40 transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {session.currency_symbol}
              {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% from last period
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400/40 transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completed Sales
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalOrders}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Islandwide POS transactions
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400/40 transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Customers
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalCustomers}
            </div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
              Active CRM profiles
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-400/40 transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Items
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {lowStockCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Requires immediate stock replenishment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dual Grid: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent POS Transactions
              </h3>
              <p className="text-xs text-slate-500">Live order stream for this workspace</p>
            </div>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600">
                View All Invoices &rarr;
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100/60 dark:bg-blue-950/60 text-blue-600">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {ord.order_number}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {ord.customer_name || 'Walk-in Customer'} &bull; Payment:{' '}
                      <span className="uppercase font-semibold">{ord.payment_method}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {session.currency_symbol}
                    {Number(ord.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 border-emerald-200">
                    {ord.payment_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts & Quick Tools */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock Warning
              </h3>
              <Link href="/inventory" className="text-[11px] font-bold text-blue-600 hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/40 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{p.sku}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-amber-700 dark:text-amber-400">
                      {p.stock_quantity} left
                    </span>
                    <div className="text-[9px] text-slate-400">Min: {p.min_stock_level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quick Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/pos">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start">
                  <ShoppingCart className="w-3.5 h-3.5 mr-2 text-blue-600" />
                  POS Register
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start">
                  <Plus className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                  Products
                </Button>
              </Link>
              <Link href="/customers">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start">
                  <Users className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                  Customers
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start">
                  <TrendingUp className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
