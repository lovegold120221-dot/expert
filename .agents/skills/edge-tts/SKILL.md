---
name: edge-tts
version: "1.0.0"
description: "Local text-to-speech with open-source models — ChatTTS, Coqui TTS, Piper, Bark, XTTSv2, MeloTTS. Use when the user asks to: generate speech locally, create voiceovers offline, clone a voice, do text-to-speech without cloud, create audiobooks, generate narration, multilingual TTS, voice cloning with few-shot samples."
argument-hint: 'edge-tts generate speech locally | edge-tts clone voice | edge-tts create audiobook narration'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🔊"
    tags: [tts, text-to-speech, voice-cloning, chattts, coqui, piper, bark, xtts, speech-synthesis, local, offline]
    repos:
      - https://github.com/2noise/ChatTTS (⭐39.4k)
      - https://github.com/coqui-ai/TTS (⭐45.4k)
      - https://github.com/rhasspy/piper (⭐8k+)
---

# 🔊 Local TTS — Natural Speech, Zero Cloud

Generate natural-sounding speech entirely on your machine. Voice cloning, multi-speaker, emotional control, multilingual.

---

## Hardware → Model Selection

| Hardware | Recommended Model | Quality | Speed |
|----------|------------------|---------|-------|
| CPU only (any) | Piper TTS | Good | Instant |
| 4GB+ RAM, no GPU | Piper / MeloTTS | Good | Fast |
| NVIDIA GPU 4GB+ | ChatTTS | Excellent | Fast |
| NVIDIA GPU 8GB+ | Coqui XTTSv2 | Best (voice cloning) | Medium |
| Apple Silicon | Piper / ChatTTS | Great | Fast |

## Quick Start — ChatTTS (⭐39.4k)

Best conversational quality with laughter, pauses, and emotion control.

```bash
pip install ChatTTS
```

```python
import ChatTTS, torch, torchaudio

chat = ChatTTS.Chat()
chat.load(compile=False)

# Basic generation
texts = ["Hello! Welcome to Eburon AI. [laugh] We build autonomous agents."]
wavs = chat.infer(texts)
torchaudio.save("output.wav", torch.from_numpy(wavs[0]).unsqueeze(0), 24000)

# With speaker identity + emotion control
rand_spk = chat.sample_random_speaker()
params = ChatTTS.Chat.InferCodeParams(
    spk_emb=rand_spk,
    temperature=0.3,
    top_P=0.7, top_K=20
)
refine = ChatTTS.Chat.RefineTextParams(
    prompt='[oral_2][laugh_0][break_6]'
)
wavs = chat.infer(texts, params_refine_text=refine, params_infer_code=params)
```

**Control tokens:** `[laugh]`, `[uv_break]`, `[lbreak]`, `[oral_0-9]`

## Piper TTS — CPU-only, Instant, Multilingual

Best for: embedded, Raspberry Pi, CPU-only machines.

```bash
# Install
pip install piper-tts

# Download a voice (English, US, female)
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

# Generate
echo "Welcome to Eburon AI. We build the future." | piper --model en_US-lessac-medium.onnx --output_file output.wav
```

60+ languages available. Voices: https://huggingface.co/rhasspy/piper-voices

## Coqui TTS / XTTSv2 (⭐45.4k) — Voice Cloning

Best for: cloning a voice from 5-30 seconds of audio.

```bash
pip install TTS
```

```python
from TTS.api import TTS

# Voice cloning — 6 second sample → clone
tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2").to("cuda")

tts.tts_to_file(
    text="Welcome to Eburon AI. This voice was cloned from a short sample.",
    speaker_wav="/path/to/voice_sample.wav",  # 6-30 seconds
    language="en",
    file_path="cloned_output.wav"
)

# Multi-speaker generation
tts.tts_to_file(text="Speaker one here.", speaker="Claribel Dervla", file_path="s1.wav")
tts.tts_to_file(text="Speaker two responding.", speaker="Daisy Studious", file_path="s2.wav")
```

## Bark — Expressive, Non-verbal Sounds

```bash
pip install bark
```

```python
from bark import SAMPLE_RATE, generate_audio, preload_models
from scipy.io.wavfile import write as write_wav

preload_models()
audio_array = generate_audio("Hello! [laughs] Welcome to the show!")
write_wav("bark_output.wav", SAMPLE_RATE, audio_array)
```

Bark adds: `[laughs]`, `[sighs]`, `[music]`, `[gasps]`, `[clears throat]`

## MeloTTS — Fast Multilingual (⭐8k+)

```bash
pip install git+https://github.com/myshell-ai/MeloTTS.git
python -m unidic download
```

```python
from melo.api import TTS
model = TTS(language='EN')
model.tts_to_file("Hello, this is MeloTTS speaking.", speaker_id=0, output_path="melo.wav")
# Languages: EN, ES, FR, ZH, JP, KR
```

## Ollama TTS (via voicebox skill)

```bash
# If you have voicebox running:
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","input":"Hello world!","voice":"alloy"}' \
  --output speech.mp3
```

## Quick Command Matrix

```bash
# ChatTTS — conversational quality
pip install ChatTTS && python -c "
import ChatTTS, torchaudio, torch
c=ChatTTS.Chat(); c.load(compile=False)
w=c.infer(['Hello from Eburon AI!'])[0]
torchaudio.save('out.wav', torch.from_numpy(w).unsqueeze(0), 24000)
"

# Piper — CPU, instant, any language
echo "Hello world" | piper --model en_US-lessac-medium.onnx -f out.wav
```
