---
name: "youtube-subtitle-downloader"
description: "Download subtitles from YouTube videos using downsub.com and Playwright automation. Use when the user wants to extract subtitles/captions from a YouTube video. Triggers on requests like: 'download YouTube subtitles', 'get YouTube captions', 'extract subtitles from video', 'convert YouTube to SRT'"
---

# YouTube Subtitle Downloader

Download subtitles from YouTube videos via downsub.com using Playwright CLI automation.

## Workflow

1. Navigate to downsub.com
2. Enter the YouTube URL
3. Select subtitle format (SRT/TXT)
4. Download the subtitles

## Playwright CLI Setup

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
```

## Download Process

```bash
# Open downsub.com
"$PWCLI" open https://downsub.com

# Wait for page load and snapshot
sleep 3
"$PWCLI" snapshot

# Type YouTube URL into input field (typically e2 after page loads)
"$PWCLI" type e2 "YOUTUBE_URL_HERE"

# Click the download button
"$PWCLI" click e3

# Wait for processing and snapshot again
sleep 5
"$PWCLI" snapshot

# Click the format selection button (SRT usually e3 or e4)
"$PWCLI" click e4

# Snapshot to see download options
"$PWCLI" snapshot
```

## Format Options

- **SRT**: SubRip subtitle format (most compatible)
- **TXT**: Plain text transcript

## Common Issues

- **No input field**: Snapshot again - page may need time to fully load
- **Wrong element clicked**: Re-snapshot after each navigation step
- **Download didn't start**: Check for ads or redirect pages, snapshot and retry

## Output

Subtitles are downloaded to the user's default downloads folder. File naming follows: `{video_id}-{language}.srt`