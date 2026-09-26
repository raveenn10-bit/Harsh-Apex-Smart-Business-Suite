'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, ArrowDownRight, ArrowUpRight, 
  RotateCcw, History, Search, PlusCircle, Filter, 
  CheckCircle2, AlertCircle, X, Loader2, DollarSign, Layers
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface InventoryStats {
  total_products: number;
  total_stock_units: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_cost_valuation: number;
  total_retail_valuation: number;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock_quantity: number;
  min_stock_level: number;
  cost_price: number;
  selling_price: number;
  status: string;
  category_name: string | null;
}

interface StockMovement {
  id: string;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_id: string;
  notes: string | null;
  created_at: string;
  product_name: string;
  sku: string;
}

export default function InventoryPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'levels' | 'movements'>('levels');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RETURN'>('STOCK_IN');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setProducts(data.products || []);
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdjust = (prod?: ProductItem) => {
    if (prod) {
      setSelectedProduct(prod);
    } else if (products.length > 0) {
      setSelectedProduct(products[0]);
    }
    setAdjustType('STOCK_IN');
    setAdjustQty('');
    setAdjustNotes('');
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustQty) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          type: adjustType,
          quantity: parseInt(adjustQty, 10),
          notes: adjustNotes,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setIsAdjustOpen(false);
        fetchInventory();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update stock' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error processing stock adjustment' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'low') {
      return p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level;
    }
    if (statusFilter === 'out') {
      return p.stock_quantity <= 0;
    }
    return true;
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Feedback message */}
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              Inventory & Stock Control
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Track multi-item stock levels, low-stock warnings, and historical stock movements.
            </p>
          </div>
          <button
            onClick={() => handleOpenAdjust()}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Adjust Stock
          </button>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Units</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {Number(stats.total_stock_units).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warnings</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">
                  {stats.low_stock_count} <span className="text-xs text-slate-400 font-normal">items</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-0.5">
                  {stats.out_of_stock_count} <span className="text-xs text-slate-400 font-normal">items</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valuation (Cost)</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  Rs. {Number(stats.total_cost_valuation).toLocaleString('en-LK', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
              activeTab === 'levels'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Current Stock Levels ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'movements'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            Stock Movement History ({movements.length})
          </button>
        </div>

        {/* TAB 1: Stock Levels */}
        {activeTab === 'levels' && (
          <div className="space-y-4">
            {/* Filter and Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item by name, SKU, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setStatusFilter('low')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    statusFilter === 'low' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setStatusFilter('out')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    statusFilter === 'out' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Out of Stock
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium">Loading inventory...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-700">No Products Found</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                    No inventory records match your selected filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Product / SKU</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-center">In Stock</th>
                        <th className="px-6 py-4 text-center">Min Level</th>
                        <th className="px-6 py-4 text-right">Cost Price</th>
                        <th className="px-6 py-4 text-right">Selling Price</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const isOut = p.stock_quantity <= 0;
                        const isLow = !isOut && p.stock_quantity <= p.min_stock_level;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-900 block">{p.name}</span>
                              <span className="text-xs text-slate-400 font-mono">SKU: {p.sku}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                              {p.category_name || 'Uncategorized'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-bold text-base ${
                                isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                              }`}>
                                {p.stock_quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-400 text-xs">
                              {p.min_stock_level}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600 font-mono text-xs">
                              Rs. {Number(p.cost_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono text-xs">
                              Rs. {Number(p.selling_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isOut ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Optimal
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleOpenAdjust(p)}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                              >
                                Adjust
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Stock Movements History */}
        {activeTab === 'movements' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {movements.length === 0 ? (
              <div className="py-16 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700">No Movement Records</h3>
                <p className="text-sm text-slate-400 mt-1">Audit log will record sales, stock-ins, and manual adjustments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Product / SKU</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-center">Quantity</th>
                      <th className="px-6 py-4 text-center">Previous → New</th>
                      <th className="px-6 py-4">Reference / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((m) => {
                      const isAddition = m.movement_type === 'STOCK_IN' || m.movement_type === 'RETURN';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(m.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900 block">{m.product_name}</span>
                            <span className="text-xs text-slate-400 font-mono">SKU: {m.sku}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              m.movement_type === 'SALE'
                                ? 'bg-purple-50 text-purple-700'
                                : isAddition
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {isAddition ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {m.movement_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-900">
                            {isAddition ? `+${m.quantity}` : `-${m.quantity}`}
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">
                            {m.previous_quantity} → <strong className="text-slate-900">{m.new_quantity}</strong>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{m.reference_id}</span>
                            {m.notes && <span className="block text-slate-400 mt-0.5">{m.notes}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Adjust Stock */}
        {isAdjustOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                  Stock Adjustment
                </h3>
                <button onClick={() => setIsAdjustOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Product *
                  </label>
                  <select
                    required
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const found = products.find((p) => p.id === e.target.value);
                      if (found) setSelectedProduct(found);
                    }}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current Stock: {p.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adjustment Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('STOCK_IN')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        adjustType === 'STOCK_IN'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      Stock In (Add)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('STOCK_OUT')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        adjustType === 'STOCK_OUT'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                      Stock Out (Reduce)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('ADJUSTMENT')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        adjustType === 'ADJUSTMENT'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4 text-blue-600" />
                      Set Exact Count
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('RETURN')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        adjustType === 'RETURN'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 text-purple-600" />
                      Customer Return
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adjustType === 'ADJUSTMENT' ? 'New Exact Stock Count *' : 'Quantity Units *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 25"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {selectedProduct && (
                    <p className="text-xs text-slate-400 mt-1">
                      Current: {selectedProduct.stock_quantity} units
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Supplier invoice delivery / damaged goods write-off"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAdjustOpen(false)}
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
                    Confirm Update
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
