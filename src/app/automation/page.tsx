'use client';

import React, { useState } from 'react';
import { 
  Zap, Bell, ShoppingCart, MessageSquare, AlertTriangle, 
  CheckCircle, Clock, ShieldCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  description: string;
  channel: string;
  active: boolean;
}

export default function AutomationCenterPage() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Instant WhatsApp POS Receipt',
      trigger: 'When an order is completed at POS Counter',
      action: 'Format receipt and dispatch to customer WhatsApp number',
      description: 'Zero paper cost and collects customer mobile contacts automatically.',
      channel: 'WhatsApp',
      active: true,
    },
    {
      id: '2',
      name: 'Manager Low-Stock Emergency Alert',
      trigger: 'When any product inventory drops below safety threshold',
      action: 'Send urgent WhatsApp notification to store manager with restock count',
      description: 'Prevents stockouts on top selling items during busy store days.',
      channel: 'WhatsApp',
      active: true,
    },
    {
      id: '3',
      name: 'Automated Invoice Due-Date Reminder',
      trigger: '3 days prior to invoice due date if balance > 0',
      action: 'Dispatch polite payment reminder with bank transfer details',
      description: 'Reduces overdue receivables by 40% without awkward manual phone calls.',
      channel: 'WhatsApp / Email',
      active: true,
    },
    {
      id: '4',
      name: 'Daily Evening Revenue Briefing',
      trigger: 'Every day at 9:00 PM local time',
      action: 'Send daily sales, gross margin & cash breakdown to business owner',
      description: 'Receive end-of-day store performance snapshot right to your personal phone.',
      channel: 'Harsh Apex AI',
      active: true,
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newState = !r.active;
          setNotification(`"${r.name}" has been ${newState ? 'activated' : 'paused'}.`);
          setTimeout(() => setNotification(null), 3000);
          return { ...r, active: newState };
        }
        return r;
      })
    );
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-500" />
              Smart Business Automation Center
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Event-driven business rules, automated customer messaging, stock monitors, and scheduled owner reports.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            4 Background Triggers Online
          </div>
        </div>

        {notification && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
        )}

        {/* Automation Rule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-6 rounded-3xl border transition duration-200 flex flex-col justify-between space-y-4 ${
                rule.active
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {rule.channel}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{rule.name}</h3>
                  </div>

                  <button
                    onClick={() => toggleRule(rule.id)}
                    className="text-slate-500 hover:text-slate-900 transition"
                    title={rule.active ? 'Pause Rule' : 'Activate Rule'}
                  >
                    {rule.active ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">{rule.description}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Trigger</span>
                  <span className="font-medium text-slate-800">{rule.trigger}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Automated Action</span>
                  <span className="font-medium text-indigo-700">{rule.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
