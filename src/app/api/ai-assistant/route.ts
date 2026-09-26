/**
 * POST /api/ai-assistant
 *
 * Security layers:
 * 1. Authentication: requires valid session cookie
 * 2. Package gate: PREMIUM only (or SUPER_ADMIN)
 * 3. Feature gate: ai_assistant feature flag
 * 4. Tenant isolation: business_id always from session, never from request body
 * 5. GEMINI_API_KEY never exposed to client
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasFeature } from '@/lib/auth/permissions';
import { askGemini, ConversationMessage } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Package gate ──────────────────────────────────────────────────────
  const isSuperAdmin = session.role === 'SUPER_ADMIN';
  const isPremium = session.package_code === 'PREMIUM';

  if (!isSuperAdmin && !isPremium) {
    return NextResponse.json(
      {
        locked: true,
        current_package: session.package_code,
        message: 'AI Business Assistant is a Premium feature. Upgrade your workspace to unlock it.',
        upgrade_url: '/packages',
      },
      { status: 403 }
    );
  }

  // ── 3. Feature flag gate ─────────────────────────────────────────────────
  if (!isSuperAdmin && !hasFeature(session, 'ai_assistant')) {
    return NextResponse.json(
      { locked: true, message: 'AI Assistant feature is not enabled for your workspace.' },
      { status: 403 }
    );
  }

  // ── 4. Parse request ──────────────────────────────────────────────────────
  let body: { prompt?: string; history?: ConversationMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, history = [] } = body;

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  if (prompt.trim().length > 2000) {
    return NextResponse.json({ error: 'Prompt too long (max 2000 characters)' }, { status: 400 });
  }

  // ── 5. Sanitize history (max 10 turns to keep context manageable) ─────────
  const sanitizedHistory: ConversationMessage[] = (Array.isArray(history) ? history : [])
    .slice(-10)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: String(msg.content || '').slice(0, 4000),
    }));

  // ── 6. Call Gemini — business_id is ALWAYS from session ──────────────────
  const result = await askGemini(
    prompt.trim(),
    session.business_id,       // ← from verified server session, never from body
    session.business_name,
    sanitizedHistory
  );

  if (!result.ok) {
    if (result.configError) {
      return NextResponse.json(
        { error: result.error, config_error: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    answer: result.answer,
    timestamp: new Date().toISOString(),
  });
}
