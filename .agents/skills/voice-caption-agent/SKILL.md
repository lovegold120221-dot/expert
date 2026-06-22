---
name: voice-caption-agent
version: "1.0.0"
description: "Creates narration audio, SRT/VTT captions, lower-thirds, caption chunks, pronunciation notes, and timing notes for the tutorial. Captions must not block important UI. Works from the tutorial script and storyboard timeline. Eighth step in the showcase-production-director workforce."
---

# Voice & Caption Agent

Creates the narration audio and caption files that will be composited into the final tutorial.

## Input

- Tutorial script (`./metadata/tutorial-script.md`)
- Storyboard (`./metadata/storyboard.md`)
- Shot list (`./metadata/shot-list.md`) — for UI element positions (captions must avoid these)

## Output Files

All saved to `./assets/`:

| File | Purpose |
|------|---------|
| `./assets/voiceover/narration.mp3` | Full narration audio |
| `./assets/captions/captions.srt` | SRT subtitles |
| `./assets/captions/captions.vtt` | VTT captions (web) |
| `./assets/captions/captions.json` | Timestamped caption chunks (for Remotion) |
| `./assets/captions/lower-thirds.json` | Lower-third text overlays |
| `./metadata/timing-notes.md` | Timing and pronunciation notes |

## Step 1: Extract Narration Text

From the script, extract ONLY the narration lines (not screen actions or edit notes).

Example narration text:
```
"Hey everyone! In this video, I'm going to show you how Orbit Meeting can translate your meetings in real time. Whether you're working with a global team or communicating across languages, this tool makes it seamless."
```

## Step 2: Generate Narration Audio

Use the `voicebox` skill or `edge-tts` skill for local TTS:

```bash
# Using voicebox REST API (local)
curl -X POST http://localhost:8080/tts \
  -H "Content-Type: application/json" \
  -d '{
    "voice": "default",
    "text": "Full narration text here...",
    "output": "assets/voiceover/narration.mp3"
  }'

# Using edge-tts skill (if voicebox unavailable)
# Follow instructions in edge-tts SKILL.md
```

**Narration quality requirements**:
- Sample rate: 44100 Hz
- Channels: Mono (standard for voiceover)
- Format: MP3 (192kbps) or WAV
- Volume: Peaking at -6dB to -3dB (headroom for mixing)
- Speed: Natural conversational pace (~150 words/min)
- Pauses: 0.3-0.5s between sentences, 1s between sections

## Step 3: Generate Captions

### Caption Rules

1. **Keep visible** — Max 2 lines, ~40 characters per line
2. **Don't block UI** — Check shot list for UI element positions. Place captions above or below, never overlapping buttons/menus
3. **Sync precisely** — Each caption chunk matches a spoken phrase
4. **Punctuation** — Include for natural reading flow
5. **Numbers** — Write out numerals for readability ("15" not "fifteen" if brief)

### SRT Format

Save as `./assets/captions/captions.srt`:

```srt
1
00:00:02,000 --> 00:00:06,500
Hey everyone! In this video, I'm going to show you
how Orbit Meeting can translate your meetings in real time.

2
00:00:06,500 --> 00:00:11,000
Whether you're working with a global team
or communicating across languages, this tool makes it seamless.

3
00:00:11,000 --> 00:00:15,000
Let's jump in and see how it works.
```

### VTT Format

Save as `./assets/captions/captions.vtt`:

```vtt
WEBVTT

00:00:02.000 --> 00:00:06.500
Hey everyone! In this video, I'm going to show you
how Orbit Meeting can translate your meetings in real time.

00:00:06.500 --> 00:00:11.000
Whether you're working with a global team
or communicating across languages, this tool makes it seamless.
```

### JSON Caption Chunks (for Remotion)

Save as `./assets/captions/captions.json`:

```json
[
  {
    "start": 2.0,
    "end": 6.5,
    "text": "Hey everyone! In this video, I'm going to show you how Orbit Meeting can translate your meetings in real time."
  },
  {
    "start": 6.5,
    "end": 11.0,
    "text": "Whether you're working with a global team or communicating across languages, this tool makes it seamless."
  }
]
```

## Step 4: Lower-Thirds and Labels

Save as `./assets/captions/lower-thirds.json`:

```json
[
  {
    "time": 30.0,
    "text": "App Overview",
    "duration": 4.0
  },
  {
    "time": 150.0,
    "text": "Feature 1: Real-time Translation",
    "duration": 4.0
  }
]
```

## Step 5: Timing Notes

Save as `./metadata/timing-notes.md`:

```markdown
# Timing & Pronunciation Notes

## Pronunciation Guide
- Orbit Meeting: OR-bit MEE-ting
- [App-specific terms with phonetic spelling]

## Narration Pacing
- 0:00-0:30: Energetic, fast (hook)
- 0:30-2:30: Conversational (intro + setup)
- 2:30-10:00: Clear and measured (walkthroughs)
- 10:00-12:30: Slightly faster (full demo)
- 12:30-14:00: Warm, appreciative (tips + CTA)

## Audio Mix Notes
- Narration: -6dB (clear, dominant)
- Music: -18dB during narration, -12dB between sections
- SFX: -15dB (subtle)

## Caption Position Notes
- Sections 2:30-4:00: UI has top toolbar + left sidebar → captions at bottom center
- Sections 4:00-6:00: Full-screen content → captions at bottom with slight transparency
```

## Handoff

Pass all audio and caption files to `remotion-editor-agent`.

## Related Skills

- `voicebox` — Local TTS API
- `edge-tts` — Local TTS with open-source models
- `tutorial-script-agent` — Input: narration text
- `storyboard-agent` — Input: timing
- `remotion-editor-agent` — Next step
- `showcase-production-director` — Master orchestrator
