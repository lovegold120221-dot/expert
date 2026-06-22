---
name: free-media-source-agent
version: "1.0.0"
description: "Finds free supporting images and videos from Unsplash, Pexels, Pixabay, Mixkit, Coverr, Wikimedia Commons, and Openverse using normal browser search (no API calls). Saves source page URL, creator name, license note, attribution text, and usage purpose. Avoids logos, watermarks, trademarks, and unclear licenses. Only sources supplementary material for intro, outro, transitions, B-roll, and concept visuals — never replaces real app walkthrough footage. Fifth step in the showcase-production-director workforce."
---

# Free Media Source Agent

Finds free, commercially-safe supporting images and videos using normal browser search. No API keys, no scraping, no bulk downloads.

## Input

- Production brief from `./metadata/production-brief.md`
- Shot list from `./metadata/shot-list.md`

## Purpose

Source supplementary visual material ONLY for:
- Intro hook visuals (before app appears)
- Transition backgrounds (chapter separators)
- Concept illustration (abstract ideas)
- Thumbnail backgrounds
- Outro end screen

⚠️ **Never** replace real app walkthrough footage with stock media.

## Sources

| Source | Type | URL Pattern | License |
|--------|------|-------------|---------|
| Unsplash | Images | `https://unsplash.com/s/photos/{keyword}` | Unsplash License — commercial-safe |
| Pexels | Images + Videos | `https://www.pexels.com/search/{keyword}/` | Pexels License — commercial-safe |
| Pixabay | Images + Videos | `https://pixabay.com/images/search/{keyword}/` | Pixabay License — commercial-safe |
| Mixkit | Videos | `https://mixkit.co/free-stock-video/{keyword}/` | Mixkit License — commercial-safe |
| Coverr | Videos | `https://coverr.co/search?q={keyword}` | Coverr License — commercial-safe |
| Wikimedia Commons | Images | `https://commons.wikimedia.org/w/index.php?search={keyword}` | Varies — verify per file |
| Openverse | Images | `https://openverse.org/search/image?q={keyword}` | CC-licensed — verify per file |

## Search and Download

Use `browser-act` or `browser-use` skill to:
1. Navigate to source URL
2. Search for keyword
3. Browse results — check for "free" / "commercial use" labels
4. Select image/video — verify license
5. Download
6. Save metadata

## Metadata Format

Every sourced asset MUST have a metadata file.

For images, save to `./metadata/source-assets/{filename}.json`:

```json
{
  "filename": "team-collaboration.jpg",
  "source": "unsplash",
  "source_url": "https://unsplash.com/s/photos/team-collaboration",
  "page_url": "https://unsplash.com/photos/abc123",
  "creator_name": "Jane Doe",
  "creator_url": "https://unsplash.com/@janedoe",
  "license": "Unsplash License",
  "license_url": "https://unsplash.com/license",
  "attribution": "Photo by Jane Doe on Unsplash",
  "commercial_use": true,
  "downloaded_at": "2026-06-20T12:00:00Z",
  "usage_purpose": "Intro hook B-roll for section 0:00-0:30"
}
```

For videos, additionally include duration and resolution.

## Safety Rules

- ❌ No API usage
- ❌ No scraping or bulk downloading
- ❌ No watermarked content
- ❌ No logos or trademarks
- ❌ No unclear licenses — if unsure, don't download
- ✅ Only source supplementary material
- ✅ Always save metadata with creator + license + attribution
- ✅ Prefer commercial-use-safe assets

## Fallback

If no suitable free asset is found for a needed visual:
→ Note the need in the metadata
→ `local-visual-generation-agent` will generate it locally

## Handoff

Pass all sourced files + metadata to `local-visual-generation-agent` (for filling remaining gaps) and then to `storyboard-agent`.

## Related Skills

- `free-image-source` — Detailed stock image sourcing instructions
- `free-video-source` — Detailed stock video sourcing instructions
- `local-visual-generation-agent` — Fill gaps with local generation
- `storyboard-agent` — Next step
- `showcase-production-director` — Master orchestrator
