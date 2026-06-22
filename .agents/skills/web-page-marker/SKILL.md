---
name: web-page-marker
description: "Extracts complete readable Markdown content from any web page. Use when users need to convert a webpage to markdown, scrape article content, extract main text from a URL, fetch readable content of a blog post or news article, convert HTML to markdown format, extract documentation pages for offline reading, scrape tutorial content, get the text content of any HTTP/HTTPS URL. Also applies to: content extraction, article scraping, webpage to text conversion, documentation scraping, content monitoring."
---

# Web — Page to Markdown Extraction

> Target URL → clean Markdown content

## Language

All process output to user follows the user's language.

## Objective

Extract the main readable content from any web page as clean Markdown, stripping navigation, ads, sidebars, and other chrome.

## Prerequisites

- browser-act CLI installed and verified

## Pre-execution Checks

If browser-act has been confirmed available in the current session → skip.

Invoke `browser-act` via Skill tool to load usage. Resolve any installation issues.

## Capability Components

### API: Extract page as Markdown

The easiest way — uses BrowserAct's page-to-markdown API:

```bash
python -u ./scripts/web_page_marker.py "https://example.com"
```

Parameters:
- `target_url`: The full URL to extract content from (required)

### DOM: Extract via browser-act

Alternative method using browser-act directly:

1. `browser-act --session page-extract stealth-extract "{target_url}"`
2. The output is clean markdown content

Or for more control with a session:

1. `browser-act --session page-extract browser open <id> "{target_url}"`
2. `wait stable`
3. `get markdown`

## Data Output

Successful execution returns:
- `content`: The complete markdown content of the webpage
- `title`: Page title
- `url`: Source URL

## Error Handling & Retry

- Output contains `"Invalid authorization"` → API Key invalid or expired. Do not retry. Guide user to get a valid key from BrowserAct Console.
- Task fails with `Error:` or empty result → retry once automatically.
- Retry limited to **one time**. If second attempt fails, report error to user.

## Typical Use Cases

1. **Article Extraction**: Scrape main content of a news article into markdown
2. **Blog Post Parsing**: Download readable text from a blog post URL
3. **Webpage to Markdown**: Convert any website URL into clean markdown
4. **Documentation Scraping**: Fetch tutorial or documentation page content
5. **Content Monitoring**: Extract text from specific webpages for updates
6. **AI Context**: Feed webpage content to an AI model by converting to markdown first
