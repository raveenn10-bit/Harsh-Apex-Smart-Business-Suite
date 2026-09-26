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

const MODEL_NAME = 'gemini-1.5-flash';
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
 * @param userMessage  The user's latest message
 * @param businessId   From verified server session — NEVER from model output
 * @param businessName Human-readable workspace name for context
 * @param history      Previous conversation turns
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
        'GEMINI_API_KEY is not configured. Please ask your system administrator to add the API key to the server environment variables.',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCurrent workspace: ${businessName} (ID: [REDACTED])`,
      tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS as never }],
      safetySettings,
    });

    // 2. Build conversation history in Gemini format (user/model alternating)
    const geminiHistory: Content[] = history.flatMap((msg): Content[] => [
      {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      },
    ]);

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });

    // 3. Agentic tool-call loop (max MAX_TOOL_ITERATIONS to prevent runaway loops)
    let currentMessage = userMessage;
    let iterationCount = 0;

    while (iterationCount < MAX_TOOL_ITERATIONS) {
      iterationCount++;

      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const candidate = response.candidates?.[0];

      if (!candidate) {
        return { ok: false, error: 'No response from Gemini. Please try again.' };
      }

      // 4. Check for function calls
      const functionCalls = response.functionCalls();

      if (!functionCalls || functionCalls.length === 0) {
        // No more tool calls — return the final text answer
        const text = response.text();
        if (!text) {
          return { ok: false, error: 'Gemini returned an empty response. Please try rephrasing your question.' };
        }
        return { ok: true, answer: text };
      }

      // 5. Execute each tool server-side with the bound business_id
      const toolResponseParts = await Promise.all(
        functionCalls.map(async (fc) => {
          // business_id is ALWAYS from session — model cannot supply it
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

      // 6. Feed tool results back to model
      currentMessage = JSON.stringify(toolResponseParts); // will be sent as functionResponse
      await chat.sendMessage(toolResponseParts as never);

      // Now loop again to get the model's synthesis response
      const synthesisResult = await chat.sendMessage('Please provide your analysis based on the data retrieved.');
      const synthesisText = synthesisResult.response.text();

      if (synthesisText) {
        return { ok: true, answer: synthesisText };
      }
    }

    return { ok: false, error: 'Maximum reasoning iterations reached. Please try a simpler question.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Handle rate limiting
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
      return {
        ok: false,
        error:
          '⚠️ AI service is temporarily rate-limited. Please wait 30 seconds and try again.',
      };
    }

    // Handle model not found / deprecated
    if (message.includes('404') || message.toLowerCase().includes('not found')) {
      return {
        ok: false,
        error: 'The AI model is temporarily unavailable. Please contact your administrator.',
      };
    }

    console.error('[Gemini Service Error]:', message);
    return {
      ok: false,
      error: 'AI Assistant encountered an error. Please try again.',
    };
  }
}
