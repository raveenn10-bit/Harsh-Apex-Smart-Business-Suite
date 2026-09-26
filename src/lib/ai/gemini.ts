/**
 * Secure server-side Gemini AI service.
 *
 * SECURITY:
 * - GEMINI_API_KEY is NEVER sent to browser/client.
 * - business_id is ALWAYS injected from the verified server session.
 * - The AI model cannot access raw DB credentials or cross-tenant data.
 */
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from '@google/generative-ai';
import { executeBusinessTool, GEMINI_TOOL_DECLARATIONS } from './tools';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeminiResponse {
  ok: boolean;
  answer?: string;
  error?: string;
  configError?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Models tried in order of speed and current availability
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_INSTRUCTION = `You are the Harsh Apex AI Business Intelligence Advisor — a sophisticated, professional business analyst embedded inside a Sri Lankan multi-tenant SaaS platform called Harsh Apex Smart Business Suite.

CRITICAL RULES:
- You ONLY have access to data for the current authenticated business via the provided tools.
- Never fabricate numbers. Always use the tool functions to retrieve real data.
- Never reveal internal technical details, database schema, SQL queries, or API keys.
- Format currency as "Rs." with comma-separated thousands (e.g., Rs. 125,500.00).
- Respond in a professional, concise, actionable manner.
- If a user asks something unrelated to their business, politely redirect them.
- Use markdown formatting for clarity (bold headings, bullet points, tables when useful).
- Always cite the data source as "your live business records".`;

// ─── Safety Settings ──────────────────────────────────────────────────────────

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// ─── Main Service Function ────────────────────────────────────────────────────

/**
 * Send a message to Gemini with full multi-turn conversation history.
 * Automatically tries candidate models with fallback for high resilience.
 */
export async function askGemini(
  userMessage: string,
  businessId: string,
  businessName: string,
  history: ConversationMessage[] = []
): Promise<GeminiResponse> {
  // 1. Guard: key must exist server-side only
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      configError: true,
      error:
        'GEMINI_API_KEY is not configured in server environment variables. Please add GEMINI_API_KEY in Vercel Project Settings.',
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // 2. Build conversation history in Gemini format
  const geminiHistory: Content[] = history.flatMap((msg): Content[] => [
    {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    },
  ]);

  let lastError: string | null = null;

  // 3. Try each candidate model until one succeeds
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCurrent workspace: ${businessName} (ID: [REDACTED])`,
        tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS as never }],
        safetySettings,
      });

      const chat = model.startChat({
        history: geminiHistory,
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      });

      let currentMessage: string | Array<{ functionResponse: { name: string; response: unknown } }> = userMessage;
      let iterationCount = 0;

      while (iterationCount < MAX_TOOL_ITERATIONS) {
        iterationCount++;

        const result = await chat.sendMessage(currentMessage as never);
        const response = result.response;
        const candidate = response.candidates?.[0];

        if (!candidate) {
          throw new Error('No candidate returned');
        }

        const functionCalls = response.functionCalls();

        if (!functionCalls || functionCalls.length === 0) {
          const text = response.text();
          if (text) {
            return { ok: true, answer: text };
          }
          throw new Error('Empty response text');
        }

        // Execute tools server-side with verified business_id
        const toolResponseParts = await Promise.all(
          functionCalls.map(async (fc) => {
            const toolResult = await executeBusinessTool(fc.name, businessId);
            return {
              functionResponse: {
                name: fc.name,
                response: toolResult.ok
                  ? { result: toolResult.data }
                  : { error: toolResult.error ?? 'Tool execution failed' },
              },
            };
          })
        );

        // Feed tool results back to model
        currentMessage = toolResponseParts;
      }

      return { ok: false, error: 'Maximum reasoning iterations reached. Please try a simpler question.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Model ${modelName} Warning]:`, msg.slice(0, 120));
      lastError = msg;
      // Continue to next candidate model
    }
  }

  // Handle common error classes
  if (lastError && (lastError.includes('429') || lastError.toLowerCase().includes('quota'))) {
    return {
      ok: false,
      error: '⚠️ AI service is temporarily rate-limited. Please wait 30 seconds and try again.',
    };
  }

  return {
    ok: false,
    error: 'AI service is temporarily busy. Please try asking again in a moment.',
  };
}
