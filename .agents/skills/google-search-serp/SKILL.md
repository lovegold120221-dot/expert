---
name: google-search-serp
description: "Extracts Google Search results page (SERP) data including organic results, paid ads, related searches, People Also Ask questions, AI Overview text, and total result count from google.com. Use when user mentions Google search results, SERP scraping, google search data, search engine results page, organic rankings, keyword SERP, Google SERP extraction, scrape Google search, Google search API alternative, SEO ranking data, paid search ads, PPC ads on Google, Google search monitoring, keyword research, search results export, check Google rankings, what shows up on Google, search engine scraper, google results checker. Also applies to: SEO analysis, rank tracking, competitor keyword research, search result monitoring."
---

# Google — Search SERP Extraction

> Search keyword + parameters → structured SERP data (organic results, ads, related queries, PAA, AI Overview)

## Language

All process output to user (progress updates, process notifications) follows the user's language.

## Objective

Extract all visible content from a Google Search results page: organic listings, paid ads, related searches, People Also Ask, AI Overview, and total result count.

## Prerequisites

- Target page is already open in the browser: `https://www.google.com/search?q={query}`
- For best results, use a stealth browser with US proxy

## Pre-execution Checks

### 1. Tool Readiness

If browser-act has been confirmed available in the current session → skip this step.

Invoke `browser-act` via Skill tool to load usage. If installation or configuration issues arise, follow its guidance to resolve then retry.

## Capability Components

### DOM: Google Search SERP (data extraction)

Parameters are injected via URL navigation; data is extracted from the server-rendered HTML page:

1. `navigate https://www.google.com/search?q={query}&num={num}&hl={lang}&gl={country}&start={start}`
2. `wait stable`
3. `get markdown`

URL parameters:
- `q`: Search query (required)
- `num`: Results per page — `10` (default), `20`, `50`, `100`
- `hl`: Interface language code — e.g., `en`, `zh-CN`, `fr`, `de` (omit for browser default)
- `gl`: Country targeting code — e.g., `us`, `gb`, `de`, `cn` (omit for browser default)
- `start`: Pagination offset — `0` for page 1, `10` for page 2 (when `num=10`); formula: `(page - 1) * num`

Error handling: If redirected to `/sorry/` page (CAPTCHA), switch to a browser with US rotating proxy and retry. Run `screenshot` to verify the page loaded correctly.

### DOM: Extract SERP via JavaScript

For more structured extraction, use eval:

```
eval "$(python scripts/serp-extract.py)"
```

The script extracts all SERP sections as JSON: organic results (title, URL, description, sitelinks), paid ads, related searches, People Also Ask questions, and AI Overview text.

## Pagination

**URL Pagination**: URL pattern `https://www.google.com/search?q={query}&num={num}&start={(page-1)*num}`. Increment `start` by `num` for each subsequent page. Termination: `organicResults` array is empty, or `start` exceeds the desired page count.

## Success Criteria

At least 1 organic result returned and matches the requested keyword.

## Known Limitations

- **AI Overview unreliable in stealth sessions**: Google rarely serves AI Overview to automated browsers
- **Google anti-bot detection**: Stealth browsers may be redirected to CAPTCHA. Use US rotating proxy to reduce blocks. Use `solve-captcha` or `remote-assist` if needed
- **Related queries load asynchronously**: Requires `wait stable` after navigation

## Execution Efficiency

- **Batch orchestration**: Loop through keywords serially within one browser session; add 2–5s delay between requests
- **Test before batch**: Test with 1–2 keywords first, then run full batch
- **Error resumption**: Save results keyword by keyword; resume from breakpoint on failure
- **Multi-session parallelism**: Distribute keywords across multiple stealth browser sessions for higher throughput
