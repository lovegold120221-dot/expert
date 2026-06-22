---
name: youtube-transcript
description: "Extracts full transcripts from YouTube videos — with or without timestamps. Use when users need to get text transcription of a YouTube video, download captions, extract video transcript for analysis, convert YouTube video to text, get subtitles from a YouTube URL, transcribe video content for summarization, extract timestamped transcript, get auto-generated captions from YouTube. Also applies to: video content analysis, meeting recap (if recorded to YouTube), video SEO research, content repurposing, podcast transcription."
---

# YouTube — Video Transcript Extraction

> Video URL → Full transcript text with optional timestamps

## Language

All process output to user follows the user's language.

## Objective

Extract the full transcript/captions from any YouTube video that has captions available.

## Prerequisites

- browser-act CLI installed and verified

## Capability Components

### DOM: Extract Transcript via YouTube UI

1. `navigate https://www.youtube.com/watch?v={VIDEO_ID}`
2. `wait stable`
3. `click "More"` button (if present — the "Show more" below description)
4. `wait --timeout 2000`
5. `click "Show transcript"` button (look for "Show transcript" or "Transcript" text)
6. `wait --timeout 3000`
7. `get markdown` or use `eval` script below

The transcript panel appears on the right side with timestamped text segments.

### DOM: Extract via JavaScript eval

```
eval "$(python scripts/extract-transcript.py)"
```

This script extracts all visible transcript segments with timestamps.

### DOM: Get Available Languages

```
eval "$(python scripts/get-languages.py)"
```

Returns available transcript language options.

### DOM: Open Transcript Panel

```
eval "$(python scripts/open-transcript-panel.py)"
```

## Data Output

Each transcript segment:
- `text`: The transcribed text
- `timestamp`: Timestamp in MM:SS format
- `segment_index`: Sequential segment number

## Known Limitations

- Only works for videos that have captions/transcripts enabled
- Some videos may have auto-generated captions which can contain errors
- Long videos may have truncated transcripts in the UI — scroll to load more
- Some videos require the transcript panel to be opened via the "..." menu

## Typical Use Cases

1. **Content Analysis**: Transcribe video content for AI analysis and summarization
2. **Video SEO**: Extract transcript text for SEO keyword research
3. **Content Repurposing**: Convert video content into blog posts or articles
4. **Language Learning**: Get transcripts of foreign language videos
5. **Accessibility**: Generate text versions of video content
6. **Research**: Quote extraction from lecture or presentation videos
