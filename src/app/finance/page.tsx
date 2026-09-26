'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, PieChart,
  ArrowUpRight, ArrowDownRight, Layers, FileSpreadsheet, Loader2,
  Calendar, CheckCircle, Percent, AlertCircle
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface FinanceSummary {
  total_revenue: number;
  order_count: number;
  cogs: number;
  gross_profit: number;
  gross_margin_percent: number;
  total_expenses: number;
  expense_count: number;
  net_profit: number;
  net_margin_percent: number;
  total_collected: number;
  total_receivables: number;
}

interface CategoryBreakdown {
  category_name: string;
  total_amount: string | number;
  count: string | number;
}

interface MonthlyPoint {
  month: string;
  revenue?: string | number;
  expense?: string | number;
}

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlyPoint[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setCategories(data.category_breakdown || []);
        setMonthlySales(data.monthly_sales || []);
        setMonthlyExpenses(data.monthly_expenses || []);
      }
    } catch (err) {
      console.error('Failed to load financial records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-600" />
              Financial & Profit Analytics
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time Profit & Loss statement, Gross vs Net margin tracking, COGS, and operating expense breakdown.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Print P&L Statement
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Reconciling financial ledgers...</p>
          </div>
        ) : summary ? (
          <>
            {/* Top 4 Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gross Revenue */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 font-mono">
                    Rs. {Number(summary.total_revenue).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    From <strong className="text-slate-700">{summary.order_count}</strong> completed orders
                  </p>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Profit</span>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-teal-600 font-mono">
                    Rs. {Number(summary.gross_profit).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Gross Margin: <strong className="text-teal-700">{summary.gross_margin_percent}%</strong>
                  </p>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operating Expenses</span>
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-rose-600 font-mono">
                    Rs. {Number(summary.total_expenses).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Across <strong className="text-slate-700">{summary.expense_count}</strong> expense entries
                  </p>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Operating Profit</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    summary.net_profit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {summary.net_profit >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`text-2xl font-bold font-mono ${
                    summary.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    Rs. {Number(summary.net_profit).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Net Margin: <strong className={summary.net_profit >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {summary.net_margin_percent}%
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Cash Flow Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Actual Cash Collected</p>
                  <p className="text-xl font-bold text-emerald-900 font-mono mt-1">
                    Rs. {Number(summary.total_collected).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">Recorded via Cash, Cards, and Verified Bank Transfers</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Outstanding Receivables (Credit)</p>
                  <p className="text-xl font-bold text-amber-900 font-mono mt-1">
                    Rs. {Number(summary.total_receivables).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">Unpaid customer invoices pending settlement</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Percent className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Detailed P&L Waterfall Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Comprehensive Income Statement (P&L Breakdown)
              </h2>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                <div className="divide-y divide-slate-100 font-mono">
                  {/* Revenue */}
                  <div className="flex justify-between items-center p-3.5 bg-slate-50/80 font-sans">
                    <span className="font-bold text-slate-900">Gross Sales Revenue</span>
                    <span className="font-bold text-blue-600 font-mono">
                      + Rs. {Number(summary.total_revenue).toFixed(2)}
                    </span>
                  </div>

                  {/* COGS */}
                  <div className="flex justify-between items-center p-3 text-slate-600 pl-8 font-sans">
                    <span className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">-</span>
                      Cost of Goods Sold (COGS - Product Sourcing Cost)
                    </span>
                    <span className="text-red-600 font-mono">
                      - Rs. {Number(summary.cogs).toFixed(2)}
                    </span>
                  </div>

                  {/* Gross Profit Line */}
                  <div className="flex justify-between items-center p-3.5 bg-teal-50/40 font-sans border-t-2 border-slate-200">
                    <div>
                      <span className="font-bold text-teal-900">Gross Operating Profit</span>
                      <span className="text-xs text-teal-700 font-normal ml-2">({summary.gross_margin_percent}% margin)</span>
                    </div>
                    <span className="font-bold text-teal-700 font-mono">
                      Rs. {Number(summary.gross_profit).toFixed(2)}
                    </span>
                  </div>

                  {/* Operating Expenses */}
                  <div className="flex justify-between items-center p-3 text-slate-600 pl-8 font-sans">
                    <span className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">-</span>
                      Total Operational Expenses (Rent, Bills, Salaries, Overheads)
                    </span>
                    <span className="text-red-600 font-mono">
                      - Rs. {Number(summary.total_expenses).toFixed(2)}
                    </span>
                  </div>

                  {/* Net Profit Line */}
                  <div className={`flex justify-between items-center p-4 font-sans border-t-2 border-slate-300 ${
                    summary.net_profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                  }`}>
                    <div>
                      <span className={`text-base font-bold ${
                        summary.net_profit >= 0 ? 'text-emerald-900' : 'text-red-900'
                      }`}>
                        Net Operating Income (Bottom Line Profit)
                      </span>
                      <span className="text-xs text-slate-500 ml-2">({summary.net_margin_percent}% net margin)</span>
                    </div>
                    <span className={`text-xl font-bold font-mono ${
                      summary.net_profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      Rs. {Number(summary.net_profit).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Allocation Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-rose-600" />
                Operational Expense Allocation
              </h2>

              {categories.length === 0 ? (
                <p className="text-sm text-slate-400">No categorized expenses recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat, idx) => {
                    const amt = Number(cat.total_amount);
                    const pct = summary.total_expenses > 0 ? Math.round((amt / summary.total_expenses) * 100) : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span className="font-semibold">{cat.category_name} ({cat.count} items)</span>
                          <span className="font-mono">
                            Rs. {amt.toLocaleString('en-LK', { minimumFractionDigits: 2 })} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
