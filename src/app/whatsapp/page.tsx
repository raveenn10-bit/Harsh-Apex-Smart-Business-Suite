'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, CheckCheck, Smartphone, ShieldCheck, 
  Loader2, CheckCircle, RefreshCw, FileText, Bell, Sparkles
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface WhatsAppMsg {
  id: string;
  recipient_phone: string;
  recipient_name: string;
  template_name: string;
  message_body: string;
  status: string;
  sent_at: string;
}

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<WhatsAppMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Form
  const [recipientName, setRecipientName] = useState('Nimal Silva');
  const [recipientPhone, setRecipientPhone] = useState('+94 77 123 4567');
  const [selectedTemplate, setSelectedTemplate] = useState('order_receipt');
  const [messageBody, setMessageBody] = useState('');

  const templates: Record<string, { label: string; text: string }> = {
    order_receipt: {
      label: '🧾 POS Order Receipt',
      text: `Hello Nimal Silva! 🛍️\n\nThank you for shopping with Harsh Apex Retail.\nYour Order #HA-ORD-1002 has been successfully completed.\n\nTotal Paid: Rs. 4,850.00\nPayment Method: Cash\n\nView Digital Receipt:\nhttps://demo.harshapex.com.lk/invoices\n\nHave a wonderful day!`,
    },
    invoice_reminder: {
      label: '⚠️ Invoice Due Reminder',
      text: `Dear Nimal Silva,\n\nThis is a friendly reminder that Invoice #HA-INV-00104 with an outstanding balance of Rs. 12,500.00 is due for payment.\n\nPlease settle via bank transfer or visit our branch.\n\nHarsh Apex Digital Solutions`,
    },
    payment_confirmation: {
      label: '✅ Payment Received Confirmation',
      text: `Dear Customer,\n\nWe have received your payment of Rs. 15,000.00 toward your account.\nYour updated balance is Rs. 0.00.\n\nThank you for your prompt settlement!`,
    },
    promo_announcement: {
      label: '🎉 Special Promo Offer',
      text: `Exclusive Weekend Sale at Harsh Apex! 🌟\n\nEnjoy up to 25% OFF on premium electronics and fashion accessories this Saturday and Sunday only.\n\nShow this WhatsApp message at the counter to claim your discount!`,
    },
  };

  useEffect(() => {
    setMessageBody(templates[selectedTemplate]?.text || '');
  }, [selectedTemplate]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim() || !messageBody.trim()) return;

    try {
      setSending(true);
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          template_name: selectedTemplate,
          message_body: messageBody.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSendSuccess('Message delivered with official 2-way read receipts!');
        await fetchMessages();
        setTimeout(() => setSendSuccess(null), 4000);
      } else {
        alert(data.error || 'Failed to dispatch message');
      }
    } catch (err) {
      console.error('Error dispatching WhatsApp message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-emerald-600" />
              WhatsApp Business Simulator & Dispatcher
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Automate customer notifications, digital invoice dispatches, payment confirmations, and promotional alerts via WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Harsh Apex Cloud API Connected
          </div>
        </div>

        {sendSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{sendSuccess}</span>
          </div>
        )}

        {/* 2-Column: Sender Config & Live Phone Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Dispatch Controls (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Dispatch Custom or Automated Notification
              </h2>
              <span className="text-xs text-slate-400">Live Simulator</span>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              {/* Template selector pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Message Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(templates).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTemplate(key)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left transition border ${
                        selectedTemplate === key
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={6}
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Simulate WhatsApp Dispatch
                </button>
              </div>
            </form>
          </div>

          {/* Live Mobile Phone Device Mockup (5 Cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[320px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800">
              {/* Phone Speaker & Camera notch */}
              <div className="flex justify-center mb-2">
                <div className="w-24 h-4 bg-slate-800 rounded-full" />
              </div>

              {/* WhatsApp App Container */}
              <div className="bg-[#efeae2] rounded-[30px] overflow-hidden flex flex-col h-[520px]">
                {/* WhatsApp Chat Header */}
                <div className="bg-[#075e54] text-white p-3 flex items-center gap-2.5 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    HA
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">Harsh Apex Suite</p>
                    <p className="text-[10px] text-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Official Business Account
                    </p>
                  </div>
                </div>

                {/* Chat Message Scroll */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[radial-gradient(#00000008_1px,transparent_1px)] [background-size:16px_16px]">
                  <div className="flex justify-center">
                    <span className="bg-white/80 backdrop-blur-xs text-[10px] text-slate-500 px-2 py-0.5 rounded-full shadow-xs">
                      TODAY
                    </span>
                  </div>

                  {/* Outgoing Message Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-[#d9fdd3] max-w-[85%] rounded-2xl rounded-tr-xs p-3 shadow-xs text-xs text-slate-900 space-y-1.5">
                      <p className="whitespace-pre-wrap leading-relaxed text-[11px]">{messageBody || 'Select or type a message...'}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 pt-0.5">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Fake Bar */}
                <div className="bg-white p-2.5 border-t border-slate-200 flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full px-3 py-1.5 text-[11px] text-slate-400">
                    Message...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-xs">
                    <Send className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch History Audit Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Dispatched WhatsApp Logs
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Audit log of system-generated and broadcast notifications</p>
            </div>
            <button
              onClick={fetchMessages}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No messages sent yet. Use the simulator above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Message Snippet</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Sent Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {messages.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{m.recipient_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{m.recipient_phone}</td>
                      <td className="px-4 py-3 capitalize">{m.template_name.replace('_', ' ')}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-500">{m.message_body}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCheck className="w-3 h-3 text-blue-500" />
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
