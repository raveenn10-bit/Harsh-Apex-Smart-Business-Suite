'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, Search, Plus, Eye, Printer, ArrowRight,
  Clock, CheckCircle, AlertCircle, X, Loader2, Calendar, Trash2
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Quotation {
  id: string;
  quotation_number: string;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
}

interface QuotationDetail extends Quotation {
  customer_email?: string;
  customer_address?: string;
  business_name?: string;
  business_phone?: string;
  business_email?: string;
  business_address?: string;
  receipt_header?: string;
  receipt_footer?: string;
}

interface QuotationItem {
  id?: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
}

interface ProductOption {
  id: string;
  name: string;
  selling_price: number;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Preview Modal
  const [selectedQuote, setSelectedQuote] = useState<QuotationDetail | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuotationItem[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Quotation Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [newItems, setNewItems] = useState<Array<{
    product_id: string;
    description: string;
    quantity: number;
    unit_price: number;
  }>>([
    { product_id: '', description: '', quantity: 1, unit_price: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/quotations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuotations(data.quotations || []);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter, search]);

  const fetchCreateData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products')
      ]);
      const custData = await custRes.json();
      const prodData = await prodRes.json();

      if (custData.success) setCustomers(custData.customers || []);
      if (prodData.success) setProducts(prodData.products || []);
    } catch (err) {
      console.error('Failed to load customers or products:', err);
    }
  };

  const handleOpenCreate = () => {
    fetchCreateData();
    setIsCreateOpen(true);
  };

  const handleOpenDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/quotations/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedQuote(data.quotation);
        setQuoteItems(data.items || []);
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error('Failed to load quotation details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConvert = async (id: string) => {
    try {
      setConvertingId(id);
      const res = await fetch(`/api/quotations/${id}/convert`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message || 'Quotation converted to Invoice successfully!');
        if (selectedQuote && selectedQuote.id === id) {
          setSelectedQuote({ ...selectedQuote, status: 'accepted' });
        }
        await fetchQuotations();
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(data.error || 'Failed to convert quotation');
      }
    } catch (err) {
      console.error('Conversion error:', err);
      alert('Network error while converting quotation');
    } finally {
      setConvertingId(null);
    }
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...newItems];
    updated[index].product_id = productId;
    if (prod) {
      updated[index].description = prod.name;
      updated[index].unit_price = Number(prod.selling_price) || 0;
    }
    setNewItems(updated);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...newItems];
    (updated[index] as Record<string, unknown>)[field] = value;
    setNewItems(updated);
  };

  const addItemRow = () => {
    setNewItems([...newItems, { product_id: '', description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter((_, i) => i !== index));
    }
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        customer_id: selectedCustomerId || null,
        valid_days: Number(validDays) || 30,
        discount_amount: Number(discountAmount) || 0,
        notes,
        items: newItems.map((it) => ({
          product_id: it.product_id || null,
          description: it.description || 'Quoted Item',
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
        })),
      };

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsCreateOpen(false);
        // Reset form
        setNewItems([{ product_id: '', description: '', quantity: 1, unit_price: 0 }]);
        setDiscountAmount(0);
        setNotes('');
        setSelectedCustomerId('');
        setActionMessage(`Quotation ${data.quotation_number} created successfully!`);
        await fetchQuotations();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to create quotation');
      }
    } catch (err) {
      console.error('Failed to create quotation:', err);
      alert('Error creating quotation');
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const totalQuotesCount = quotations.length;
  const totalQuotedValue = quotations.reduce((acc, q) => acc + Number(q.total_amount || 0), 0);
  const convertedValue = quotations
    .filter((q) => q.status === 'accepted')
    .reduce((acc, q) => acc + Number(q.total_amount || 0), 0);

  const calculateSubtotal = () => {
    return newItems.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <FileCheck2 className="w-8 h-8 text-blue-600" />
              Quotations & Estimates
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Prepare professional estimates, propose pricing to clients, and convert directly to active invoices in 1 click.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </button>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{actionMessage}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Quotations</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalQuotesCount} Proposals</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Quoted Volume</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">
                Rs. {totalQuotedValue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Converted to Invoice</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">
                Rs. {convertedValue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
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
              placeholder="Search quotation # or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['all', 'sent', 'accepted', 'rejected', 'expired'].map((s) => (
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

        {/* Quotations Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading quotations...</p>
            </div>
          ) : quotations.length === 0 ? (
            <div className="py-16 text-center">
              <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Quotations Found</h3>
              <p className="text-sm text-slate-400 mt-1">Create a proposal above to send estimates to prospective customers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Quotation #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Valid Until</th>
                    <th className="px-6 py-4 text-right">Quoted Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {q.quotation_number}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900 block">
                          {q.customer_name || 'Prospective Customer'}
                        </span>
                        {q.customer_phone && (
                          <span className="text-xs text-slate-400">{q.customer_phone}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(q.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(q.valid_until).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono text-xs">
                        Rs. {Number(q.total_amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          q.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.status === 'sent'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : q.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(q.id)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>

                          {q.status !== 'accepted' && (
                            <button
                              onClick={() => handleConvert(q.id)}
                              disabled={convertingId === q.id}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                            >
                              {convertingId === q.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5" />
                              )}
                              Convert to Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: View & Print Quotation */}
        {isPreviewOpen && selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
              {/* Top Controls */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                    Formal Quotation
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedQuote.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedQuote.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedQuote.status !== 'accepted' && (
                    <button
                      onClick={() => handleConvert(selectedQuote.id)}
                      disabled={convertingId === selectedQuote.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {convertingId === selectedQuote.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      Convert to Invoice
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Header */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedQuote.business_name}</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">{selectedQuote.business_address || 'Harsh Apex Business Partner'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Phone: {selectedQuote.business_phone || 'N/A'}</p>
                  <p className="text-xs text-slate-500">Email: {selectedQuote.business_email || 'sales@harshapex.com.lk'}</p>
                </div>

                <div className="text-right space-y-1">
                  <h3 className="text-xl font-bold font-mono text-purple-600">{selectedQuote.quotation_number}</h3>
                  <p className="text-xs text-slate-500">
                    Date: <strong className="text-slate-700">{new Date(selectedQuote.issue_date).toLocaleDateString()}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Valid Until: <strong className="text-slate-700">{new Date(selectedQuote.valid_until).toLocaleDateString()}</strong>
                  </p>
                </div>
              </div>

              {/* Quotation Recipient */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Prepared For:</p>
                <p className="font-bold text-slate-900 text-sm">{selectedQuote.customer_name || 'Valued Customer'}</p>
                {selectedQuote.customer_address && (
                  <p className="text-xs text-slate-600 mt-0.5">{selectedQuote.customer_address}</p>
                )}
                <div className="flex gap-4 text-xs text-slate-500 mt-1">
                  {selectedQuote.customer_phone && <span>Phone: {selectedQuote.customer_phone}</span>}
                  {selectedQuote.customer_email && <span>Email: {selectedQuote.customer_email}</span>}
                </div>
              </div>

              {/* Line Items */}
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
                    {quoteItems.map((item, idx) => (
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
              <div className="flex justify-between items-start gap-4">
                <div className="text-xs text-slate-500 max-w-sm">
                  {selectedQuote.notes && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700 block mb-0.5">Notes & Terms:</span>
                      {selectedQuote.notes}
                    </div>
                  )}
                </div>

                <div className="w-72 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {Number(selectedQuote.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(selectedQuote.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono">- Rs. {Number(selectedQuote.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-purple-600">Rs. {Number(selectedQuote.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
                <p className="font-medium text-slate-600">{selectedQuote.receipt_header || 'Commercial Quotation from Harsh Apex Suite'}</p>
                <p className="text-[11px] mt-0.5">Valid for the duration specified above. Terms apply.</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Quotation */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create New Quotation</h2>
                  <p className="text-xs text-slate-500">Draft an estimate and send to client or save for record.</p>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuotation} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Client</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">-- Walk-in / Unregistered Client --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Validity (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={validDays}
                      onChange={(e) => setValidDays(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quoted Line Items</label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {newItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {/* Preset product selector shortcut */}
                        <div className="w-32 shrink-0">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemProductChange(idx, e.target.value)}
                            className="w-full text-[11px] p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                          >
                            <option value="">-- Catalog --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <input
                          type="text"
                          placeholder="Item Description"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="flex-1 text-xs p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                        />

                        {/* Qty */}
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-16 text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-center focus:outline-none"
                        />

                        {/* Unit Price */}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          className="w-24 text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-right font-mono focus:outline-none"
                        />

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal & Discount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Amount (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center text-right">
                    <span className="text-xs text-slate-500">Calculated Grand Total</span>
                    <span className="text-lg font-bold font-mono text-purple-600">
                      Rs. {Math.max(0, calculateSubtotal() - discountAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Terms / Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Valid for 30 days from date of issue. 50% advance upon confirmation."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Quotation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
