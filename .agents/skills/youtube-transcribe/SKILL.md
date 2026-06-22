---
name: "youtube-transcribe"
description: "Download YouTube videos and transcribe audio using OpenAI's Whisper. Use when user wants to: transcribe a YouTube video, get transcript of video, convert YouTube to text, extract audio from YouTube and transcribe. Triggers on: 'transcribe YouTube', 'download and transcribe video', 'YouTube to text', 'extract audio from YouTube video'"
---

# YouTube Video Transcription

Download YouTube videos and transcribe audio using Whisper.

## Workflow

1. Download video/audio using `yt-dlp`
2. Extract audio with `ffmpeg`
3. Transcribe with `whisper`

## Download Video

```bash
# Download best video+audio format
yt-dlp -f "bv+ba/best" -o "/tmp/youtube_video.%(ext)s" "YOUTUBE_URL"

# Audio only (faster)
yt-dlp -f "ba" -o "/tmp/youtube_audio.%(ext)s" "YOUTUBE_URL"
```

## Extract Audio

```bash
# Extract audio to wav (whisper prefers wav)
ffmpeg -i /tmp/youtube_video.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/audio.wav
```

## Transcribe with Whisper

```bash
# Basic transcription
python3 -m whisper /tmp/audio.wav --model base --language en --output_dir /tmp --verbose True

# Available models: tiny, base, small, medium, large
# Larger models = more accurate but slower
```

## Complete One-Liner Script

```bash
youtube_url="YOUTUBE_URL"
output_dir="/tmp/whisper_output"
mkdir -p "$output_dir"

# Download and extract audio
yt-dlp -f "ba" -o "/tmp/audio.%(ext)s" "$youtube_url"
ffmpeg -i /tmp/audio.* -vn -acodec pcm_s16le -ar 16000 -ac 1 "$output_dir/audio.wav" 2>/dev/null

# Transcribe
python3 -m whisper "$output_dir/audio.wav" --model base --language en --output_dir "$output_dir" --verbose True

# Find results
ls -la "$output_dir"
```

## Output Files

Whisper generates:
- `{audio_name}.txt` - Full transcript
- `{audio_name}.srt` - Subtitle format
- `{audio_name}.vtt` - WebVTT format

## Troubleshooting

- **No audio track**: Try different format `-f "bestaudio"`
- **Whisper OOM**: Use smaller model (`tiny` or `base`)
- **ffmpeg not found**: `brew install ffmpeg`
- **Slow transcription**: Use GPU or smaller model