'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, RefreshCw, CheckCircle2, ShoppingBag, 
  ExternalLink, ArrowRight, ShieldCheck, Zap, Loader2
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export default function WebsiteSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState('2 minutes ago');

  const handleTriggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSyncTime('Just now');
      setSyncMessage('Catalog inventory and prices successfully pushed to live e-commerce storefront!');
      setTimeout(() => setSyncMessage(null), 5000);
    }, 1500);
  };

  const channels = [
    {
      name: 'Harsh Apex Digital Storefront',
      url: 'https://demo.harshapex.com.lk',
      type: 'Direct Cloud Store',
      status: 'Connected & Live',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      syncedProducts: 'All SKUs Synced',
    },
    {
      name: 'WooCommerce Storefront API',
      url: 'api.harshapex.com.lk/v1/woo',
      type: 'REST Webhook',
      status: 'Active Auto-Sync',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      syncedProducts: 'Inventory 2-Way Sync',
    },
    {
      name: 'Shopify Channel Bridge',
      url: 'apps.shopify.com/harsh-apex-connector',
      type: 'GraphQL App',
      status: 'Ready to Pair',
      badgeColor: 'bg-slate-100 text-slate-600',
      syncedProducts: 'Awaiting Webhook',
    },
  ];

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Website & E-Commerce Synchronization
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Synchronize in-store POS stock levels with your online web store in real time without manual re-entry.
            </p>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync Web Catalog Now
          </button>
        </div>

        {syncMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{syncMessage}</span>
          </div>
        )}

        {/* Sync Summary Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                2-Way Stock Shield Active
              </span>
            </div>
            <h2 className="text-xl font-bold">Zero Overselling Protection</h2>
            <p className="text-xs text-blue-200 max-w-lg">
              When an item sells at the physical counter via POS, online inventory drops instantly across your web store.
            </p>
          </div>

          <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-md border border-white/10 text-center sm:text-right shrink-0">
            <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Last Catalog Sync</p>
            <p className="text-lg font-bold text-white mt-0.5">{lastSyncTime}</p>
          </div>
        </div>

        {/* Connected Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {channels.map((ch, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ch.badgeColor}`}>
                    {ch.status}
                  </span>
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{ch.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1 truncate">{ch.url}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{ch.syncedProducts}</span>
                <span className="text-blue-600 font-semibold flex items-center gap-1">
                  Manage <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Webhook Activity Log */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Live Synchronization Webhook Activity
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">SKU Stock Update Event</span>
                <p className="text-slate-400 mt-0.5">Automated delta broadcast following POS sale order completion</p>
              </div>
              <span className="font-mono text-emerald-600 font-semibold">200 OK — Dispatched</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">Price List Refresh</span>
                <p className="text-slate-400 mt-0.5">Catalog sync verified with online storefront cache</p>
              </div>
              <span className="font-mono text-emerald-600 font-semibold">200 OK — Synced</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">Storefront Heartbeat Ping</span>
                <p className="text-slate-400 mt-0.5">Latency: 28ms to Sri Lanka edge CDN</p>
              </div>
              <span className="font-mono text-blue-600 font-semibold">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
