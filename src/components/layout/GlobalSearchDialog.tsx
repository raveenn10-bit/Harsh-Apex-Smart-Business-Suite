'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Boxes,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Shortcut Ctrl/Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle dialog handled by parent or hook
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickLinks = [
    { name: 'POS & Billing', href: '/pos', icon: ShoppingCart, category: 'App' },
    { name: 'Products Catalog', href: '/products', icon: Package, category: 'App' },
    { name: 'Inventory & Stock In', href: '/inventory', icon: Boxes, category: 'App' },
    { name: 'Customers Directory', href: '/customers', icon: Users, category: 'App' },
    { name: 'Invoices & Receipts', href: '/invoices', icon: FileText, category: 'App' },
    { name: 'AI Business Assistant', href: '/ai-assistant', icon: Sparkles, category: 'AI' },
  ];

  const sampleProducts = [
    { name: 'Pure Ceylon BOPF Tea 500g', sku: 'SKU-TEA-001', href: '/products' },
    { name: 'Araliya Keeri Samba Rice 5kg', sku: 'SKU-RICE-001', href: '/products' },
    { name: 'Pelwatte Fresh Milk 1L', sku: 'SKU-MILK-001', href: '/products' },
    { name: 'Highland Salted Butter 200g', sku: 'SKU-BUTR-001', href: '/products' },
  ];

  const sampleCustomers = [
    { name: 'Sunil Jayawardena', phone: '+94 77 234 5678', href: '/customers' },
    { name: 'Kumari Alwis', phone: '+94 71 876 5432', href: '/customers' },
    { name: 'Mohamed Rizwan', phone: '+94 76 543 2198', href: '/customers' },
  ];

  const filteredLinks = quickLinks.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = sampleProducts.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = sampleCustomers.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function navigateTo(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search modules, products, customers, or invoices..."
            className="border-none focus-visible:ring-0 text-sm shadow-none p-0 h-auto"
            autoFocus
          />
        </DialogHeader>

        <div className="max-h-[360px] overflow-y-auto p-3 space-y-4">
          {/* Quick Links */}
          {filteredLinks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                Quick Navigation
              </div>
              <div className="space-y-1">
                {filteredLinks.map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigateTo(link.href)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-200 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span>{link.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                Products
              </div>
              <div className="space-y-1">
                {filteredProducts.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigateTo(p.href)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-200 group"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.sku}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                Customers
              </div>
              <div className="space-y-1">
                {filteredCustomers.map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigateTo(c.href)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-200 group"
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-[10px] text-slate-400">{c.phone}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between px-4">
          <span>Use arrow keys to navigate</span>
          <span>Esc to exit</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
