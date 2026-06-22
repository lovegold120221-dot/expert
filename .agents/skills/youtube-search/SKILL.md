---
name: youtube-search
description: "Extracts structured data from YouTube search results — videos, shorts, channels, playlists. Use when users need to search YouTube by keywords, find trending videos on a topic, gather YouTube channel data for competitor analysis, monitor YouTube playlists, extract search results for market research, track view counts for specific keywords, compile video lists, discover new content creators, search YouTube tutorials automatically, retrieve structured YouTube search data without opening video pages. Also applies to: YouTube SEO research, content discovery, video trend analysis, channel research."
---

# YouTube — Search Results Extraction

> Keywords + type + count → structured video/shorts/channel/playlist data

## Language

All process output to user follows the user's language.

## Objective

Extract search results from YouTube including videos, Shorts, channels, and playlists with metadata.

## Prerequisites

- browser-act CLI installed and verified

## Pre-execution Checks

If browser-act has been confirmed available → skip this step.

Invoke `browser-act` via Skill tool. Resolve any installation issues.

## Input Parameters

1. **KeyWords** (string): Search keywords. Example: `AI`, `web scraping`, `machine learning`
2. **Video_type** (string): Results tab. Options: `Videos` (default), `Shorts`, `Channels`, `Playlists`
3. **Date_limit** (number): Max items to extract. Default: `100`

## Capability Components

### API: YouTube Search Results

```bash
python -u ./scripts/youtube_search.py "KeyWords" "Video_type" Date_limit
```

Parameters:
- Positional 1: Search keywords
- Positional 2: Result type (`Videos`, `Shorts`, `Channels`, `Playlists`)
- Positional 3: Max items (number, default 100)

### DOM: YouTube Search via browser-act

Alternative method:

1. `navigate https://www.youtube.com/results?search_query={url_encoded_keywords}`
2. `wait stable`
3. `scroll down` — repeat several times to load more results
4. `get markdown`

## Execution Monitoring

The script continuously outputs status logs with timestamps (e.g., `[14:30:05] Status: running`). Keep monitoring output. As long as logs continue, the task is running normally.

## Data Output

- `title`: Video/channel/playlist title
- `url`: Result item URL
- `view_count`: View count display text
- `published_at`: Relative publish time
- `description`: Short description snippet (when available)
- `channel_name`: Channel name (for videos)
- `channel_url`: Channel URL (for videos)

## Error Handling

- `"Invalid authorization"` → API Key invalid. Guide user to BrowserAct Console. Do not retry.
- Other failures → retry once automatically. If second attempt fails, report error.

## Typical Use Cases

1. **Keyword-first discovery**: Build topic pools and content datasets from search intent
2. **Competitor scanning**: Search for competitor brand names and extract top related videos
3. **Content monitoring**: Regularly extract search results for specific keywords
4. **Channel research**: Search for channels in a specific niche
5. **Tutorial aggregation**: Find educational videos for specific tools/software
6. **Shorts tracking**: Monitor YouTube Shorts for trending hashtags
7. **Market research**: Build structured datasets of search results
