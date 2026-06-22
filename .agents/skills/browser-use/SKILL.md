---
name: browser-use
description: "Browser automation for web testing, scraping, screenshots, and interaction. Navigate URLs, click elements, fill forms, extract data, take screenshots, verify page state, handle dialogs, test responsive layouts, and file bugs with evidence. Use when you need to browse the web, test a site, scrape data, take screenshots, or verify a deployment. For combined browser + desktop machine control, use the 'machine-access' skill instead."
---

# Browser Use Skill

Navigate, test, and scrape the web using browser tools. Playwright MCP is configured in opencode.json — use the playwright MCP tool for interactive browser control (navigate, click, type, screenshot, extract). Falls back to CLI commands below if MCP is unavailable.

## Headless Browser (Playwright via npx)

```bash
# Navigate to URL and screenshot
npx -y playwright@latest open --save-screenshot ~/Desktop/page.png https://example.com

# Get page title
npx -y playwright@latest open --save-content ~/Desktop/page-content.txt https://example.com

# Viewport sizes for responsive testing
npx -y playwright@latest open --viewport-size=375,812 https://example.com  # iPhone X
npx -y playwright@latest open --viewport-size=414,896 https://example.com  # iPhone 11
npx -y playwright@latest open --viewport-size=768,1024 https://example.com # iPad
npx -y playwright@latest open --viewport-size=1280,720 https://example.com # Desktop
```

## macOS Built-in Screenshots

```bash
# Full screen (silent)
screencapture -x ~/Desktop/screenshot-$(date +%Y%m%d-%H%M%S).png

# With delay for capturing hover states
screencapture -T 3 -x ~/Desktop/delayed-screenshot.png

# Open URL in browser and screenshot
open https://localhost:5173
sleep 2
screencapture -x ~/Desktop/app.png
```

## Web Fetching (curl)

```bash
# Fetch HTML
curl -sL https://example.com

# Fetch with headers
curl -sI https://example.com

# Fetch JSON API
curl -s https://api.example.com/data | python3 -m json.tool

# POST request
curl -s -X POST -H "Content-Type: application/json" -d '{"key":"value"}' https://api.example.com/endpoint

# Check if site is up
curl -so /dev/null -w "%{http_code}" https://example.com
```

## HTML Parsing (pup / python3)

```bash
# Parse HTML with Python
curl -sL https://example.com | python3 -c "
import sys, html.parser
class P(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
    def handle_starttag(self, tag, attrs):
        if tag == 'title': self.in_title = True
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, data):
        if self.in_title: print(data.strip())
p = P()
p.feed(sys.stdin.read())
"

# Extract all links
curl -sL https://example.com | python3 -c "
import sys, re
for m in re.findall(r'href=[\"\\'](https?://[^\"\\']+)[\"\\']', sys.stdin.read()):
    print(m)
"
```

## Check Page State

```bash
# Check if a local dev server is running
curl -so /dev/null -w "%{http_code}" http://localhost:5173

# Check if a port is open
lsof -i :5173

# Wait for server to be ready
until curl -so /dev/null http://localhost:5173; do sleep 1; done
```

## Screenshot with Annotation

```bash
# Take screenshot, then annotate with macOS Preview
screencapture -x ~/Desktop/capture.png && open -a Preview ~/Desktop/capture.png
```

## Known URLs & Local Dev Servers

| Server | URL |
|--------|-----|
| Next.js dev | http://localhost:3000 |
| Vite dev | http://localhost:5173 |
| Python HTTP | http://localhost:8000 |
| Docker | http://localhost:8080 |

## Playwright MCP (preferred)

Playwright MCP is configured as an opencode MCP server. Use the playwright tool directly for:
- Navigate to any URL
- Click elements, fill forms, extract text
- Take full-page screenshots
- Handle dialogs, alerts, popups
- Test responsive viewports
- Verify page state and console errors

## Tips

- Use the MCP playwright tool for interactive browser testing (click, type, extract, screenshot)
- Use `open -a "Google Chrome" https://example.com` to open in a specific browser
- Use `curl` for quick API checks and content fetching
- Use `screencapture` for full-page screenshots with macOS native tools
