---
name: free-video-source
version: "1.0.0"
description: "Find and download free stock video clips from Pexels, Pixabay, Mixkit, Coverr, and Videvo (free tier) using normal web/browser search (no API calls). Always saves source page URL, creator name, license note, attribution text, duration, resolution, and usage notes. Prefers commercial-use-safe assets. Falls back to local video generation when no safe free asset is found. Use when the user asks to: find free stock video, download free video clips, search stock footage, get copyright-free video, find B-roll footage, source video for editing, get commercial-use video clips, or find background video loops."
---

# Free Video Source

Find and download free stock video clips from public sources using **normal web browser search behavior** — no API keys, no scraping, no bulk downloads.

## Source Priority

| Tier | Sources | License Type |
|------|---------|-------------|
| **1 — Preferred** | Pexels, Pixabay | Broadly permissive, commercial-safe |
| **2 — Secondary** | Mixkit, Coverr | Free tier, commercial-safe |
| **3 — Caution** | Videvo (free tier) | Check per-clip license (some require attribution) |
| **4 — Fallback** | Local video generation | Self-created, no license concerns |

## Search Patterns

### Pexels Videos (via browser-act or browser)

```bash
# Search Pexels for a video topic
# Navigate to: https://www.pexels.com/search/videos/{topic}/
# Example: https://www.pexels.com/search/videos/office/
```

Search URL format: `https://www.pexels.com/search/videos/{keyword}/`

**Download**: Click the video → "Free Download" button → choose resolution (4K, HD, SD). Original quality recommended.

**Attribution format**:
```
Video by [Creator Name](https://www.pexels.com/@creator) from Pexels
```

**License**: Pexels License — free for commercial and non-commercial use. No attribution required but appreciated.

### Pixabay Videos (via browser-act or browser)

```bash
# Search Pixabay for a video topic
# Navigate to: https://pixabay.com/videos/search/{topic}/
# Example: https://pixabay.com/videos/search/nature/
```

Search URL format: `https://pixabay.com/videos/search/{keyword}/`

**Filter by license**: Use filters → "Free for commercial use ✓ No attribution required"

**Download**: Click the video → scroll down → "Free Download" → choose resolution.

**Attribution format** (optional):
```
Video by [Creator Name](https://pixabay.com/users/{creator}) from Pixabay
```

**License**: Pixabay License — free for commercial and non-commercial use. No attribution required.

### Mixkit (via browser-act or browser)

```bash
# Search Mixkit for a video topic
# Navigate to: https://mixkit.co/free-stock-video/{topic}/
# Example: https://mixkit.co/free-stock-video/technology/
```

Search URL format: `https://mixkit.co/free-stock-video/{keyword}/`

**Download**: Hover over the video → click "Download" → choose resolution.

**Attribution format** (not required but appreciated):
```
Video from Mixkit (https://mixkit.co)
```

**License**: Mixkit License — free for commercial and non-commercial use. No attribution required.

### Coverr (via browser-act or browser)

```bash
# Search Coverr for a video topic
# Navigate to: https://coverr.co/search?q={topic}
# Example: https://coverr.co/search?q=city
```

Search URL format: `https://coverr.co/search?q={keyword}`

**Download**: Click the video → "Download" button → choose resolution.

**Attribution format** (not required):
```
Video from Coverr (https://coverr.co)
```

**License**: Coverr License — free for commercial and non-commercial use. No attribution required.

### Videvo Free Tier (via browser-act or browser)

```bash
# Search Videvo for a video topic (free tier only)
# Navigate to: https://www.videvo.net/search/{topic}/
# Example: https://www.videvo.net/search/nature/
```

**⚠️ Caution**: Videvo has both free and premium clips. Filter by "Free License" or "Royalty-Free" before downloading.

**Download**: Click the video → "Free Download" button (may require free account).

**Attribution**: Some free Videvo clips require attribution. Check the specific clip's license page.

**Attribution format** (when required):
```
Video by [Creator Name](https://www.videvo.net/author/{creator}) from Videvo
```

