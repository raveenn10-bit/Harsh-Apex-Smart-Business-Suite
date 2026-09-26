'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Send, Bot, User, ArrowRight, Loader2, 
  TrendingUp, Boxes, Users, DollarSign, Lightbulb, RefreshCw
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "👋 Welcome to your **Harsh Apex AI Business Intelligence Advisor**! I have real-time access to your store's sales, inventory levels, customer debts, and profit margins. How can I help you optimize your business operations today?",
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    { label: '📊 Revenue & Net Profit', prompt: 'Summarize my total revenue, expenses, and net profit.' },
    { label: '📦 Low Stock Alert', prompt: 'Which items are low in stock and need reordering?' },
    { label: '🏆 Best Selling Products', prompt: 'What are our top best-selling products by sales volume?' },
    { label: '💳 Customer Credit & Debts', prompt: 'Check outstanding customer credit balances and debts.' },
    { label: '🚀 Weekly Strategy', prompt: 'Give me strategic business improvement recommendations for this week.' },
  ];

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: data.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: '⚠️ I encountered an error accessing your business metrics. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
              AI Business Intelligence Advisor
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Ask natural language questions about your business, sales trends, stock shortages, and receive actionable insights.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <Bot className="w-4 h-4 text-purple-600" />
            Harsh Apex Neural Engine v2
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Instant Prompts:
          </span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(qp.prompt)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-xl font-medium whitespace-nowrap transition shadow-xs"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Chat Conversation Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[580px] overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-1.5 shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[10px] text-right ${
                      m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-md">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-xs text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  Analyzing business ledgers and calculating metrics...
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about your business (e.g. 'How much did we make today?', 'What is our gross margin?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-xs p-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-xs"
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
