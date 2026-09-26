'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Search, Plus, MessageSquare, Phone, Mail, 
  Crown, Star, Clock, Calendar, Send, Loader2, X, ChevronRight, User
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface CRMCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  total_purchases: number;
  total_orders: number;
  outstanding_balance: number;
  last_purchase_at: string | null;
  note_count: string | number;
  tier: string;
}

interface CRMNote {
  id: string;
  note: string;
  created_at: string;
  author_name: string | null;
}

interface RecentActivityNote {
  id: string;
  note: string;
  created_at: string;
  customer_id: string;
  customer_name: string;
  author_name: string | null;
}

export default function CRMPage() {
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [recentNotes, setRecentNotes] = useState<RecentActivityNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Customer Notes Modal
  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomer | null>(null);
  const [customerNotes, setCustomerNotes] = useState<CRMNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchCRMData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/crm?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        setRecentNotes(data.recent_notes || []);
      }
    } catch (err) {
      console.error('Failed to load CRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, [tierFilter, search]);

  const handleOpenNotes = async (cust: CRMCustomer) => {
    setSelectedCustomer(cust);
    try {
      setLoadingNotes(true);
      const res = await fetch(`/api/crm/notes?customer_id=${cust.id}`);
      const data = await res.json();
      if (data.success) {
        setCustomerNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Failed to load customer notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNoteText.trim()) return;

    try {
      setSavingNote(true);
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          note: newNoteText.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewNoteText('');
        // Refresh customer notes list
        const updatedRes = await fetch(`/api/crm/notes?customer_id=${selectedCustomer.id}`);
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setCustomerNotes(updatedData.notes || []);
        }
        // Refresh overall counts
        await fetchCRMData();
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // KPIs
  const totalCustomers = customers.length;
  const vipCount = customers.filter((c) => c.tier === 'VIP').length;
  const totalNotesCount = recentNotes.length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-indigo-600" />
              Client Relationship Management (CRM)
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Maintain customer history, log phone discussions & follow-ups, and segment VIP accounts.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monitored Profiles</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalCustomers} Clients</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">VIP Accounts</p>
              <p className="text-xl font-bold text-purple-600 mt-0.5">{vipCount} High Value</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Interactions</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalNotesCount} Logged Notes</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search client by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['all', 'VIP', 'Regular', 'New Lead'].map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  tierFilter === t
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'all' ? 'All Clients' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Layout: Clients Directory & Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clients List (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Client Portfolio</h2>
              <span className="text-xs text-slate-400">{customers.length} total</span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium">Loading client relationships...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No clients found matching filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <div key={c.id} className="p-4 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.tier === 'VIP'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : c.tier === 'New Lead'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {c.tier}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{c.phone}</span>}
                        {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{c.email}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono pt-1 text-slate-600">
                        <span>Spend: <strong className="text-slate-900 font-bold">Rs. {Number(c.total_purchases).toLocaleString('en-LK')}</strong></span>
                        <span>Orders: <strong>{c.total_orders}</strong></span>
                        {Number(c.outstanding_balance) > 0 && (
                          <span className="text-red-600 font-semibold">Credit: Rs. {Number(c.outstanding_balance).toLocaleString('en-LK')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c.phone && (
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl transition"
                          title="Message on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl transition"
                          title="Direct Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenNotes(c)}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Notes ({c.note_count || 0})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Stream (1 Col) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Latest Client Touchpoints
            </h2>

            {recentNotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent client interaction notes logged yet.</p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((rn) => (
                  <div key={rn.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{rn.customer_name}</span>
                      <span className="text-[10px] text-slate-400">{new Date(rn.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 italic">&ldquo;{rn.note}&rdquo;</p>
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Logged by {rn.author_name || 'Staff Member'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Customer CRM Notes Drawer */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Client conversation log & agreement records
                  </p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notes Timeline List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
                {loadingNotes ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : customerNotes.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No notes recorded yet for this client. Add your first note below.
                  </div>
                ) : (
                  customerNotes.map((n) => (
                    <div key={n.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-700">{n.author_name || 'Staff'}</span>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{n.note}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="pt-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Log client call, feedback, special request..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Log Note
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
