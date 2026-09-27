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
  FileText,
  CreditCard,
  Radio,
  Zap,
  ChevronRight,
  UserCheck,
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

  const isPremium = session.package_code === 'PREMIUM';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Apple Card / Titanium Digital Pass (Hero Banner) */}
      <div className="relative overflow-hidden rounded-[26px] sm:rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-7 shadow-xl shadow-slate-950/20 border border-white/10 select-none">
        {/* Ambient Holographic Glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            {/* Top Pass Status & Metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                {session.business_name}
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/90">{session.package_code} SUITE</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-white/50">
                <Radio className="w-3 h-3 text-emerald-400" /> Live Sync
              </div>
            </div>

            {/* Greeting */}
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {session.full_name}
            </h1>
            <p className="text-[11px] sm:text-xs text-white/70">
              Workspace ID: <span className="font-mono text-blue-200">{session.business_slug}</span> &bull; Currency: {session.currency} ({session.currency_symbol.trim()})
            </p>
          </div>

          {/* iOS Tap-Friendly Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1 sm:pt-0">
            <Link href="/pos" className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs h-11 px-5 rounded-2xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all">
                <ShoppingCart className="w-4 h-4 mr-2 shrink-0" />
                Open POS Register
              </Button>
            </Link>
            <Link href="/products" className="shrink-0">
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 hover:bg-white/15 text-white backdrop-blur-md font-semibold text-xs h-11 px-4 rounded-2xl active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. iOS Control Center Quick Actions Bar (Mobile First) */}
      <div className="block lg:hidden">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2 flex items-center justify-between">
          <span>Quick Actions</span>
          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">1-Tap Shortcuts</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <Link
            href="/pos"
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs active:scale-90 transition-transform text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">POS</span>
          </Link>

          <Link
            href="/invoices"
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs active:scale-90 transition-transform text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">Invoice</span>
          </Link>

          <Link
            href="/products"
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs active:scale-90 transition-transform text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">Product</span>
          </Link>

          <Link
            href="/customers"
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs active:scale-90 transition-transform text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">Clients</span>
          </Link>

          <Link
            href="/ai-assistant"
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs active:scale-90 transition-transform text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-1.5">AI</span>
          </Link>
        </div>
      </div>

      {/* 3. Apple Intelligence AI Card (If Premium) */}
      {isPremium && (
        <div className="relative p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-purple-950/30 border border-purple-500/30 backdrop-blur-md text-purple-950 dark:text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-950 dark:text-purple-100 flex items-center gap-1.5">
                Harsh Apex AI Business Intelligence
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-600 text-white font-black">ACTIVE</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Predicted weekly demand is trending +14.2%. Replenish high-turnover staples before the weekend rush.
              </p>
            </div>
          </div>
          <Link href="/ai-assistant" className="self-end sm:self-auto shrink-0">
            <Button size="sm" variant="ghost" className="text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl h-9 px-3">
              Ask AI <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* 4. Core Metrics 2x2 Widget Grid (iOS Stocks / Fitness Widget Aesthetic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <Card className="rounded-[22px] sm:rounded-2xl border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs hover:border-blue-400/40 transition active:scale-[0.98] select-none">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 p-3.5 sm:p-5">
            <CardTitle className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </CardTitle>
            <div className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {session.currency_symbol}
              {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +18.4%
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="rounded-[22px] sm:rounded-2xl border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs hover:border-emerald-400/40 transition active:scale-[0.98] select-none">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 p-3.5 sm:p-5">
            <CardTitle className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Completed Sales
            </CardTitle>
            <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalOrders}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
              Islandwide POS
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="rounded-[22px] sm:rounded-2xl border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs hover:border-indigo-400/40 transition active:scale-[0.98] select-none">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 p-3.5 sm:p-5">
            <CardTitle className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Customers
            </CardTitle>
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalCustomers}
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 truncate">
              Active CRM profiles
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="rounded-[22px] sm:rounded-2xl border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs hover:border-amber-400/40 transition active:scale-[0.98] select-none">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 p-3.5 sm:p-5">
            <CardTitle className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Low Stock
            </CardTitle>
            <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {lowStockCount}
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 font-medium truncate">
              Needs restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 5. Main Dual Grid: Recent Transactions (Apple Pay Style) & Low Stock Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Recent Transactions List (iOS Grouped Style) */}
        <div className="lg:col-span-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 sm:p-6 rounded-[26px] sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Recent POS Transactions
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Live order activity stream</p>
            </div>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl h-8 px-2.5">
                View All &rarr;
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between py-3 sm:py-3.5 px-2 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition select-none"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ord.order_number}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                      <span>{ord.customer_name || 'Walk-in'}</span>
                      <span>&bull;</span>
                      <span className="uppercase font-semibold text-[10px] text-slate-600 dark:text-slate-400">
                        {ord.payment_method}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {session.currency_symbol}
                    {Number(ord.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 px-1.5 py-0">
                    {ord.payment_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts & Quick Tools */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Low Stock List */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 sm:p-6 rounded-[26px] sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock Watchlist
              </h3>
              <Link href="/inventory" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-2.5">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs active:scale-[0.98] transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">
                      {p.stock_quantity} left
                    </span>
                    <div className="text-[9px] text-slate-400">Min: {p.min_stock_level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 sm:p-6 rounded-[26px] sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Essential Modules
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/pos">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start rounded-xl h-10 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition">
                  <ShoppingCart className="w-3.5 h-3.5 mr-2 text-blue-600" />
                  POS Register
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start rounded-xl h-10 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition">
                  <Plus className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                  Products
                </Button>
              </Link>
              <Link href="/customers">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start rounded-xl h-10 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition">
                  <Users className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                  Customers
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start rounded-xl h-10 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition">
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
