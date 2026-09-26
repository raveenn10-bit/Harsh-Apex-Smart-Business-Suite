'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Building2, Users, ShoppingCart, DollarSign, 
  RotateCcw, CheckCircle, MessageSquare, Phone, Mail, Loader2, ArrowRight
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  is_demo: boolean;
  package_code: string;
  package_name: string;
  staff_count: string | number;
  total_orders: string | number;
  total_revenue: string | number;
}

interface Lead {
  id: string;
  customer_name: string;
  business_name: string;
  whatsapp_number: string;
  email: string;
  interested_package: string;
  message: string | null;
  status: string;
  created_at: string;
}

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const [kpis, setKpis] = useState({
    total_tenants: 0,
    global_revenue: 0,
    global_orders: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, leadsRes] = await Promise.all([
        fetch('/api/super-admin/tenants'),
        fetch('/api/leads'),
      ]);

      const tenantsData = await tenantsRes.json();
      const leadsData = await leadsRes.json();

      if (tenantsData.success) {
        setTenants(tenantsData.tenants || []);
        if (tenantsData.kpis) setKpis(tenantsData.kpis);
      }
      if (leadsData.success) {
        setLeads(leadsData.leads || []);
      }
    } catch (err) {
      console.error('Super admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetDemo = async () => {
    if (!confirm('Are you sure you want to refresh all 6 demo workspaces to their standard baseline state?')) {
      return;
    }

    try {
      setResetting(true);
      const res = await fetch('/api/super-admin/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAlertMsg(data.message);
        await fetchData();
        setTimeout(() => setAlertMsg(null), 5000);
      } else {
        alert(data.error || 'Failed to refresh demo');
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                Harsh Apex Digital Solutions Core
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mt-1">
              <ShieldAlert className="w-8 h-8 text-rose-600" />
              Multi-Tenant Cloud Control Console
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Global tenant orchestration, subscription package allocations, customer inquiries, and isolated demo environment resets.
            </p>
          </div>

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Refresh Demo Workspaces
          </button>
        </div>

        {alertMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{alertMsg}</span>
          </div>
        )}

        {/* Global KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tenants</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{kpis.total_tenants} Businesses</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform GMV</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5 font-mono">
                Rs. {Number(kpis.global_revenue).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cumulative Orders</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{kpis.global_orders} Orders</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inbound Inquiries</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{leads.length} Leads</p>
            </div>
          </div>
        </div>

        {/* Tenant Directory */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Tenant Workspaces & Package Entitlements
            </h2>
            <span className="text-xs text-slate-400">Strict `business_id` Isolation</span>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Business Name & Slug</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Package Tier</th>
                    <th className="px-4 py-3 text-center">Staff</th>
                    <th className="px-4 py-3 text-center">Orders</th>
                    <th className="px-4 py-3 text-right">GMV (LKR)</th>
                    <th className="px-4 py-3 text-center">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{t.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">slug: {t.slug}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{t.business_type}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.package_code === 'PREMIUM'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : t.package_code === 'BUSINESS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {t.package_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{t.staff_count}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{t.total_orders}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        Rs. {Number(t.total_revenue).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inbound Leads Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                Commercial Consultation Inquiries (Leads Pipeline)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Prospective business clients requesting consultations</p>
            </div>
          </div>

          {leads.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No consultation inquiries received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Client Name</th>
                    <th className="px-4 py-3">Business Name</th>
                    <th className="px-4 py-3">WhatsApp Mobile</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Target Tier</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{l.customer_name}</td>
                      <td className="px-4 py-3 text-slate-700">{l.business_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{l.whatsapp_number}</td>
                      <td className="px-4 py-3 text-slate-500">{l.email}</td>
                      <td className="px-4 py-3 font-bold text-indigo-700">{l.interested_package}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-500">{l.message || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`https://wa.me/${l.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Chat
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