**License**: Varies per clip — Royalty-Free or Videvo Attribution License. Always verify.

## Download Pattern

```python
# Using browser-act to search and download stock video:
# 1. Navigate to source URL
# 2. Search for keyword
# 3. Browse results — check for "free" / "commercial use" labels
# 4. Select clip — verify license, duration, resolution
# 5. Save source metadata
# 6. Download the video file
```

## Metadata Record

Every downloaded video MUST have a metadata file saved alongside it.

### Video Metadata Format

Save as `./metadata/{asset-name}.json`:

```json
{
  "filename": "office-b-roll.mp4",
  "source": "pexels",
  "source_url": "https://www.pexels.com/search/videos/office/",
  "page_url": "https://www.pexels.com/video/abc123/",
  "creator_name": "Jane Smith",
  "creator_url": "https://www.pexels.com/@janesmith",
  "license": "Pexels License",
  "license_url": "https://www.pexels.com/license",
  "attribution": "Video by Jane Smith from Pexels",
  "commercial_use": true,
  "duration_seconds": 15.0,
  "resolution": {"width": 3840, "height": 2160},
  "fps": 30,
  "has_audio": false,
  "file_size_bytes": 15728640,
  "downloaded_at": "2026-06-20T12:00:00Z",
  "search_query": "office team working",
  "usage_notes": "Good B-roll for office/productivity scenes"
}
```

### Minimal Metadata

```json
{
  "filename": "nature-clip.mp4",
  "source": "pixabay",
  "source_url": "https://pixabay.com/videos/search/nature/",
  "page_url": "https://pixabay.com/videos/abc123/",
  "creator_name": "NatureShots",
  "license": "Pixabay License",
  "attribution": "Video by NatureShots from Pixabay",
  "commercial_use": true,
  "duration_seconds": 10.0,
  "resolution": {"width": 1920, "height": 1080}
}
```

## Key Differences from Image Sourcing

| Aspect | Free Images | Free Videos |
|--------|-------------|-------------|
| File size | ~200KB–5MB | ~5MB–200MB+ |
| Sources | 5 sources | 5 sources (different mix) |
| Duration check | N/A | Must check clip length |
| Resolution check | Optional | Critical (match project) |
| Audio track | N/A | Note if clip has audio |
| Preview time | Instant | Must scrub through |

## Fallback to Local Generation

If a free stock video cannot be safely found:

1. **Still image + animation**: Use `local-image-gen` to create an image, then `local-video-gen` to animate it
2. **Pure generation**: Use `local-video-gen` with LTX-Video to create a clip from a text prompt + generated image

## File Organization

```
project/
├── assets/
│   └── videos/              # Downloaded free video clips
│       ├── office-b-roll.mp4
│       └── ...
├── metadata/                 # Metadata for every sourced asset
│   ├── office-b-roll.json
│   └── ...
└── out/
    └── videos/               # Locally generated videos
```

## Prohibited Actions

- ❌ No API key usage
- ❌ No scraping / bulk downloading
- ❌ No downloading clips with unclear licenses
- ❌ No premium/paid clips (unless explicitly authorized)
- ❌ No watermarked content
- ❌ No bypassing download restrictions or login walls

## Safety Checklist

Before saving any downloaded video, verify:
- [ ] Source is one of: Pexels, Pixabay, Mixkit, Coverr, Videvo (free tier only)
- [ ] License explicitly allows commercial use (if commercial project)
- [ ] Duration is suitable for the intended use
- [ ] Resolution matches or exceeds project requirements
- [ ] No watermarks or branding visible
- [ ] Creator name captured
- [ ] Source URL and page URL captured
- [ ] Attribution text prepared
- [ ] Usage notes written (what this clip is good for)
- [ ] File is not a duplicate of an existing asset

## Related Skills

- `free-image-source` — Free stock image sourcing (same philosophy)
- `local-image-gen` — Fallback image generation
- `local-video-gen` — Fallback video generation (LTX-Video)
- `browser-act` — Browser automation for search and download
