import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/orbit-ai/search
 *
 * Searches the web using DuckDuckGo's HTML endpoint (no API key needed).
 * Returns structured results.
 */
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 },
      );
    }

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
      return NextResponse.json(
        { error: `Search engine returned ${res.status}` },
        { status: 502 },
      );
    }

    const html = await res.text();

    // Parse results from DuckDuckGo HTML
    // Each result is in a <div class="result"> with:
    //   <a class="result__a" href="...">title</a>
    //   <a class="result__snippet">snippet</a>
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
      const title = match[2]
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (title && decodedUrl) {
        titles.push(title);
        urls.push(decodedUrl);
      }
    }

    while ((match = snippetRegex.exec(html)) !== null) {
      const snippet = match[1]
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (snippet) snippets.push(snippet);
    }

    for (let i = 0; i < Math.min(titles.length, 8); i++) {
      results.push({
        title: titles[i],
        url: urls[i],
        snippet: snippets[i] || "",
      });
    }

    // Fallback: try the DuckDuckGo Instant Answer API
    if (results.length === 0) {
      const instantRes = await fetch(
        `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1`,
      );
      if (instantRes.ok) {
        const instantData = await instantRes.json();
        const abstract = instantData.AbstractText || "";
        const source = instantData.AbstractSource || "";
        const answer = instantData.Answer || "";

        if (abstract) {
          results.push({
            title: source || "Instant Answer",
            url: instantData.AbstractURL || "",
            snippet: abstract,
          });
        }
        if (answer) {
          results.push({
            title: "Answer",
            url: "",
            snippet: answer,
          });
        }
      }
    }

    return NextResponse.json({ results, query: query.trim() });
  } catch (error) {
    console.error("[Orbit AI Search] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Search failed",
        results: [],
      },
      { status: 500 },
    );
  }
}
