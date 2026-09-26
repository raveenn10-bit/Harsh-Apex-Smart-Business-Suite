'use client';

import React, { useState } from 'react';
import { 
  Check, Sparkles, Zap, Shield, ArrowRight, 
  HelpCircle, MessageSquare, Phone, Mail, Building, Loader2, X, CheckCircle
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export default function PackagesPage() {
  const [selectedPlan, setSelectedPlan] = useState<'Basic' | 'Business' | 'Premium'>('Business');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const plans = [
    {
      name: 'Basic',
      badge: 'Starter Retail',
      price: 'Rs. 4,500',
      period: '/ month',
      description: 'Essential billing, POS checkout, and stock control for boutique retail & counters.',
      popular: false,
      color: 'blue',
      features: [
        'Complete POS & Barcode Scanner',
        'Thermal Receipt & Cash Drawer Printing',
        'Real-time Inventory & Low-Stock Alerts',
        'Customer Directory & Purchase History',
        'Official Tax Invoicing & Due Tracking',
        '1 Location / 2 Staff Logins',
      ],
      notIncluded: [
        'Quotations & Pro-forma Estimates',
        'Operational Expenses & P&L Analysis',
        'WhatsApp Automated Notification Simulator',
        'Harsh Apex AI Assistant Advisor',
        'E-Commerce & Website Storefront Sync',
      ],
    },
    {
      name: 'Business',
      badge: 'Most Popular',
      price: 'Rs. 9,500',
      period: '/ month',
      description: 'Comprehensive operational suite with quotation conversion, financial P&L, and staff HR.',
      popular: true,
      color: 'emerald',
      features: [
        'Everything in Basic Tier, plus:',
        'Formal Quotations with 1-Click Invoice Conversion',
        'Overhead Expenses & Cost Allocation Tracker',
        'Full P&L Waterfall & Gross Margin Analysis',
        'Client Relationship Management (CRM) & Call Notes',
        'Staff Roster & Employee Permission Roles',
        'Interactive WhatsApp Notification Simulator',
        'Up to 3 Branches / 10 Staff Users',
      ],
      notIncluded: [
        'Harsh Apex AI Business Intelligence Engine',
        'Website & E-Commerce 2-Way Stock Shield',
        'Advanced Automated Business Rules Center',
      ],
    },
    {
      name: 'Premium',
      badge: 'Enterprise & AI',
      price: 'Rs. 18,500',
      period: '/ month',
      description: 'Full multi-branch powerhouse with AI business intelligence and automated omni-channel sync.',
      popular: false,
      color: 'purple',
      features: [
        'Everything in Business Tier, plus:',
        'Harsh Apex AI Real-time Business Intelligence Advisor',
        'Advanced HR Time-Clock & Leave Approvals Kiosk',
        'Website & E-Commerce 2-Way Inventory Shield',
        'Smart Event-Driven Automation Rule Engine',
        'Deep Hourly Heatmaps & Footfall Analytics',
        'Unlimited Outlets, Cashiers & Products',
        'Priority 24/7 Phone & WhatsApp Concierge Support',
      ],
      notIncluded: [],
    },
  ];

  const handleOpenConsultation = (planName: 'Basic' | 'Business' | 'Premium') => {
    setSelectedPlan(planName);
    setIsModalOpen(true);
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim() || !email.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          business_name: businessName.trim() || undefined,
          whatsapp_number: whatsapp.trim(),
          email: email.trim(),
          interested_package: selectedPlan,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setName('');
        setBusinessName('');
        setWhatsapp('');
        setEmail('');
        setMessage('');
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(null), 6000);
      } else {
        alert(data.error || 'Failed to submit inquiry');
      }
    } catch (err) {
      console.error('Lead submission error:', err);
      alert('Error sending request. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 inline-block">
            Commercial Subscription Plans
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Scale Your Business with Harsh Apex Suite
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            One platform powering your point of sale, inventory warehouse, client relationships, staff HR, and AI intelligence. Select the plan crafted for your stage of growth.
          </p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in max-w-2xl mx-auto">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* 3 Tier Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl p-8 flex flex-col justify-between border-2 transition relative ${
                p.popular
                  ? 'bg-white border-emerald-500 shadow-xl ring-4 ring-emerald-500/10'
                  : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
                  Most Popular for SMBs
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {p.badge}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">{p.name} Plan</h2>
                  <p className="text-xs text-slate-500 mt-2 min-h-[36px]">{p.description}</p>
                </div>

                <div className="flex items-baseline gap-1 pt-2 border-t border-slate-100">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
                    {p.price}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{p.period}</span>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Included Capabilities</p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {p.notIncluded.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2 opacity-60">
                      <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Locked Features</p>
                      <ul className="space-y-2 text-xs text-slate-400">
                        {p.notIncluded.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 line-through">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleOpenConsultation(p.name as 'Basic' | 'Business' | 'Premium')}
                  className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm ${
                    p.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Request Consultation & Demo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust & Guarantee Banner */}
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">Need a Custom Multi-Branch Deployment?</h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Harsh Apex Digital Solutions engineers on-premise hardware integrations, barcode scanners, receipt printers, and custom warehouse management setups.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href="https://www.harshapex.com.lk"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-xs transition"
            >
              Visit harshapex.com.lk
            </a>
            <a
              href="https://wa.me/94771234567"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Direct
            </a>
          </div>
        </div>

        {/* Modal: Request Consultation */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b pb-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Request {selectedPlan} Plan Consultation</h2>
                  <p className="text-xs text-slate-500">Our business solutions team will schedule a live walk-through.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitLead} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ruwan Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Business / Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Colombo Tech Retail"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Mobile *</label>
                    <input
                      type="text"
                      required
                      placeholder="+94 77 123 4567"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="ruwan@business.lk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requirements / Current Store Challenges</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your stores, counters, products or any specific integration needed..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
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
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Submit Consultation Request
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
