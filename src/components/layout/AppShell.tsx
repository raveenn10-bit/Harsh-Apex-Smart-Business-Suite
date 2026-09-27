'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileAppDrawer } from './MobileAppDrawer';
import { UserSession } from '@/types/database';

interface AppShellProps {
  session?: UserSession;
  children: React.ReactNode;
}

const DEFAULT_SESSION: UserSession = {
  user_id: '00000000-0000-0000-0000-000000000001',
  profile_id: '00000000-0000-0000-0000-000000000001',
  email: 'business1@demo.harshapex.com.lk',
  full_name: 'Harshana Galle (Owner)',
  avatar_url: null,
  role: 'OWNER',
  business_id: '00000000-0000-0000-0000-000000000003',
  business_name: 'Harsh Apex Tech Galle',
  business_slug: 'demo-business-01',
  package_code: 'BUSINESS',
  package_name: 'Business Growth',
  currency: 'LKR',
  currency_symbol: 'Rs. ',
  features: [
    'dashboard', 'pos', 'products', 'inventory', 'customers',
    'invoices', 'quotations', 'expenses', 'finance', 'staff',
    'crm', 'whatsapp'
  ],
  permissions: ['manage_products', 'manage_settings', 'use_pos', 'view_reports'],
};

export function AppShell({ session: propSession, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<UserSession>(propSession || DEFAULT_SESSION);

  useEffect(() => {
    if (propSession) {
      setActiveSession(propSession);
      return;
    }

    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.session) {
          setActiveSession(data.session);
        }
      } catch (err) {
        console.error('Failed to load active session in AppShell:', err);
      }
    };
    loadSession();
  }, [propSession]);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full">
        <Sidebar session={activeSession} collapsed={collapsed} />
      </div>

      {/* Main Workspace Frame */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header
          session={activeSession}
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setMobileOpen((prev) => !prev);
            } else {
              setCollapsed((prev) => !prev);
            }
          }}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* iPhone / Mobile Floating Glass Bottom Dock */}
      <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />

      {/* iOS App Drawer / Bottom Sheet */}
      <MobileAppDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        session={activeSession}
      />

      {/* Global Search Dialog */}
      <GlobalSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
