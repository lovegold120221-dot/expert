---
name: free-image-source
version: "1.0.0"
description: "Find and download free stock images from Unsplash, Pexels, Pixabay, Wikimedia Commons, and Openverse using normal web/browser search (no API calls). Always saves source page URL, creator name, license note, and attribution text. Prefers commercial-use-safe assets. Avoids logos, watermarks, trademarks, and unclear licenses. Falls back to local generation when no safe free asset is found. Use when the user asks to: find free images, search stock photos, get copyright-free images, download free stock photos, find images for a video project, search Unsplash for an image, find CC-licensed photos, get commercial-use-safe images, or source images without paying."
---

# Free Image Source

Find and download free stock images from public sources using **normal web browser search behavior** — no API keys, no scraping, no bulk downloads.

## Source Priority

| Tier | Sources | License Type |
|------|---------|-------------|
| **1 — Preferred** | Unsplash, Pexels, Pixabay | Broadly permissive, commercial-safe |
| **2 — Secondary** | Wikimedia Commons, Openverse | CC-licensed, verify per file |
| **3 — Fallback** | Local generation | Self-created, no license concerns |

## Search Patterns

### Unsplash (via browser-act or browser)

```bash
# Search Unsplash for a topic
# Navigate to: https://unsplash.com/s/photos/{topic}
# Example: https://unsplash.com/s/photos/office-team-meeting
```

Search URL format: `https://unsplash.com/s/photos/{keyword}`

**Download**: Click the image, then click the download arrow or right-click "Save image as...". For larger sizes, append `?w=1920` to the image URL.

**Attribution**: Unsplash requires attribution when possible. Format:
```
Photo by [Creator Name](https://unsplash.com/@creator) on Unsplash
```

**License**: Unsplash License — free for commercial and non-commercial use. No permission needed (but attribution appreciated).

### Pexels (via browser-act or browser)

```bash
# Search Pexels for a topic
# Navigate to: https://www.pexels.com/search/{topic}/
# Example: https://www.pexels.com/search/technology/
```

Search URL format: `https://www.pexels.com/search/{keyword}/`

**Download**: Click the image → "Free Download" button. Choose size (original is best).

**Attribution format**:
```
Photo by [Creator Name](https://www.pexels.com/@creator) from Pexels
```

**License**: Pexels License — free for commercial and non-commercial use. No attribution required but appreciated.

### Pixabay (via browser-act or browser)

```bash
# Search Pixabay for a topic
# Navigate to: https://pixabay.com/images/search/{topic}/
# Example: https://pixabay.com/images/search/nature/
```

Search URL format: `https://pixabay.com/images/search/{keyword}/`

**Filter by license**: Use the "License" filter → choose "Free for commercial use ✓ No attribution required"

**Download**: Click the image → scroll down → click "Free Download" → choose size.

**Attribution format** (optional):
```
Image by [Creator Name](https://pixabay.com/users/{creator}) from Pixabay
```

**License**: Pixabay License — free for commercial and non-commercial use. No attribution required.

### Wikimedia Commons (via browser-act or browser)

```bash
# Search Wikimedia Commons
# Navigate to: https://commons.wikimedia.org/w/index.php?search={topic}
# Example: https://commons.wikimedia.org/w/index.php?search=space+rocket
```

**⚠️ Always verify the specific license** for each file. Not all Wikimedia files are CC-licensed.

**Download**: Open the file page → scroll to "File history" section → click the highest resolution version → download.

**Attribution format**:
```
File: [Filename] by [Creator], [License name], via Wikimedia Commons
```

**License**: Varies per file (CC BY, CC BY-SA, public domain, etc.). Always check the file description page.

### Openverse (via browser-act or browser)

```bash
# Search Openverse (WordPress + CC catalog)
# Navigate to: https://openverse.org/search/image?q={topic}
# Example: https://openverse.org/search/image?q=city+skyline
```

Search URL format: `https://openverse.org/search/image?q={keyword}`

**Filter by license**: Use the "License" dropdown → "Commercial use allowed"

**Download**: Click the image → "Download" button → choose size.

**Attribution format**: Openverse provides ready-to-copy attribution text on each image page.

**License**: CC-licensed (CC0, CC BY, CC BY-SA). Always verify per file.

## Download Pattern (via browser-act)

```python
# Using browser-act to search and download:
# 1. Navigate to source URL
# 2. Search for keyword
# 3. Browse results and select image
# 4. Save source metadata
# 5. Download the image file
```

For programs that need automated downloads, use the `browser-act` skill with Playwright to navigate, search, and download.

## Metadata Record

Every downloaded asset MUST have a metadata file saved alongside it.

### Image Metadata Format

Save as `./metadata/{asset-name}.json`:

```json
{
  "filename": "office-team-meeting.jpg",
  "source": "unsplash",
  "source_url": "https://unsplash.com/s/photos/office-team-meeting",
  "page_url": "https://unsplash.com/photos/abc123",
  "creator_name": "John Doe",
  "creator_url": "https://unsplash.com/@johndoe",
  "license": "Unsplash License",
  "license_url": "https://unsplash.com/license",
  "attribution": "Photo by John Doe on Unsplash",
  "commercial_use": true,
  "modification_allowed": true,
  "downloaded_at": "2026-06-20T12:00:00Z",
  "dimensions": {"width": 1920, "height": 1280},
  "file_size_bytes": 524288,
  "search_query": "office team meeting"
}
```

### Minimal Metadata (when details are limited)

```json
{
  "filename": "image.jpg",
  "source": "pexels",
  "source_url": "https://www.pexels.com/search/technology/",
  "page_url": "https://www.pexels.com/photo/abc/",
  "creator_name": "Jane Smith",
  "license": "Pexels License",
  "attribution": "Photo by Jane Smith from Pexels",
  "commercial_use": true
}
```

## Fallback to Local Generation

If a free stock image cannot be safely found (no commercial-safe results, results have unclear licenses, or search returns nothing useful):

→ Use **local-image-gen** skill to generate a suitable image with FLUX.1-schnell on local hardware.

## File Organization

```
project/
├── assets/
│   └── images/              # Downloaded free images
│       ├── office-meeting.jpg
│       └── ...
├── metadata/                 # Metadata for every sourced asset
│   ├── office-meeting.json
│   └── ...
└── out/
    └── images/               # Locally generated images
```

## Prohibited Actions

- ❌ No API key usage (Unsplash, Pexels have official APIs — do not use them here)
- ❌ No scraping / bulk downloading (one image at a time, normal user behavior)
- ❌ No downloading images with unclear licenses
- ❌ No watermarked or trademarked content
- ❌ No logos or branded assets
- ❌ No bypassing download restrictions

## Safety Checklist

Before saving any downloaded image, verify:
- [ ] Source is one of: Unsplash, Pexels, Pixabay, Wikimedia Commons, Openverse
- [ ] License explicitly allows commercial use (if commercial project)
- [ ] No visible watermarks or logos
- [ ] No recognizable trademarks or brand assets
- [ ] Creator name captured
- [ ] Source URL captured
- [ ] Attribution text prepared
- [ ] File is not a duplicate of an existing asset

## Related Skills

- `free-video-source` — Free stock video sourcing (same sourcing philosophy)
- `local-image-gen` — Fallback image generation via FLUX.1-schnell
- `browser-act` — Browser automation for search and download
- `browser-use` — Alternative browser automation
