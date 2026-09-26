'use client';

import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Users, Activity, Sparkles, 
  Calendar, Clock, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export default function AdvancedAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('month');

  const hourlyTraffic = [
    { hour: '09:00', orders: 4, traffic: 15 },
    { hour: '11:00', orders: 12, traffic: 45 },
    { hour: '13:00', orders: 18, traffic: 70 },
    { hour: '15:00', orders: 14, traffic: 55 },
    { hour: '17:00', orders: 24, traffic: 90 },
    { hour: '19:00', orders: 28, traffic: 110 },
    { hour: '21:00', orders: 8, traffic: 30 },
  ];

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              Advanced Analytics & Predictive AI
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Deep machine learning forecasting, footfall heatmaps, peak hour staffing models, and customer LTV analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Premium Predictive Model
          </div>
        </div>

        {/* 3 Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Customer Lifetime Value (LTV)</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              Rs. 42,500.00
            </div>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs previous period
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Projected Next Month Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              Rs. 485,000.00
            </div>
            <p className="text-xs text-slate-400">
              Confidence interval: 94.6% based on order trajectory
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Customer Repeat Rate</span>
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              68.4%
            </div>
            <p className="text-xs text-slate-400">
              High retention fueled by WhatsApp receipt touchpoints
            </p>
          </div>
        </div>

        {/* Peak Hours Footfall Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Hourly Store Traffic & Checkout Velocity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Identify rush hours to schedule cashier coverage</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {hourlyTraffic.map((ht, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-700">{ht.hour}</span>
                  <span className="text-slate-500">{ht.orders} orders ({ht.traffic}% capacity)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ht.traffic >= 80 ? 'bg-indigo-600' : ht.traffic >= 50 ? 'bg-blue-500' : 'bg-slate-300'
                    }`}
                    style={{ width: `${ht.traffic}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
