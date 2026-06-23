import { NextRequest, NextResponse } from "next/server";
import { fetchEburonWithRetry } from "@/lib/eburon-fetch";
import { EBURON_TEXT_MODEL } from "@/lib/config";

// Read from the branded env var, with fallback to the legacy name for
// backwards compatibility with existing .env.local files.
const EBURON_API_KEY = process.env.EBURON_AI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * POST /api/translate-text
 *
 * Translates a snippet of text using the Eburon AI service (text generation,
 * not the Live streaming endpoint). Accepts:
 *
 *   { text: string, sourceLang: string, targetLang: string }
 *
 * Returns:
 *
 *   { translatedText: string }
 */
export async function POST(req: NextRequest) {
  if (!EBURON_API_KEY) {
    return NextResponse.json(
      { error: "AI service key not configured on server" },
      { status: 500 },
    );
  }

  let body: { text?: string; sourceLang?: string; targetLang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { text, sourceLang, targetLang } = body;
  if (!text || !sourceLang || !targetLang) {
    return NextResponse.json(
      { error: "Missing required fields: text, sourceLang, targetLang" },
      { status: 400 },
    );
  }

  if (text.length > 2000) {
    return NextResponse.json(
      { error: "Text too long (max 2000 characters)" },
      { status: 400 },
    );
  }

  const prompt = `You are a precise translator. Translate the following text from ${sourceLang} to ${targetLang}. Output ONLY the translated text, nothing else — no explanations, no quotes, no commentary.

Text to translate:
${text}`;

  try {
    const response = await fetchEburonWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${EBURON_TEXT_MODEL}:generateContent?key=${EBURON_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
          },
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(
        "Eburon AI service error:",
        response.status,
        errBody.slice(0, 500),
      );
      return NextResponse.json(
        { error: `AI service returned ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translated) {
      console.error("Unexpected AI service response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: "AI service returned an empty response" },
        { status: 502 },
      );
    }

    return NextResponse.json({ translatedText: translated.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("translate-text route error:", msg);
    return NextResponse.json(
      { error: "Translation request failed" },
      { status: 502 },
    );
  }
}
