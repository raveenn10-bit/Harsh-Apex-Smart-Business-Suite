'use client';

import React, { useState, useEffect } from 'react';
import { 
  Receipt, Search, Plus, DollarSign, Calendar, Tag,
  CreditCard, TrendingDown, ArrowDownRight, Loader2, X, AlertCircle
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  description: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  category_id: string | null;
  category_name: string | null;
  created_at: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Record Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category_id', selectedCategory);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/expenses/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, search]);

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: Number(amount),
          category_id: categoryId || null,
          payment_method: paymentMethod,
          expense_date: expenseDate,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setDescription('');
        setAmount('');
        setCategoryId('');
        setNotes('');
        await fetchExpenses();
      } else {
        alert(data.error || 'Failed to record expense');
      }
    } catch (err) {
      console.error('Failed to record expense:', err);
      alert('Error recording expense');
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const totalSpent = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const expenseCount = expenses.length;

  // Breakdown by category
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    const catName = exp.category_name || 'Uncategorized';
    categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(exp.amount || 0);
  }
  let topCategory = 'None';
  let topCategoryAmount = 0;
  for (const [name, tot] of Object.entries(categoryTotals)) {
    if (tot > topCategoryAmount) {
      topCategoryAmount = tot;
      topCategory = name;
    }
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Receipt className="w-8 h-8 text-rose-600" />
              Expense & Outflow Tracking
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Record daily overheads, operational expenditures, rent, utilities, and track company cost centers.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</p>
              <p className="text-xl font-bold text-rose-600 mt-0.5">
                Rs. {totalSpent.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Spend Category</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5 truncate max-w-[180px]">
                {topCategory}
              </p>
              <p className="text-xs text-slate-400">Rs. {topCategoryAmount.toLocaleString('en-LK')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorded Entries</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {expenseCount} Transactions
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
              placeholder="Search description or expense #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
              <p className="text-sm font-medium">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Expenses Recorded</h3>
              <p className="text-sm text-slate-400 mt-1">Record overhead expenses such as rent, bills, or petty cash above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Expense #</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4 text-right">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">
                        {exp.expense_number}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {exp.category_name || 'General Expense'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900 block">{exp.description}</span>
                        {exp.notes && <span className="text-xs text-slate-400">{exp.notes}</span>}
                      </td>
                      <td className="px-6 py-4 text-xs capitalize text-slate-600">
                        {exp.payment_method.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                        Rs. {Number(exp.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Record Expense */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b pb-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Record Operational Expense</h2>
                  <p className="text-xs text-slate-500">Track company cost outflow against revenue.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shop monthly rent payment, CEB electricity bill"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="cash">Cash in Hand</option>
                      <option value="bank_transfer">Bank Transfer / Cheque</option>
                      <option value="card">Company Debit / Credit Card</option>
                      <option value="petty_cash">Petty Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Voucher Reference</label>
                  <textarea
                    rows={2}
                    placeholder="Reference voucher # or payee details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Expense
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
