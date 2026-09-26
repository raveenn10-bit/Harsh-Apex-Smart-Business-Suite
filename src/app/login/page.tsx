'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HarshApexLogo } from '@/components/brand/HarshApexLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Building2,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Quick Demo Account Auto-Fill without showing raw passwords in text
  const demoAccounts = [
    {
      label: 'Basic Demo 1 (Colombo)',
      email: 'basic1@demo.harshapex.com.lk',
      pwd: 'BasicDemo@1',
      tier: 'BASIC',
      color: 'border-blue-200 hover:border-blue-500 bg-blue-50/40 text-blue-900',
    },
    {
      label: 'Basic Demo 2 (Kandy)',
      email: 'basic2@demo.harshapex.com.lk',
      pwd: 'BasicDemo@2',
      tier: 'BASIC',
      color: 'border-blue-200 hover:border-blue-500 bg-blue-50/40 text-blue-900',
    },
    {
      label: 'Business Demo 1 (Galle)',
      email: 'business1@demo.harshapex.com.lk',
      pwd: 'BusinessDemo@1',
      tier: 'BUSINESS',
      color: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 text-emerald-900',
    },
    {
      label: 'Business Demo 2 (Negombo)',
      email: 'business2@demo.harshapex.com.lk',
      pwd: 'BusinessDemo@2',
      tier: 'BUSINESS',
      color: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 text-emerald-900',
    },
    {
      label: 'Premium Demo 1 (Holdings)',
      email: 'premium1@demo.harshapex.com.lk',
      pwd: 'PremiumDemo@1',
      tier: 'PREMIUM',
      color: 'border-purple-200 hover:border-purple-500 bg-purple-50/40 text-purple-900',
    },
    {
      label: 'Premium Demo 2 (Industrial)',
      email: 'premium2@demo.harshapex.com.lk',
      pwd: 'PremiumDemo@2',
      tier: 'PREMIUM',
      color: 'border-purple-200 hover:border-purple-500 bg-purple-50/40 text-purple-900',
    },
  ];

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter your email and password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Success -> Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Connection error. Please try again.');
      setLoading(false);
    }
  }

  function fillDemoAccount(acc: typeof demoAccounts[0]) {
    setEmail(acc.email);
    setPassword(acc.pwd);
    setErrorMessage('');
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <HarshApexLogo size="md" href="/login" />
        <div className="flex items-center gap-3">
          <Link href="/packages">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              Explore Packages
            </Button>
          </Link>
          <a
            href="https://www.harshapex.com.lk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-blue-600 font-medium hidden sm:inline"
          >
            harshapex.com.lk
          </a>
        </div>
      </header>

      {/* Main Login & Hero Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand Hero Pitch */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/60 dark:border-blue-800/60 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Harsh Apex Digital Solutions &bull; Commercial SaaS</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Run Your Entire Business From{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  One Unified Place.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                The all-in-one Smart Business Management Suite built for modern Sri Lankan retail,
                wholesale, and commercial enterprises. Point of Sale, Smart Inventory, Customer CRM,
                Financial Intelligence, and AI Automation.
              </p>
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Multi-Tenant RLS Security</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Real-time POS & Billing</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>WhatsApp Notification Engine</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>AI Business Intelligence</span>
              </div>
            </div>

            {/* Quick Demo Fill Chips */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>1-CLICK DEMO ACCOUNT SELECTOR:</span>
                <span className="text-[10px] font-normal text-blue-600">Select to auto-populate</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoAccounts.map((acc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => fillDemoAccount(acc)}
                    className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all duration-150 flex flex-col justify-between ${acc.color} ${
                      email === acc.email ? 'ring-2 ring-blue-600 shadow-xs' : ''
                    }`}
                  >
                    <div className="truncate">{acc.label}</div>
                    <div className="text-[9px] uppercase font-bold opacity-75 mt-1">{acc.tier}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Secure Login Card */}
          <div className="lg:col-span-6 flex justify-center">
            <Card className="w-full max-w-md shadow-2xl border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-1.5 text-center">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Sign in to your suite
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter your workspace credentials to access your system
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.harshapex.com.lk"
                        className="pl-9 h-10 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                        className="pl-9 pr-10 h-10 text-xs rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400">
                      Remember me for 7 days
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Authenticating...
                      </span>
                    ) : (
                      <>
                        <span>Sign In to Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 text-center">
                  Protected by Harsh Apex Tenant Row Level Security (RLS).
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Explore Demo Packages Showcase */}
      <section className="w-full max-w-6xl mx-auto px-4 py-8 border-t border-slate-200/80 dark:border-slate-800">
        <div className="text-center space-y-1 mb-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Explore Demo Packages
          </h3>
          <p className="text-xs text-slate-500">
            One single codebase & deployment. Authenticated credentials determine your feature experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Basic Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 mb-2 font-bold">
                BASIC TIER
              </Badge>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Apex Smart Retail</h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Essential solution for independent shops and single counter stores.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600" /> POS & Fast Cash Billing</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600" /> Product SKU & Barcodes</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600" /> Basic Inventory & Alerts</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600" /> Sales Invoice PDF Generation</li>
              </ul>
            </div>
            <Link href="/packages" className="mt-4">
              <Button variant="outline" size="sm" className="w-full text-xs">
                View Features
              </Button>
            </Link>
          </div>

          {/* Business Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-sm flex flex-col justify-between relative">
            <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
              Popular
            </span>
            <div>
              <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 mb-2 font-bold">
                BUSINESS SUITE
              </Badge>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Commercial Business</h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Growing retailers, distributors, and multi-user companies.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Everything in Basic</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Advanced Customer CRM</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Quotations & Estimates</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Financial Profit & Expenses</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Staff Attendance & Multi-User</li>
              </ul>
            </div>
            <Link href="/packages" className="mt-4">
              <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                View Features
              </Button>
            </Link>
          </div>

          {/* Premium Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 mb-2 font-bold">
                PREMIUM ENTERPRISE
              </Badge>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Enterprise AI Suite</h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Corporates and multi-branch chains requiring AI & automation.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Everything in Business</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Harsh Apex AI Assistant</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Advanced HR & Payroll</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Website & E-commerce Sync</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Workflow Automation Builder</li>
              </ul>
            </div>
            <Link href="/packages" className="mt-4">
              <Button variant="outline" size="sm" className="w-full text-xs">
                View Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40">
        &copy; {new Date().getFullYear()} Harsh Apex Digital Solutions &bull; All Rights Reserved &bull; Colombo, Sri Lanka
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Demo Password Recovery</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              In this client evaluation environment, demo accounts can be auto-filled directly using the
              &ldquo;1-Click Demo Account Selector&rdquo; chips on the left side of the login screen.
            </p>
            <Button onClick={() => setShowForgotModal(false)} className="w-full text-xs font-bold">
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
