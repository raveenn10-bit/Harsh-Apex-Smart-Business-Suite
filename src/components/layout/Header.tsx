'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  Sparkles,
  ChevronDown,
  Store,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  session: UserSession;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export function Header({ session, onToggleSidebar, onOpenSearch }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

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

  async function handleQuickSwitch(email: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Quick switch error:', err);
    }
  }

  const packageColors = {
    BASIC: 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300',
    BUSINESS: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300',
    PREMIUM: 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300',
  }[session.package_code];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Left: Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Global Search trigger bar */}
        <div
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search products, customers, invoices...</span>
            <span className="sm:hidden">Search...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Package Indicator Pill */}
        <Badge
          variant="outline"
          className={`hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 ${packageColors}`}
        >
          <Sparkles className="w-3 h-3" />
          {session.package_code} SUITE
        </Badge>

        {/* Quick Demo Switcher Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 h-9"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Switch Demo</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            <DropdownMenuLabel className="text-xs text-slate-500">1-Click Demo Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Basic Tier</div>
            <DropdownMenuItem onClick={() => handleQuickSwitch('basic1@demo.harshapex.com.lk', 'BasicDemo@1')} className="text-xs flex justify-between cursor-pointer">
              <span>DEMO_BASIC_01 (Colombo)</span>
              {session.email === 'basic1@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickSwitch('basic2@demo.harshapex.com.lk', 'BasicDemo@2')} className="text-xs flex justify-between cursor-pointer">
              <span>DEMO_BASIC_02 (Kandy)</span>
              {session.email === 'basic2@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <div className="text-[10px] font-bold text-emerald-600 px-2 py-1 uppercase">Business Tier</div>
            <DropdownMenuItem onClick={() => handleQuickSwitch('business1@demo.harshapex.com.lk', 'BusinessDemo@1')} className="text-xs flex justify-between cursor-pointer">
              <span>DEMO_BUSINESS_01 (Galle)</span>
              {session.email === 'business1@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickSwitch('business2@demo.harshapex.com.lk', 'BusinessDemo@2')} className="text-xs flex justify-between cursor-pointer">
              <span>DEMO_BUSINESS_02 (Negombo)</span>
              {session.email === 'business2@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <div className="text-[10px] font-bold text-purple-600 px-2 py-1 uppercase">Premium Tier</div>
            <DropdownMenuItem onClick={() => handleQuickSwitch('premium1@demo.harshapex.com.lk', 'PremiumDemo@1')} className="text-xs flex justify-between cursor-pointer">
              <span>DEMO_PREMIUM_01 (Holdings)</span>
              {session.email === 'premium1@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickSwitch('premium2@demo.harshapex.com.lk', 'PremiumDemo@2')} className="text-xs flex justify-between cursor-pointer">
              <span>DEMO_PREMIUM_02 (Industrial)</span>
              {session.email === 'premium2@demo.harshapex.com.lk' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg h-9 w-9"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Live Notifications</span>
              <span
                onClick={() => setUnreadNotifications(0)}
                className="text-[10px] text-blue-600 hover:underline cursor-pointer"
              >
                Mark all read
              </span>
            </div>
            <DropdownMenuSeparator />
            <div className="space-y-1">
              <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 text-xs">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  New POS Order #ORD-2026-1005
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">Rs. 8,900.00 paid via Card</div>
                <div className="text-slate-400 text-[9px] mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> 10m ago
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 text-xs">
                <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Low Stock Alert: Pure Coconut Oil
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">Remaining stock: 3 units (Threshold: 10)</div>
                <div className="text-slate-400 text-[9px] mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> 1h ago
                </div>
              </div>
              <div className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  Daily Sales Settlement Ready
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">Gross revenue Rs. 142,500.00 reconciled</div>
                <div className="text-slate-400 text-[9px] mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Today
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition outline-none">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {session.full_name
                  ? session.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                  : 'HA'}
              </div>
              <div className="hidden xl:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {session.full_name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  {session.role}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden xl:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 p-2">
            <div className="px-2 py-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white">{session.full_name}</div>
              <div className="text-[11px] text-slate-500 truncate">{session.email}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Badge variant="outline" className={`text-[9px] font-bold ${packageColors}`}>
                  {session.package_code}
                </Badge>
                <Badge variant="secondary" className="text-[9px] uppercase">
                  {session.role}
                </Badge>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')} className="text-xs cursor-pointer">
              <Settings className="w-3.5 h-3.5 mr-2" />
              Business Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/packages')} className="text-xs cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-blue-600" />
              Compare Packages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs text-rose-600 dark:text-rose-400 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
