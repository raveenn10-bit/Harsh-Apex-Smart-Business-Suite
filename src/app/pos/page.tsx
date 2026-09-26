'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, CheckCircle2, 
  CreditCard, Banknote, Building2, Printer, Send, 
  RotateCcw, AlertCircle, X, Loader2, User, Barcode, ChevronDown
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  selling_price: number;
  stock_quantity: number;
  category_id: string | null;
  category_name?: string;
  image_url?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ReceiptData {
  business_name: string;
  invoice_number: string;
  order_number: string;
  date: string;
  customer: { name: string; phone?: string };
  items: Array<{ name: string; quantity: number; unit_price: number; total_price: number }>;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  payment_method: string;
  amount_tendered: number;
  change_due: number;
  header: string;
  footer: string;
  whatsapp_sent: boolean;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(''); // empty = walk-in
  const [discount, setDiscount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');

  // Processing & Receipt
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initial data fetch
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes, custRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
          fetch('/api/customers'),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();
        const custData = await custRes.json();

        if (prodData.success) setProducts(prodData.products || []);
        if (catData.success) setCategories(catData.categories || []);
        if (custData.success) setCustomers(custData.customers || []);
      } catch (err) {
        console.error('Failed to load POS data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.selling_price * item.quantity, 0);
  const discountVal = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
  const grandTotal = Math.max(0, subtotal - discountVal);
  const tenderedVal = parseFloat(amountTendered) || grandTotal;
  const changeDue = Math.max(0, tenderedVal - grandTotal);

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          setFeedback({ type: 'error', message: `Cannot add more. Only ${product.stock_quantity} in stock.` });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock_quantity) {
              setFeedback({ type: 'error', message: `Stock limit reached (${item.product.stock_quantity} available)` });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase()) ||
        p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      setFeedback({ type: 'error', message: `No product matched barcode/SKU "${barcodeInput}"` });
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setCheckingOut(true);
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer || null,
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
          discount_amount: discountVal,
          payment_method: paymentMethod,
          amount_tendered: paymentMethod === 'cash' ? tenderedVal : grandTotal,
          notes: 'POS Counter Sale',
        }),
      });

      const data = await res.json();

      if (data.success && data.receipt) {
        setReceipt(data.receipt);
        setCart([]);
        setDiscount('0');
        setAmountTendered('');
        setSelectedCustomer('');
        // Refresh products stock
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData.success) setProducts(prodData.products || []);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to complete sale' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error processing checkout' });
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-50">
        {/* Left Side: Catalog & Search */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white">
          {/* Top Bar: Search & Barcode */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-white">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Scan / Enter Barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </form>
          </div>

          {/* Category Filter Pills */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-50/50">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span>Loading catalog...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                <ShoppingBag className="w-12 h-12 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No products found</p>
                <p className="text-xs text-slate-400">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock_quantity <= 0;
                  return (
                    <button
                      key={p.id}
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p)}
                      className={`text-left p-3 rounded-2xl border transition flex flex-col justify-between group relative overflow-hidden ${
                        isOutOfStock
                          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                          : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-98'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
                          <span className="font-mono truncate">{p.sku}</span>
                          <span className={`px-1.5 py-0.5 rounded-full font-semibold text-[10px] ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-600'
                              : p.stock_quantity <= 5
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {isOutOfStock ? '0 Left' : `${p.stock_quantity} in stock`}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition">
                          {p.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          Rs. {Number(p.selling_price).toLocaleString('en-LK', { minimumFractionDigits: 0 })}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className="w-full lg:w-96 xl:w-[420px] bg-slate-50 flex flex-col h-full border-t lg:border-t-0 shadow-lg lg:shadow-none">
          {/* Customer Selection */}
          <div className="p-4 bg-white border-b border-slate-200">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Customer
            </label>
            <div className="relative">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none font-medium text-slate-800"
              >
                <option value="">Walk-in Customer (Guest)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <ShoppingBag className="w-12 h-12 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Cart is empty</p>
                <p className="text-xs text-slate-400">Click products on the left or scan a barcode.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-slate-900 text-xs truncate">{item.product.name}</h5>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Rs. {item.product.selling_price} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-bold text-xs text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 text-xs w-16 text-right font-mono">
                      Rs. {(item.product.selling_price * item.quantity).toFixed(0)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-300 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment & Totals Section */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            {/* Discount input */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">Discount (Rs.):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 px-2 py-1 text-right text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">Rs. {subtotal.toFixed(2)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">- Rs. {discountVal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="font-mono text-blue-600">Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Bank Transfer
              </button>
            </div>

            {/* Cash Tendered Field */}
            {paymentMethod === 'cash' && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Amount Tendered (Rs.):</span>
                  <input
                    type="number"
                    placeholder={grandTotal.toFixed(0)}
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-28 px-2 py-1 text-right text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t border-slate-200/60">
                  <span>Change Due:</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    Rs. {changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              disabled={cart.length === 0 || checkingOut}
              onClick={handleCheckout}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Sale...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Sale • Rs. {grandTotal.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal: Thermal Receipt & Order Confirmation */}
        {receipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-mono text-xs text-slate-800">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-bold text-sm tracking-tight text-slate-900 uppercase">
                  {receipt.business_name}
                </h3>
                <p className="text-[11px] text-slate-500">{receipt.header}</p>
                <div className="text-[10px] text-slate-400 pt-1">
                  <p>Invoice: {receipt.invoice_number}</p>
                  <p>Date: {new Date(receipt.date).toLocaleString()}</p>
                  <p>Customer: {receipt.customer.name}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 max-h-48 overflow-y-auto">
                {receipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="max-w-[65%] truncate">
                      <p className="font-bold">{it.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {it.quantity} × Rs. {Number(it.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold">Rs. {Number(it.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-1 text-[11px] py-1 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {Number(receipt.subtotal).toFixed(2)}</span>
                </div>
                {receipt.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- Rs. {Number(receipt.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {receipt.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>Rs. {Number(receipt.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                  <span>TOTAL:</span>
                  <span>Rs. {Number(receipt.grand_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Paid ({receipt.payment_method.toUpperCase()}):</span>
                  <span>Rs. {Number(receipt.amount_tendered).toFixed(2)}</span>
                </div>
                {receipt.change_due > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Change:</span>
                    <span>Rs. {Number(receipt.change_due).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <p className="text-center text-[10px] text-slate-400 italic">
                {receipt.footer}
              </p>

              {receipt.whatsapp_sent && (
                <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-center text-[10px] font-sans font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simulated WhatsApp receipt sent to {receipt.customer.phone}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2 font-sans">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setReceipt(null)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  New Sale
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
