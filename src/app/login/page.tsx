'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HarshApexLogo } from '@/components/brand/HarshApexLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Check,
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
      color: 'border-blue-400/30 hover:border-blue-400 bg-blue-950/40 text-blue-100 hover:bg-blue-900/50',
    },
    {
      label: 'Basic Demo 2 (Kandy)',
      email: 'basic2@demo.harshapex.com.lk',
      pwd: 'BasicDemo@2',
      tier: 'BASIC',
      color: 'border-blue-400/30 hover:border-blue-400 bg-blue-950/40 text-blue-100 hover:bg-blue-900/50',
    },
    {
      label: 'Business Demo 1 (Galle)',
      email: 'business1@demo.harshapex.com.lk',
      pwd: 'BusinessDemo@1',
      tier: 'BUSINESS',
      color: 'border-emerald-400/30 hover:border-emerald-400 bg-emerald-950/40 text-emerald-100 hover:bg-emerald-900/50',
    },
    {
      label: 'Business Demo 2 (Negombo)',
      email: 'business2@demo.harshapex.com.lk',
      pwd: 'BusinessDemo@2',
      tier: 'BUSINESS',
      color: 'border-emerald-400/30 hover:border-emerald-400 bg-emerald-950/40 text-emerald-100 hover:bg-emerald-900/50',
    },
    {
      label: 'Premium Demo 1 (Holdings)',
      email: 'premium1@demo.harshapex.com.lk',
      pwd: 'PremiumDemo@1',
      tier: 'PREMIUM',
      color: 'border-purple-400/30 hover:border-purple-400 bg-purple-950/40 text-purple-100 hover:bg-purple-900/50',
    },
    {
      label: 'Premium Demo 2 (Industrial)',
      email: 'premium2@demo.harshapex.com.lk',
      pwd: 'PremiumDemo@2',
      tier: 'PREMIUM',
      color: 'border-purple-400/30 hover:border-purple-400 bg-purple-950/40 text-purple-100 hover:bg-purple-900/50',
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
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105 transition-transform duration-1000"
        >
          <source src="/videos/login-bg.mp4" type="video/mp4" />
        </video>
        {/* Cinematic ambient darkening & vignette overlays */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/75" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/50 backdrop-blur-md sticky top-0">
        <HarshApexLogo size="md" href="/login" />
        <div className="flex items-center gap-3">
          <Link href="/packages">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
            >
              Explore Packages
            </Button>
          </Link>
          <a
            href="https://www.harshapex.com.lk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/70 hover:text-white font-medium hidden sm:inline transition"
          >
            harshapex.com.lk
          </a>
        </div>
      </header>

      {/* Main Login & Hero Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand Hero Pitch */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30 backdrop-blur-md shadow-lg shadow-blue-500/10">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Harsh Apex Digital Solutions &bull; Commercial SaaS</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                Run Your Entire Business From{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                  One Unified Place.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed drop-shadow-sm max-w-xl">
                The all-in-one Smart Business Management Suite built for modern Sri Lankan retail,
                wholesale, and commercial enterprises. Point of Sale, Smart Inventory, Customer CRM,
                Financial Intelligence, and AI Automation.
              </p>
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90 drop-shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Tenant RLS Security</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90 drop-shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time POS & Billing</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90 drop-shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp Notification Engine</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90 drop-shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI Business Intelligence</span>
              </div>
            </div>

            {/* Quick Demo Fill Chips */}
            <div className="pt-4 border-t border-white/15 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-white/80">
                <span>1-CLICK DEMO ACCOUNT SELECTOR:</span>
                <span className="text-[10px] font-normal text-blue-300">Select to auto-populate</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoAccounts.map((acc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => fillDemoAccount(acc)}
                    className={`p-2.5 rounded-xl text-left border text-[11px] font-semibold transition-all duration-200 flex flex-col justify-between backdrop-blur-md shadow-md ${acc.color} ${
                      email === acc.email ? 'ring-2 ring-blue-400 scale-[1.02] shadow-blue-500/30' : ''
                    }`}
                  >
                    <div className="truncate font-bold">{acc.label}</div>
                    <div className="text-[9px] uppercase font-bold opacity-80 mt-1">{acc.tier}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Secure Login Card */}
          <div className="lg:col-span-6 flex justify-center">
            <Card className="w-full max-w-md shadow-2xl border-white/15 bg-slate-900/80 backdrop-blur-xl rounded-3xl overflow-hidden text-white">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-1.5 text-center">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Sign in to your suite
                  </h2>
                  <p className="text-xs text-white/70">
                    Enter your workspace credentials to access your system
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/90">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-white/40" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.harshapex.com.lk"
                        className="pl-9 h-10 text-xs rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/90">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-white/40" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                        className="pl-9 pr-10 h-10 text-xs rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-white/40 hover:text-white"
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
                      className="rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-400 w-4 h-4"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-white/80 cursor-pointer">
                      Remember me for 7 days
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
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

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 text-center">
                  Protected by Harsh Apex Tenant Row Level Security (RLS).
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Explore Demo Packages Showcase */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 border-t border-white/10">
        <div className="text-center space-y-1 mb-6">
          <h3 className="text-lg font-black text-white">
            Explore Demo Packages
          </h3>
          <p className="text-xs text-white/70">
            One single codebase & deployment. Authenticated credentials determine your feature experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Basic Card */}
          <div className="p-5 rounded-2xl bg-slate-900/75 border border-white/15 backdrop-blur-md shadow-lg flex flex-col justify-between text-white">
            <div>
              <Badge variant="outline" className="text-[10px] text-blue-300 bg-blue-950/60 border-blue-400/40 mb-2 font-bold">
                BASIC TIER
              </Badge>
              <h4 className="text-base font-bold text-white">Apex Smart Retail</h4>
              <p className="text-xs text-white/70 mt-1 mb-3">
                Essential solution for independent shops and single counter stores.
              </p>
              <ul className="text-xs space-y-1.5 text-white/80">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400" /> POS & Fast Cash Billing</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400" /> Product SKU & Barcodes</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400" /> Basic Inventory & Alerts</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400" /> Sales Invoice PDF Generation</li>
              </ul>
            </div>
            <Link href="/packages" className="mt-4">
              <Button variant="outline" size="sm" className="w-full text-xs bg-white/10 hover:bg-white/20 text-white border-white/20">
                View Features
              </Button>
            </Link>
          </div>

          {/* Business Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border-2 border-emerald-500/60 backdrop-blur-md shadow-xl flex flex-col justify-between relative text-white">
            <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-md">
              Popular
            </span>
            <div>
              <Badge variant="outline" className="text-[10px] text-emerald-300 bg-emerald-950/60 border-emerald-400/40 mb-2 font-bold">
                BUSINESS SUITE
              </Badge>
              <h4 className="text-base font-bold text-white">Commercial Business</h4>
              <p className="text-xs text-white/70 mt-1 mb-3">
                Growing retailers, distributors, and multi-user companies.
              </p>
              <ul className="text-xs space-y-1.5 text-white/80">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Everything in Basic</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Advanced Customer CRM</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Quotations & Estimates</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Financial Profit & Expenses</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Staff Attendance & Multi-User</li>
              </ul>
            </div>
            <Link href="/packages" className="mt-4">
              <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                View Features
              </Button>
            </Link>
          </div>

          {/* Premium Card */}
          <div className="p-5 rounded-2xl bg-slate-900/75 border border-white/15 backdrop-blur-md shadow-lg flex flex-col justify-between text-white">
            <div>
              <Badge variant="outline" className="text-[10px] text-purple-300 bg-purple-950/60 border-purple-400/40 mb-2 font-bold">
                PREMIUM ENTERPRISE
              </Badge>
              <h4 className="text-base font-bold text-white">Enterprise AI Suite</h4>
              <p className="text-xs text-white/70 mt-1 mb-3">
                Corporates and multi-branch chains requiring AI & automation.
              </p>
              <ul className="text-xs space-y-1.5 text-white/80">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-400" /> Everything in Business</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-400" /> Harsh Apex AI Assistant</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-400" /> Advanced HR & Payroll</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-400" /> Website & E-commerce Sync</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-400" /> Workflow Automation Builder</li>
              </ul>
            </div>
            <Link href="/packages" className="mt-4">
              <Button variant="outline" size="sm" className="w-full text-xs bg-white/10 hover:bg-white/20 text-white border-white/20">
                View Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-white/50 border-t border-white/10">
        &copy; {new Date().getFullYear()} Harsh Apex Digital Solutions &bull; All Rights Reserved &bull; Colombo, Sri Lanka
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/20 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl text-white">
            <h4 className="text-base font-bold text-white">Demo Password Recovery</h4>
            <p className="text-xs text-white/70 leading-relaxed">
              In this client evaluation environment, demo accounts can be auto-filled directly using the
              &ldquo;1-Click Demo Account Selector&rdquo; chips on the left side of the login screen.
            </p>
            <Button onClick={() => setShowForgotModal(false)} className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-500">
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
