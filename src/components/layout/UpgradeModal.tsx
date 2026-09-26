'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  requiredTier: 'BUSINESS' | 'PREMIUM';
  currentTier?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  requiredTier,
  currentTier = 'BASIC',
}: UpgradeModalProps) {
  const isPremium = requiredTier === 'PREMIUM';

  const tierFeatures = isPremium
    ? [
        'AI Business Assistant & Predictive Forecasting',
        'Advanced HR, Clock-in Attendance & Payroll Ledger',
        'Omnichannel E-commerce & Website Inventory Sync',
        'Visual Workflow Automation Center',
        'Enterprise Activity & Security Audit Logs',
        'Advanced Business Intelligence Analytics',
      ]
    : [
        'Advanced Inventory Management & Suppliers',
        'Complete Customer CRM & Interaction Dossiers',
        'Professional Quotations with 1-Click Invoice Conversion',
        'Categorized Expense Tracking & Receipts',
        'Financial Profit & Loss Reports',
        'Staff Management & Multi-User Access',
        'WhatsApp Automated Receipts & Notifications',
      ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
        <div
          className={`p-6 text-white ${
            isPremium
              ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900'
              : 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20 uppercase tracking-widest text-[10px] font-bold px-2.5 py-1"
            >
              {requiredTier} FEATURE
            </Badge>
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-xs">
              <Lock className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight">{featureName}</h2>
          <p className="text-white/80 text-sm mt-1">
            This module is exclusive to Harsh Apex {requiredTier === 'PREMIUM' ? 'Premium Enterprise' : 'Business Suite'}.
          </p>
        </div>

        <div className="p-6 space-y-5 bg-white dark:bg-slate-950">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Included in {requiredTier}:
            </div>
            <ul className="space-y-2.5">
              {tierFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>
              Your current plan: <strong className="text-slate-900 dark:text-white uppercase">{currentTier}</strong>
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Instant Upgrade Available
            </span>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Continue Demo
            </Button>
            <Link href="/packages" className="w-full sm:w-auto">
              <Button
                className={`w-full ${
                  isPremium
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to {requiredTier}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
