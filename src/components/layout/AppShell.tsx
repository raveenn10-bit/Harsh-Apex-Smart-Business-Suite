'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { UserSession } from '@/types/database';

interface AppShellProps {
  session: UserSession;
  children: React.ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
        <Sidebar session={session} collapsed={collapsed} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 z-50">
            <Sidebar
              session={session}
              collapsed={false}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header
          session={session}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen((prev) => !prev);
            } else {
              setCollapsed((prev) => !prev);
            }
          }}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
