import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitedResponse } from "@/lib/api-utils";
import { EBURON_CHAT_MODEL } from "@/lib/config";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.ORBIT_AI_MODEL || "orbit-ai";
const EBURON_API_KEY = process.env.EBURON_AI_API_KEY || process.env.GEMINI_API_KEY;

export const runtime = "nodejs";

// ── Tool definitions ──────────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "translate_text",
      description:
        "Translate text from one language to another using Eburon AI. Use this when the user asks for translation help, or when you encounter text in a language the user may not understand.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to translate",
          },
          source_lang: {
            type: "string",
            description:
              "Source language code (e.g. 'en', 'es', 'fr', 'de'). Use 'auto' for automatic detection.",
          },
          target_lang: {
            type: "string",
            description:
              "Target language code (e.g. 'en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-CN', 'ar', 'hi').",
          },
        },
        required: ["text", "target_lang"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information. Use this when the user asks about news, updates, external resources, or anything that requires live web data. The search returns up to 8 results with titles, URLs, and snippets.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
];

// ── Tool executors ────────────────────────────────────────────────────────

async function executeTranslate(text: string, targetLang: string, sourceLang = "auto") {
  if (!EBURON_API_KEY) {
    return { error: "Translation not available — AI service key not configured" };
  }

  try {
    const prompt = `Translate the following text from ${sourceLang === "auto" ? "the detected language" : sourceLang} to ${targetLang}. Return ONLY the translated text, no explanations, no quotes.

Text: ${text}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EBURON_CHAT_MODEL}:generateContent?key=${EBURON_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      return { error: `Translation API error: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    const translated =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return { translated_text: translated };
  } catch (err) {
    return { error: `Translation failed: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

async function executeWebSearch(query: string) {
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encoded}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; OrbitAI/1.0; +https://orbitmeeting.app)",
          Accept: "text/html,application/xhtml+xml",
        },
      },
    );

    if (!res.ok) {
      return { error: `Search engine returned ${res.status}`, results: [] };
    }

    const html = await res.text();
    const results: { title: string; url: string; snippet: string }[] = [];

    const resultRegex =
      /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex =
      /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    const titles: string[] = [];
    const urls: string[] = [];
    const snippets: string[] = [];

    let match;
    while ((match = resultRegex.exec(html)) !== null) {
      const url = match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, "");
      const decodedUrl = url ? decodeURIComponent(url) : "";
      const title = match[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      if (title && decodedUrl) {
        titles.push(title);
        urls.push(decodedUrl);
      }
    }

    while ((match = snippetRegex.exec(html)) !== null) {
      const snippet = match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      if (snippet) snippets.push(snippet);
    }

    for (let i = 0; i < Math.min(titles.length, 8); i++) {
      results.push({ title: titles[i], url: urls[i], snippet: snippets[i] || "" });
    }

    if (results.length === 0) {
      const instantRes = await fetch(
        `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1`,
      );
      if (instantRes.ok) {
        const instantData = await instantRes.json();
        const abstract = instantData.AbstractText || "";
        const answer = instantData.Answer || "";
        if (abstract) {
          results.push({
            title: instantData.AbstractSource || "Instant Answer",
            url: instantData.AbstractURL || "",
            snippet: abstract,
          });
        }
        if (answer) {
          results.push({ title: "Answer", url: "", snippet: answer });
        }
      }
    }

    return { results, query };
  } catch (err) {
    return {
      error: `Search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      results: [],
    };
  }
}

// ── Off-topic guard ───────────────────────────────────────────────────────

const FORBIDDEN_KEYWORDS = [
  "what model", "what llm", "what ai", "which model", "which llm", "which ai",
  "who made you", "who created you", "who built you",
  "what are you built", "what technology", "what infrastructure",
  "how are you built", "how does orbit meeting work internally",
  "gemini", "livekit", "openai", "gpt", "ollama", "deepseek", "qwen",
  "open source", "proprietary", "third party",
];

const FEATURE_KEYWORDS = [
  "translate", "translation", "caption", "language", "screen share", "screen sharing",
  "breakout", "record", "recording", "chat", "attachment", "file",
  "moderat", "mute", "remove participant", "background", "blur",
  "studio", "mirror", "setting", "preference", "glossary",
  "desktop", "pwa", "android", "download",
  "speed mimicry", "speaker label", "hand raise", "react",
  "history", "troubleshoot", "not working", "issue", "problem",
  "orbit meeting", "how do i", "how to", "help",
];

