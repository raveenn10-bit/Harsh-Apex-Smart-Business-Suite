'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Calendar, TrendingUp, Package, 
  CreditCard, DollarSign, Loader2, ArrowUpRight, Award
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface SalesDay {
  day: string;
  daily_revenue: string | number;
  order_count: string | number;
}

interface TopProduct {
  name: string;
  sku: string;
  total_qty: string | number;
  total_revenue: string | number;
  total_cost: string | number;
  gross_profit: string | number;
}

interface PaymentMethodStat {
  payment_method: string;
  total_amount: string | number;
  count: string | number;
}

interface Valuation {
  total_items: string | number;
  total_units: string | number;
  cost_value: string | number;
  retail_value: string | number;
}

export default function ReportsPage() {
  const [salesDays, setSalesDays] = useState<SalesDay[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStat[]>([]);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setSalesDays(data.sales_by_day || []);
        setTopProducts(data.top_products || []);
        setPaymentMethods(data.payment_methods || []);
        setValuation(data.valuation || null);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  const handleExportCSV = () => {
    if (topProducts.length === 0) return;
    const headers = ['Product Name', 'SKU', 'Units Sold', 'Revenue (Rs.)', 'COGS (Rs.)', 'Profit (Rs.)'];
    const rows = topProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      p.total_qty,
      p.total_revenue,
      p.total_cost,
      p.gross_profit,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Executive Reports & Intelligence
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Analyze product sales velocity, inventory asset valuation, and payment channel distribution.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs">
              {['7', '30', '90'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    range === r ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Last {r} Days
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Aggregating transactional reporting data...</p>
          </div>
        ) : (
          <>
            {/* Inventory Valuation KPIs */}
            {valuation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalog SKUs</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{valuation.total_items} Products</p>
                  <p className="text-xs text-slate-400 mt-0.5">{valuation.total_units} total physical units</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Valuation (Cost)</p>
                  <p className="text-xl font-bold text-slate-900 font-mono mt-1">
                    Rs. {Number(valuation.cost_value).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Capital tied in inventory</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Retail Value</p>
                  <p className="text-xl font-bold text-blue-600 font-mono mt-1">
                    Rs. {Number(valuation.retail_value).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Potential full sales value</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projected Gross Margin</p>
                  <p className="text-xl font-bold text-emerald-600 font-mono mt-1">
                    Rs. {(Number(valuation.retail_value) - Number(valuation.cost_value)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {Number(valuation.retail_value) > 0
                      ? `${Math.round(((Number(valuation.retail_value) - Number(valuation.cost_value)) / Number(valuation.retail_value)) * 100)}% estimated markup`
                      : '0% markup'}
                  </p>
                </div>
              </div>
            )}

            {/* Top Best-Selling Products */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Top Performing Products by Revenue
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Items delivering highest gross sales and margins</p>
                </div>
              </div>

              {topProducts.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No sales records in selected date range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3 text-center">Units Sold</th>
                        <th className="px-4 py-3 text-right">Revenue (Rs.)</th>
                        <th className="px-4 py-3 text-right">Profit (Rs.)</th>
                        <th className="px-4 py-3 text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {topProducts.map((p, idx) => {
                        const rev = Number(p.total_revenue);
                        const prof = Number(p.gross_profit);
                        const margin = rev > 0 ? Math.round((prof / rev) * 100) : 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-slate-400">#{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">{p.sku}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-800">{p.total_qty}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                              Rs. {rev.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                              Rs. {prof.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-700">
                              {margin}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment Methods & Daily Run Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods Distribution */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Payment Channel Distribution
                </h2>

                <div className="space-y-3">
                  {paymentMethods.map((pm, idx) => {
                    const amt = Number(pm.total_amount);
                    const totalAll = paymentMethods.reduce((s, p) => s + Number(p.total_amount), 0);
                    const pct = totalAll > 0 ? Math.round((amt / totalAll) * 100) : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold capitalize text-slate-800">
                            {pm.payment_method.replace('_', ' ')} ({pm.count} txns)
                          </span>
                          <span className="font-mono text-slate-600">
                            Rs. {amt.toLocaleString('en-LK', { minimumFractionDigits: 2 })} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Sales Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Daily Revenue Performance
                </h2>

                <div className="max-h-60 overflow-y-auto pr-1 text-xs divide-y divide-slate-100">
                  {salesDays.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center">No sales during this timeframe.</p>
                  ) : (
                    salesDays.map((d, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-slate-900">{d.day}</span>
                          <span className="text-slate-400 ml-2">({d.order_count} orders)</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          Rs. {Number(d.daily_revenue).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
