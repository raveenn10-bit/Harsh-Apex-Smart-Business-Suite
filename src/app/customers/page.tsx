'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Phone, Mail, MapPin, 
  ShoppingBag, CreditCard, ChevronRight, X, Loader2, 
  Trash2, Edit, AlertCircle, CheckCircle2, DollarSign, Calendar
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  total_purchases: string | number;
  total_orders: number;
  outstanding_balance: string | number;
  last_purchase_at: string | null;
  created_at: string;
}

interface CustomerDetail extends Customer {
  orders?: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    payment_status: string;
    payment_method: string;
    created_at: string;
  }>;
  invoices?: Array<{
    id: string;
    invoice_number: string;
    total_amount: number;
    balance_amount: number;
    status: string;
    issue_date: string;
    due_date: string;
  }>;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const fetchCustomers = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/customers?q=${encodeURIComponent(query)}` : '/api/customers';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', message: 'Customer registered successfully!' });
        setFormData({ name: '', phone: '', email: '', address: '' });
        setIsAddOpen(false);
        fetchCustomers(search);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to register customer' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'A network error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = async (customer: Customer) => {
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCustomer({ ...data.customer, orders: data.orders, invoices: data.invoices });
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch details:', err);
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', message: 'Customer profile updated!' });
        setIsEditOpen(false);
        fetchCustomers(search);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update customer' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Customer deleted successfully' });
        fetchCustomers(search);
        if (isDetailOpen) setIsDetailOpen(false);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // KPI calculations
  const totalPurchasesSum = customers.reduce((sum, c) => sum + Number(c.total_purchases || 0), 0);
  const totalOutstandingSum = customers.reduce((sum, c) => sum + Number(c.outstanding_balance || 0), 0);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Toast / Banner Feedback */}
        {feedback && (
          <div className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-sm ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Customer Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Maintain detailed client profiles, purchase histories, and credit ledgers.
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', phone: '', email: '', address: '' });
              setIsAddOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{customers.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchases</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                Rs. {totalPurchasesSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                Rs. {totalOutstandingSum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Spend / Customer</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                Rs. {customers.length > 0 ? (totalPurchasesSum / customers.length).toLocaleString('en-LK', { maximumFractionDigits: 0 }) : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            Showing {customers.length} customer records
          </span>
        </div>

        {/* Customers Table / Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading customer accounts...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Customers Found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                {search ? `No customer matched "${search}". Try another search term.` : 'Click "Add Customer" to start building your client base.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4 text-center">Orders</th>
                    <th className="px-6 py-4 text-right">Total Purchases</th>
                    <th className="px-6 py-4 text-right">Balance</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span 
                              onClick={() => handleOpenDetail(c)}
                              className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer transition block"
                            >
                              {c.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              Joined {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {c.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {c.phone}
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {c.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">
                        {c.address || '—'}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-800">
                        {c.total_orders || 0}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        Rs. {Number(c.total_purchases || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {Number(c.outstanding_balance) > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            Rs. {Number(c.outstanding_balance).toLocaleString('en-LK')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Clear</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(c)}
                            title="View Profile"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Customer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add Customer */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Add New Customer
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ruwan Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="077-1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address / City
                  </label>
                  <textarea
                    rows={2}
                    placeholder="No. 45, Galle Road, Colombo 03"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Register Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Customer */}
        {isEditOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" />
                  Edit Customer Profile
                </h3>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address / City
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Customer Profile & Order History */}
        {isDetailOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Customer ID: {selectedCustomer.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>Member since {new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Total Spent</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    Rs. {Number(selectedCustomer.total_purchases || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Completed Orders</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedCustomer.total_orders || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Credit Balance</p>
                  <p className={`text-lg font-bold mt-0.5 ${Number(selectedCustomer.outstanding_balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    Rs. {Number(selectedCustomer.outstanding_balance || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 text-sm text-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>{selectedCustomer.phone || 'No phone registered'}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>{selectedCustomer.email || 'No email registered'}</span>
                  </div>
                </div>
                {selectedCustomer.address && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{selectedCustomer.address}</span>
                  </div>
                )}
              </div>

              {/* Purchase History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Transactions</h4>
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {selectedCustomer.orders.map((o) => (
                      <div key={o.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="font-semibold text-slate-900">{o.order_number}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            {new Date(o.created_at).toLocaleDateString()} • Method: {o.payment_method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">
                            Rs. {Number(o.total_amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                          </p>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            {o.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No past transactions recorded yet.</p>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