function isFeatureQuestion(text: string): boolean {
  const lower = text.toLowerCase();

  // If it explicitly asks about architecture, model, or tech stack, block it
  for (const kw of FORBIDDEN_KEYWORDS) {
    if (lower.includes(kw)) return false;
  }

  // If it contains at least one feature keyword, allow it
  for (const kw of FEATURE_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }

  // Short follow-ups like "yes", "ok", "tell me more" pass through
  if (lower.length < 20) return true;

  // Default: block off-topic queries
  return false;
}

const OFF_TOPIC_RESPONSE =
  "I'm Orbit AI from Eburon AI, and I only assist with Orbit Meeting features. Can I help you with something specific about the app? For example, I can help with translation, screen sharing, breakout rooms, recording, chat, settings, and more.";

const TECH_STACK_RESPONSE =
  "I am Orbit AI, powered by Eburon AI's proprietary technology. I'm here to help you use Orbit Meeting features. What would you like to know about the app?";

// ── Main handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!rateLimit(req)) return rateLimitedResponse();
  try {
    const { message, history, lang } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // ── Guard: off-topic or tech-stack questions ──
    if (!isFeatureQuestion(message)) {
      const lowerMsg = message.toLowerCase();
      const askingAboutModel = FORBIDDEN_KEYWORDS.some(
        (kw) => lowerMsg.includes(kw) && !lowerMsg.includes("how do i"),
      );
      const reply = askingAboutModel ? TECH_STACK_RESPONSE : OFF_TOPIC_RESPONSE;

      const accept = req.headers.get("accept") || "";
      if (accept.includes("text/event-stream")) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: reply })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
      return NextResponse.json({ message: reply, done: true });
    }

    const ollamaMessages: { role: string; content: string | null; tool_calls?: unknown[] }[] = [];

    // Language instruction
    if (lang && lang !== "en") {
      ollamaMessages.push({
        role: "system",
        content: `IMPORTANT: The user's language code is "${lang}". You MUST respond in that language. If language code is unknown, default to English.`,
      });
    }

    // Conversation history — bound to last 20 turns to protect Ollama context.
    if (Array.isArray(history)) {
      const bounded = history.slice(-20);
      for (const msg of bounded) {
        if (msg.role && msg.content && typeof msg.content === "string") {
          ollamaMessages.push({ role: msg.role, content: msg.content.slice(0, 8000) });
        }
      }
    }

    // Current user message
    ollamaMessages.push({ role: "user", content: message });

    // ── Step 1: Non-streaming call with tools ──
    const firstRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        tools: TOOLS,
        stream: false,
      }),
    });

    if (!firstRes.ok) {
      const errText = await firstRes.text();
      return NextResponse.json(
        { error: `AI service error: ${firstRes.status} ${errText.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const firstData = await firstRes.json();
    const firstMsg = firstData.message || {};
    const toolCalls = firstMsg.tool_calls;

    // ── Step 2: If no tool calls, respond directly ──
    if (!toolCalls || toolCalls.length === 0) {
      const content = firstMsg.content || "";
      const accept = req.headers.get("accept") || "";
      const wantsStream = accept.includes("text/event-stream");

      if (wantsStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
              );
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      return NextResponse.json({ message: content, done: true });
    }

    // ── Step 3: Execute tool calls ──
    ollamaMessages.push({
      role: "assistant",
      content: null,
      tool_calls: toolCalls.map((tc: { function: { name: string; arguments: string } }) => ({
        type: "function",
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
    });

    for (const tc of toolCalls) {
      const fn = tc.function;
      const args = typeof fn.arguments === "string" ? JSON.parse(fn.arguments) : fn.arguments;

      let result: Record<string, unknown>;
      if (fn.name === "translate_text") {
        result = await executeTranslate(
          args.text || "",
          args.target_lang || "",
          args.source_lang || "auto",
        );
      } else if (fn.name === "web_search") {
        result = await executeWebSearch(args.query || "");
      } else {
        result = { error: `Unknown tool: ${fn.name}` };
      }

      ollamaMessages.push({
        role: "tool",
        content: JSON.stringify(result),
      });
    }

    // ── Step 4: Get the final response (streaming) ──
    const finalRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: true,
      }),
    });

    if (!finalRes.ok) {
      const errText = await finalRes.text();
      return NextResponse.json(
        { error: `Ollama final response error: ${finalRes.status} ${errText.slice(0, 300)}` },
        { status: 502 },
      );
    }

    // Stream the final response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = finalRes.body?.getReader();
        if (!reader) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: "No response stream" })}\n\n`),
          );
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                const content = parsed.message?.content || "";
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                  );
                }
                if (parsed.done) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
                  );
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Orbit AI] API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to communicate with Orbit AI",
      },
      { status: 500 },
    );
  }
}
