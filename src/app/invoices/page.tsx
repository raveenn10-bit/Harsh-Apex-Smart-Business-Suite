'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Printer, Download, Eye, 
  CheckCircle2, Clock, AlertCircle, X, Loader2, DollarSign, Calendar
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
}

interface InvoiceDetail extends Invoice {
  customer_email?: string;
  customer_address?: string;
  business_name?: string;
  business_phone?: string;
  business_email?: string;
  business_address?: string;
  receipt_header?: string;
  receipt_footer?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search]);

  const handleOpenDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedInvoice(data.invoice);
        setInvoiceItems(data.items || []);
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // KPIs
  const totalBilled = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + Number(i.balance_amount || 0), 0);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Invoices & Billing
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Issue, monitor, and print official commercial tax invoices and track outstanding payments.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                Rs. {totalBilled.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Revenue</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                Rs. {totalPaid.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">
                Rs. {totalOutstanding.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice number or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['all', 'paid', 'unpaid', 'overdue', 'draft'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Invoices Found</h3>
              <p className="text-sm text-slate-400 mt-1">Invoices generated at POS or billing will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-right">Balance Due</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900 block">
                          {inv.customer_name || 'Walk-in Customer'}
                        </span>
                        {inv.customer_phone && (
                          <span className="text-xs text-slate-400">{inv.customer_phone}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(inv.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono text-xs">
                        Rs. {Number(inv.total_amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs">
                        {Number(inv.balance_amount) > 0 ? (
                          <span className="text-red-600 font-bold">
                            Rs. {Number(inv.balance_amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400">Rs. 0.00</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'overdue'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(inv.id)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View / Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Full Commercial Invoice View & Print */}
        {isDetailOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
              {/* Top Controls */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    Official Tax Invoice
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Header */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedInvoice.business_name}</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">{selectedInvoice.business_address || 'Harsh Apex Business Partner'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Phone: {selectedInvoice.business_phone || 'N/A'}</p>
                  <p className="text-xs text-slate-500">Email: {selectedInvoice.business_email || 'billing@harshapex.com.lk'}</p>
                </div>

                <div className="text-right space-y-1">
                  <h3 className="text-xl font-bold font-mono text-blue-600">{selectedInvoice.invoice_number}</h3>
                  <p className="text-xs text-slate-500">
                    Issue Date: <strong className="text-slate-700">{new Date(selectedInvoice.issue_date).toLocaleDateString()}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Due Date: <strong className="text-slate-700">{new Date(selectedInvoice.due_date).toLocaleDateString()}</strong>
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Billed To:</p>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoice.customer_name || 'Walk-in Customer'}</p>
                {selectedInvoice.customer_address && (
                  <p className="text-xs text-slate-600 mt-0.5">{selectedInvoice.customer_address}</p>
                )}
                <div className="flex gap-4 text-xs text-slate-500 mt-1">
                  {selectedInvoice.customer_phone && <span>Phone: {selectedInvoice.customer_phone}</span>}
                  {selectedInvoice.customer_email && <span>Email: {selectedInvoice.customer_email}</span>}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium text-slate-800">{item.description}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">
                          Rs. {Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-bold font-mono">
                          Rs. {Number(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {Number(selectedInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(selectedInvoice.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono">- Rs. {Number(selectedInvoice.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.tax_amount) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span className="font-mono">Rs. {Number(selectedInvoice.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="font-mono text-blue-600">Rs. {Number(selectedInvoice.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Paid to Date:</span>
                    <span className="font-mono text-emerald-600">Rs. {Number(selectedInvoice.paid_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-red-600 pt-1 border-t border-slate-100">
                    <span>Balance Due:</span>
                    <span className="font-mono">Rs. {Number(selectedInvoice.balance_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
                <p className="font-medium text-slate-600">{selectedInvoice.receipt_header || 'Thank you for your business!'}</p>
                <p className="text-[11px] mt-0.5">{selectedInvoice.receipt_footer || 'Payments due within specified timeframe. Harsh Apex Digital Solutions.'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
