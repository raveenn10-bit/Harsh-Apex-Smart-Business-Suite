'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Bot, User, Loader2, Lightbulb,
  Lock, Crown, ArrowRight, AlertCircle, RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  error?: boolean;
}

interface ApiResponse {
  success?: boolean;
  answer?: string;
  error?: string;
  locked?: boolean;
  current_package?: string;
  upgrade_url?: string;
  config_error?: boolean;
}

// ─── Locked State Component (BASIC / BUSINESS) ───────────────────────────────

function LockedAIAssistant({ currentPackage }: { currentPackage?: string }) {
  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-3xl mx-auto flex flex-col items-center text-center space-y-6 pt-16">
        {/* Lock icon */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200 flex items-center justify-center shadow-lg">
          <Crown className="w-12 h-12 text-purple-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            AI Business Intelligence Advisor
          </h1>
          <p className="text-slate-500 text-sm max-w-lg">
            Ask natural language questions about your sales, inventory, customers, and finances —
            and get instant AI-powered insights.
          </p>
        </div>

        {/* Package badge */}
        <div className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">
          Your workspace: <span className="text-slate-700">{currentPackage ?? 'BASIC'}</span>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
          {[
            { icon: '📊', label: 'Revenue & Profit Analysis', desc: 'Live financial summaries with trend insights' },
            { icon: '📦', label: 'Inventory Intelligence', desc: 'Low stock alerts & reorder recommendations' },
            { icon: '🏆', label: 'Best Seller Rankings', desc: 'Top products by volume and revenue' },
            { icon: '💳', label: 'Customer Credit Overview', desc: 'Outstanding balances & receivables summary' },
            { icon: '🚀', label: 'Weekly Strategy Advisor', desc: 'Personalised growth recommendations' },
            { icon: '💬', label: 'Natural Language Chat', desc: 'Ask anything in plain Sinhala or English' },
          ].map((f) => (
            <div key={f.label} className="flex gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <span className="text-2xl shrink-0">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-800">{f.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <a
            href="/packages"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-semibold shadow-md transition"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Premium
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-sm font-semibold transition"
          >
            Back to Dashboard
          </a>
        </div>

        <p className="text-[11px] text-slate-400">
          <Lock className="w-3 h-3 inline mr-1" />
          AI Business Assistant is available exclusively on the Premium package.
        </p>
      </div>
    </AppShell>
  );
}

// ─── Main Chat UI (PREMIUM) ───────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: '📊 Revenue & Profit', prompt: 'Summarize my total revenue, expenses, and net profit for this month.' },
  { label: '📦 Low Stock Alert', prompt: 'Which products are low in stock and need reordering urgently?' },
  { label: '🏆 Best Sellers', prompt: 'What are my top 5 best-selling products by revenue?' },
  { label: '💳 Customer Debts', prompt: 'Show me outstanding customer credit balances and unpaid invoices.' },
  { label: '🚀 Weekly Strategy', prompt: 'Give me strategic business improvement recommendations for this week.' },
  { label: "📈 Today's Sales", prompt: "How many orders and what revenue did we make today?" },
];

function formatMarkdown(text: string): React.ReactNode {
  // Simple inline markdown: **bold**, bullet lines
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 rounded text-[10px]">$1</code>');
    const isBullet = line.trimStart().startsWith('•') || line.trimStart().startsWith('-') || line.trimStart().startsWith('*');
    return (
      <span key={i} className={`block ${isBullet ? 'ml-2' : ''} ${i > 0 && !isBullet ? 'mt-1' : ''}`}
        dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }}
      />
    );
  });
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Welcome to your **Harsh Apex AI Business Intelligence Advisor**!\n\nI have live access to your store's sales, inventory, customer debts, and financial records. Ask me anything about your business — in plain English or Sinhala.\n\nTry one of the quick prompts below or type your own question.",
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<string | undefined>();
  const [configError, setConfigError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const addMessage = (role: 'user' | 'assistant', content: string, error = false) => {
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      error,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const sendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    addMessage('user', promptText.trim());
    setInput('');
    setLoading(true);

    // Build history for multi-turn context (last 8 messages)
    const historyForApi = messages
      .filter((m) => !m.error)
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText.trim(),
          history: historyForApi,
        }),
      });

      const data: ApiResponse = await res.json();

      if (res.status === 403 && data.locked) {
        setIsLocked(true);
        setCurrentPackage(data.current_package);
        return;
      }

      if (res.status === 503 && data.config_error) {
        setConfigError(true);
        addMessage('assistant', '⚙️ **Administrator Notice:** The AI service is not configured yet. Please contact your system administrator to set up the Gemini API key.', true);
        return;
      }

      if (data.success && data.answer) {
        addMessage('assistant', data.answer);
      } else {
        addMessage('assistant', `⚠️ ${data.error || 'Something went wrong. Please try again.'}`, true);
      }
    } catch {
      addMessage('assistant', '⚠️ Could not connect to AI service. Please check your internet connection and try again.', true);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // If locked, show upgrade screen
  if (isLocked) {
    return <LockedAIAssistant currentPackage={currentPackage} />;
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
              AI Business Intelligence Advisor
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Powered by Google Gemini · Live data from your business records
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <Bot className="w-4 h-4 text-purple-600" />
            PREMIUM · Gemini 1.5 Flash
          </div>
        </div>

        {/* ── Config error banner ── */}
        {configError && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            AI service requires administrator configuration (GEMINI_API_KEY not set).
          </div>
        )}

        {/* ── Quick Prompts ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Quick:
          </span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => sendPrompt(qp.prompt)}
              disabled={loading}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-xl font-medium whitespace-nowrap transition shadow-xs disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* ── Chat Container ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '460px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'ml-auto flex-row-reverse max-w-xl' : 'max-w-2xl'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                    m.role === 'user'
                      ? 'bg-blue-600'
                      : m.error
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : m.error
                      ? 'bg-amber-50 border border-amber-200 text-amber-800 rounded-tl-xs'
                      : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {m.role === 'assistant' ? formatMarkdown(m.content) : m.content}
                  </div>
                  <span
                    className={`block text-[10px] text-right mt-1.5 ${
                      m.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 max-w-xs">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-xs text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Analyzing your business data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Bar ── */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendPrompt(input); }}
            className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2"
          >
            <button
              type="button"
              onClick={() => setMessages([messages[0]])}
              title="Clear chat"
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about your business (e.g. 'What were today's sales?', 'Low stock items?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-xs disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
