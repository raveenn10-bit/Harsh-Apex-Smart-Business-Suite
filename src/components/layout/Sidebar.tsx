'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HarshApexLogo } from '@/components/brand/HarshApexLogo';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from './UpgradeModal';
import { UserSession } from '@/types/database';
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
  Zap,
  BarChart3,
  Settings,
  ShieldAlert,
  Lock,
  ChevronRight,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  session: UserSession;
  collapsed?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  featureCode?: string;
  requiredTier?: 'BASIC' | 'BUSINESS' | 'PREMIUM';
  badge?: string;
}

export function Sidebar({ session, collapsed = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    featureName: string;
    requiredTier: 'BUSINESS' | 'PREMIUM';
  }>({
    isOpen: false,
    featureName: '',
    requiredTier: 'BUSINESS',
  });

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

  const navSections: { section: string; items: NavItem[] }[] = [
    {
      section: 'CORE OPERATIONS',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'POS & Billing', href: '/pos', icon: ShoppingCart },
        { name: 'Products', href: '/products', icon: PackageIcon },
        { name: 'Inventory', href: '/inventory', icon: Boxes },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Invoices', href: '/invoices', icon: FileText },
      ],
    },
    {
      section: 'BUSINESS SUITE',
      items: [
        {
          name: 'Quotations',
          href: '/quotations',
          icon: FileCheck,
          requiredTier: 'BUSINESS',
          featureCode: 'quotations',
        },
        {
          name: 'CRM & Notes',
          href: '/crm',
          icon: UserCheck,
          requiredTier: 'BUSINESS',
          featureCode: 'crm',
        },
        {
          name: 'Expenses',
          href: '/expenses',
          icon: Receipt,
          requiredTier: 'BUSINESS',
          featureCode: 'expenses',
        },
        {
          name: 'Finance & Profit',
          href: '/finance',
          icon: Wallet,
          requiredTier: 'BUSINESS',
          featureCode: 'finance',
        },
        {
          name: 'Staff Management',
          href: '/staff',
          icon: UserCog,
          requiredTier: 'BUSINESS',
          featureCode: 'staff',
        },
        {
          name: 'WhatsApp Simulator',
          href: '/whatsapp',
          icon: MessageSquare,
          requiredTier: 'BUSINESS',
          featureCode: 'whatsapp',
        },
      ],
    },
    {
      section: 'ENTERPRISE & AI',
      items: [
        {
          name: 'Advanced HR & Clock-in',
          href: '/hr',
          icon: UserCog,
          requiredTier: 'PREMIUM',
          featureCode: 'hr_advanced',
        },
        {
          name: 'AI Business Assistant',
          href: '/ai-assistant',
          icon: Sparkles,
          requiredTier: 'PREMIUM',
          featureCode: 'ai_assistant',
          badge: 'AI',
        },
        {
          name: 'Website & E-commerce',
          href: '/website-sync',
          icon: Globe,
          requiredTier: 'PREMIUM',
          featureCode: 'website_integration',
        },
        {
          name: 'Automation Center',
          href: '/automation',
          icon: Zap,
          requiredTier: 'PREMIUM',
          featureCode: 'automation',
        },
        {
          name: 'Advanced Analytics',
          href: '/analytics',
          icon: BarChart3,
          requiredTier: 'PREMIUM',
          featureCode: 'advanced_analytics',
        },
      ],
    },
    {
      section: 'REPORTS & SYSTEM',
      items: [
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  if (session.role === 'SUPER_ADMIN') {
    navSections.push({
      section: 'ADMIN CONTROL',
      items: [{ name: 'Super Admin Portal', href: '/super-admin', icon: ShieldAlert }],
    });
  }

  function handleItemClick(e: React.MouseEvent, item: NavItem) {
    const locked = isLocked(item.requiredTier);
    if (locked) {
      e.preventDefault();
      setUpgradeModal({
        isOpen: true,
        featureName: item.name,
        requiredTier: item.requiredTier as 'BUSINESS' | 'PREMIUM',
      });
      return;
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  }

  const packageBadgeColor = {
    BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
    BUSINESS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
    PREMIUM: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200',
  }[packageCode];

  return (
    <>
      <aside
        className={cn(
          'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 select-none z-30',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <HarshApexLogo size="sm" showBadge={!collapsed} iconOnly={collapsed} href="/dashboard" />
        </div>

        {/* Tenant Workspace Pill */}
        {!collapsed && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Store className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {session.business_name}
                </div>
              </div>
              <Badge variant="outline" className={cn('text-[10px] font-bold shrink-0', packageBadgeColor)}>
                {packageCode}
              </Badge>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6 scrollbar-thin">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {section.section}
                </div>
              )}
              {section.items.map((item, itemIdx) => {
                const locked = isLocked(item.requiredTier);
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    onClick={(e) => handleItemClick(e, item)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 relative',
                      isActive && !locked
                        ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/20'
                        : locked
                        ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive && !locked ? 'text-white' : locked ? 'text-slate-400' : 'text-slate-500 group-hover:text-blue-600 dark:text-slate-400'
                      )}
                    />

                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 truncate">
                        <span className="truncate">{item.name}</span>
                        <div className="flex items-center gap-1.5 ml-2">
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-bold">
                              {item.badge}
                            </span>
                          )}
                          {locked && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                              <Lock className="w-2.5 h-2.5" />
                              {item.requiredTier === 'PREMIUM' ? 'PRO' : 'BIZ'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Upsell Banner for Basic / Business */}
        {!collapsed && packageCode !== 'PREMIUM' && (
          <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-md shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <div className="text-[11px] font-bold tracking-tight">Upgrade Your Suite</div>
            </div>
            <p className="text-[10px] text-white/70 leading-relaxed mb-2.5">
              Unlock AI forecasting, WhatsApp automation & multi-branch tools.
            </p>
            <Link href="/packages">
              <button className="w-full py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition flex items-center justify-center gap-1">
                Explore Packages
                <ChevronRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        )}
      </aside>

      {/* Upgrade Dialog */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
        featureName={upgradeModal.featureName}
        requiredTier={upgradeModal.requiredTier}
        currentTier={packageCode}
      />
    </>
  );
}
