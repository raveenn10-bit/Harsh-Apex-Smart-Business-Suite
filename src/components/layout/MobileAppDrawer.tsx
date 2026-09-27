'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserSession } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from './UpgradeModal';
import {
  LayoutDashboard,
  ShoppingCart,
  Package as PackageIcon,
  Boxes,
  Users,
  FileText,
  FileCheck,
  UserCheck,
  Receipt,
  Wallet,
  UserCog,
  MessageSquare,
  Sparkles,
  Globe,
  BarChart3,
  Settings,
  ShieldAlert,
  Lock,
  X,
  Store,
  ChevronRight,
  Layers,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
}

interface AppItem {
  name: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
  category: 'core' | 'business' | 'enterprise' | 'system';
  requiredTier?: 'BASIC' | 'BUSINESS' | 'PREMIUM';
  badge?: string;
}

export function MobileAppDrawer({ isOpen, onClose, session }: MobileAppDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    featureName: string;
    requiredTier: 'BUSINESS' | 'PREMIUM';
  }>({
    isOpen: false,
    featureName: '',
    requiredTier: 'BUSINESS',
  });
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isOpen) return null;

  const packageCode = session.package_code;

  function isLocked(tier?: 'BASIC' | 'BUSINESS' | 'PREMIUM'): boolean {
    if (!tier || tier === 'BASIC') return false;
    if (session.role === 'SUPER_ADMIN') return false;
    if (tier === 'BUSINESS') {
      return packageCode === 'BASIC';
    }
    if (tier === 'PREMIUM') {
      return packageCode === 'BASIC' || packageCode === 'BUSINESS';
    }
    return false;
  }

  const apps: AppItem[] = [
    // Core
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-blue-500', bgLight: 'bg-blue-500/10', category: 'core' },
    { name: 'POS & Billing', href: '/pos', icon: ShoppingCart, color: 'text-indigo-500', bgLight: 'bg-indigo-500/10', category: 'core' },
    { name: 'Products', href: '/products', icon: PackageIcon, color: 'text-sky-500', bgLight: 'bg-sky-500/10', category: 'core' },
    { name: 'Inventory', href: '/inventory', icon: Boxes, color: 'text-cyan-500', bgLight: 'bg-cyan-500/10', category: 'core' },
    { name: 'Customers', href: '/customers', icon: Users, color: 'text-teal-500', bgLight: 'bg-teal-500/10', category: 'core' },
    { name: 'Invoices', href: '/invoices', icon: FileText, color: 'text-blue-600', bgLight: 'bg-blue-600/10', category: 'core' },

    // Business Suite
    { name: 'Quotations', href: '/quotations', icon: FileCheck, color: 'text-emerald-500', bgLight: 'bg-emerald-500/10', category: 'business', requiredTier: 'BUSINESS' },
    { name: 'CRM & Leads', href: '/crm', icon: UserCheck, color: 'text-emerald-600', bgLight: 'bg-emerald-600/10', category: 'business', requiredTier: 'BUSINESS' },
    { name: 'Expenses', href: '/expenses', icon: Receipt, color: 'text-rose-500', bgLight: 'bg-rose-500/10', category: 'business', requiredTier: 'BUSINESS' },
    { name: 'Finance & P&L', href: '/finance', icon: Wallet, color: 'text-amber-500', bgLight: 'bg-amber-500/10', category: 'business', requiredTier: 'BUSINESS' },
    { name: 'Staff Roster', href: '/staff', icon: UserCog, color: 'text-orange-500', bgLight: 'bg-orange-500/10', category: 'business', requiredTier: 'BUSINESS' },
    { name: 'WhatsApp Bot', href: '/whatsapp', icon: MessageSquare, color: 'text-green-500', bgLight: 'bg-green-500/10', category: 'business', requiredTier: 'BUSINESS' },

    // Enterprise & AI
    { name: 'HR & Clock-in', href: '/hr', icon: UserCog, color: 'text-purple-500', bgLight: 'bg-purple-500/10', category: 'enterprise', requiredTier: 'PREMIUM' },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, color: 'text-violet-500', bgLight: 'bg-violet-500/10', category: 'enterprise', requiredTier: 'PREMIUM', badge: 'AI' },
    { name: 'Online Store', href: '/website-sync', icon: Globe, color: 'text-fuchsia-500', bgLight: 'bg-fuchsia-500/10', category: 'enterprise', requiredTier: 'PREMIUM' },

    // System
    { name: 'Analytics', href: '/reports', icon: BarChart3, color: 'text-slate-600 dark:text-slate-300', bgLight: 'bg-slate-500/10', category: 'system' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'text-slate-600 dark:text-slate-300', bgLight: 'bg-slate-500/10', category: 'system' },
  ];

  if (session.role === 'SUPER_ADMIN') {
    apps.push({
      name: 'Super Admin',
      href: '/super-admin',
      icon: ShieldAlert,
      color: 'text-red-500',
      bgLight: 'bg-red-500/10',
      category: 'system',
    });
  }

  async function handleQuickSwitch(email: string, pass: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* iOS Bottom Sheet Container */}
        <div className="relative z-10 w-full max-h-[85vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* iOS Grab Handle */}
          <div className="pt-3 pb-2 flex justify-center">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Sheet Header */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                {session.full_name?.slice(0, 2).toUpperCase() || 'HA'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {session.business_name}
                  <Badge variant="outline" className="text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {packageCode}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">{session.email}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Demo Account Switcher Button (Mobile Optimized) */}
          <div className="px-5 pt-3">
            <button
              onClick={() => setShowDemoSwitcher(!showDemoSwitcher)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Switch Demo Workspace</span>
              </div>
              <ChevronRight className={cn('w-4 h-4 text-slate-400 transition-transform duration-200', showDemoSwitcher && 'rotate-90')} />
            </button>

            {showDemoSwitcher && (
              <div className="mt-2 p-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1 animate-in fade-in duration-150">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Basic Suite Workspaces</div>
                <button
                  onClick={() => handleQuickSwitch('basic1@demo.harshapex.com.lk', 'BasicDemo@1')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-left font-medium"
                >
                  <span>Colombo Branch (Basic 1)</span>
                  {session.email === 'basic1@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('basic2@demo.harshapex.com.lk', 'BasicDemo@2')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-left font-medium"
                >
                  <span>Kandy Branch (Basic 2)</span>
                  {session.email === 'basic2@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 px-2 pt-2 pb-1">Business Suite Workspaces</div>
                <button
                  onClick={() => handleQuickSwitch('business1@demo.harshapex.com.lk', 'BusinessDemo@1')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-left font-medium"
                >
                  <span>Galle Supermarket (Business 1)</span>
                  {session.email === 'business1@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('business2@demo.harshapex.com.lk', 'BusinessDemo@2')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-left font-medium"
                >
                  <span>Negombo Pharmacy (Business 2)</span>
                  {session.email === 'business2@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>

                <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 px-2 pt-2 pb-1">Premium Suite Workspaces</div>
                <button
                  onClick={() => handleQuickSwitch('premium1@demo.harshapex.com.lk', 'PremiumDemo@1')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-left font-medium"
                >
                  <span>Apex Holdings (Premium 1)</span>
                  {session.email === 'premium1@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('premium2@demo.harshapex.com.lk', 'PremiumDemo@2')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-left font-medium"
                >
                  <span>Apex Industrial (Premium 2)</span>
                  {session.email === 'premium2@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Apps Grid (iOS Style App Library / Control Center) */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2.5">
                Business Suite Applications
              </div>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {apps.map((app) => {
                  const locked = isLocked(app.requiredTier);
                  const isActive = pathname === app.href;
                  const Icon = app.icon;

                  return (
                    <button
                      key={app.name}
                      onClick={(e) => {
                        if (locked) {
                          setUpgradeModal({
                            isOpen: true,
                            featureName: app.name,
                            requiredTier: app.requiredTier as 'BUSINESS' | 'PREMIUM',
                          });
                        } else {
                          onClose();
                          router.push(app.href);
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center p-2 rounded-2xl transition active:scale-90 group text-center',
                        isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/60 ring-1 ring-blue-500/30'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-[18px] flex items-center justify-center shadow-xs transition-transform',
                            app.bgLight,
                            app.color,
                            locked && 'opacity-50 grayscale'
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        {locked && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm">
                            <Lock className="w-2.5 h-2.5" />
                          </div>
                        )}
                        {app.badge && !locked && (
                          <span className="absolute -top-1 -right-1.5 px-1 py-0.2 rounded-full bg-purple-600 text-white text-[8px] font-black shadow-xs">
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 line-clamp-1 max-w-full">
                        {app.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Quick Links & Logout */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs active:scale-[0.98] transition"
              >
                <LogOut className="w-4 h-4" />
                <span>{loggingOut ? 'Signing out...' : 'Sign Out of Harsh Apex Suite'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal((prev) => ({ ...prev, isOpen: false }))}
        featureName={upgradeModal.featureName}
        requiredTier={upgradeModal.requiredTier}
        currentTier={packageCode}
      />
    </>
  );
}
