---
name: voicebox
description: Use when working with the local Voicebox REST API for text-to-speech, streaming generation, voice profiles, transcription, audio effects, models, or generated audio under /Users/eburon/voicebox/output.
---

# Voicebox Local Integration Skill

Voicebox is running locally at `http://localhost:17493` with full REST API.

## Usage Commands

### Text-to-Speech Generation
```bash
# Generate speech with a voice profile
curl -X POST http://localhost:17493/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "profile_id": "<profile_id>", "language": "en"}'

# Stream generation
curl -X POST http://localhost:17493/generate/stream \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "profile_id": "<profile_id>"}'
```

### Voice Profile Management
```bash
# List all voice profiles
curl http://localhost:17493/profiles

# Create a new voice profile
curl -X POST http://localhost:17493/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "My Voice", "language": "en"}'

# Upload audio for voice cloning (to a profile)
curl -X POST http://localhost:17493/profiles/<profile_id>/audio \
  -F "file=@voice_sample.wav"

# Get profile details
curl http://localhost:17493/profiles/<profile_id>

# Delete a profile
curl -X DELETE http://localhost:17493/profiles/<profile_id>
```

### Transcription (Speech-to-Text)
```bash
# Transcribe audio file
curl -X POST http://localhost:17493/transcribe \
  -F "file=@audio.wav"

# Transcribe with specific language
curl -X POST http://localhost:17493/transcribe \
  -F "file=@audio.wav" \
  -F "language=en"
```

### Audio Effects
```bash
# Apply effects to generated audio
curl -X POST http://localhost:17493/effects \
  -H "Content-Type: application/json" \
  -d '{"audio_url": "<url>", "effects": {"pitch": 2, "reverb": {"room_size": 0.5}}}'
```

### Models
```bash
# List available TTS models
curl http://localhost:17493/models

# Get/set default model
curl -X PUT http://localhost:17493/models/default \
  -H "Content-Type: application/json" \
  -d '{"model_id": "chatterbox"}'
```

## Output Files
Generated audio is stored in the container at `/app/data/generations/` and mounted to `./output/` locally at `/Users/eburon/voicebox/output/`.

## API Docs
Full interactive docs available at: http://localhost:17493/docs

## Quick Examples

### 1. Create voice profile and generate speech
```bash
# Create profile
PROFILE=$(curl -s -X POST http://localhost:17493/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Voice", "language": "en"}' | jq -r '.id')

# Generate speech
curl -X POST http://localhost:17493/generate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello, this is a test.\", \"profile_id\": \"$PROFILE\"}" \
  -o output.wav
```

### 2. Clone voice from audio file
```bash
# Upload reference audio to create voice clone
curl -X POST http://localhost:17493/profiles/<profile_id>/audio \
  -F "file=@my_voice_sample.wav"
```

### 3. Transcribe audio
```bash
curl -X POST http://localhost:17493/transcribe \
  -F "file=@recording.wav" \
  -o transcription.json
```
