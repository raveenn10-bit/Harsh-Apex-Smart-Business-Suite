'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Grid,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
    },
    {
      name: 'POS',
      href: '/pos',
      icon: ShoppingCart,
      isCenter: true,
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: Receipt,
    },
    {
      name: 'More',
      onClick: onOpenMenu,
      icon: Grid,
      isAction: true,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-3 inset-x-3 max-w-sm mx-auto z-40 lg:hidden select-none"
    >
      <div className="relative flex items-center justify-around px-2 py-1.5 rounded-[28px] backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/15 shadow-[0_12px_40px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {navItems.map((item, index) => {
          const isActive = !item.isAction && (
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href || '###')
          );
          const Icon = item.icon;

          // Prominent center button for POS
          if (item.isCenter) {
            return (
              <Link
                key={index}
                href={item.href!}
                className="group relative flex flex-col items-center -mt-5 focus:outline-none"
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 active:scale-90 ring-4 ring-white dark:ring-slate-900',
                    isActive
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/40'
                      : 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-blue-500/30 group-hover:scale-105'
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                  POS
                </span>
              </Link>
            );
          }

          // More / Action button
          if (item.isAction) {
            return (
              <button
                key={index}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-150 active:scale-90 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-1">
                  {item.name}
                </span>
              </button>
            );
          }

          // Regular Tab link
          return (
            <Link
              key={index}
              href={item.href!}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-150 active:scale-90',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
