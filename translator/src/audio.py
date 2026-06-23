"""Audio frame plumbing for the translation agent."""

from __future__ import annotations

import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator

from livekit import rtc

from config import AUDIO_CHANNELS, EBURON_INPUT_SAMPLE_RATE, EBURON_OUTPUT_SAMPLE_RATE

logger = logging.getLogger("translator.audio")


class MultiplexedAudioStream:
    def __init__(self, track: rtc.RemoteAudioTrack):
        self._track = track
        self._subscribers: set[asyncio.Queue[bytes]] = set()
        self._closed = False
        # Count of frames dropped due to subscriber queue full — surfaced
        # in the close log so operators can diagnose translation gaps under
        # speaker burst or AI service slowness.
        self._dropped: int = 0
        self._task = asyncio.create_task(self._pump())

    async def _pump(self) -> None:
        stream = rtc.AudioStream(
            self._track,
            sample_rate=EBURON_INPUT_SAMPLE_RATE,
            num_channels=AUDIO_CHANNELS,
        )
        try:
            async for ev in stream:
                if self._closed:
                    break
                data = bytes(ev.frame.data)
                for q in list(self._subscribers):
                    try:
                        q.put_nowait(data)
                    except asyncio.QueueFull:
                        self._dropped += 1
        except Exception as e:
            logger.error("MultiplexedAudioStream pump error: %s", e)
        finally:
            await stream.aclose()
            for q in self._subscribers:
                with contextlib.suppress(asyncio.QueueFull):
                    q.put_nowait(b"")
            if self._dropped > 0:
                logger.warning(
                    "MultiplexedAudioStream closed for track %s: dropped=%d frames",
                    getattr(self._track, "sid", "?"),
                    self._dropped,
                )

    def subscribe(self) -> asyncio.Queue[bytes]:
        q = asyncio.Queue(maxsize=100)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[bytes]) -> None:
        self._subscribers.discard(q)

    async def aclose(self) -> None:
        self._closed = True
        if self._task:
            self._task.cancel()
            import contextlib

            with contextlib.suppress(asyncio.CancelledError):
                await self._task


_track_multiplexers: dict[str, MultiplexedAudioStream] = {}


async def iter_pcm_for_eburon(
    track: rtc.RemoteAudioTrack,
) -> AsyncIterator[bytes]:
    """Read PCM frames from a LiveKit track, downsample to 16 kHz mono,
    yield raw little-endian int16 bytes ready for Eburon AI input.
    Multiplexes so multiple sessions can read from the same track."""

    if track.sid not in _track_multiplexers:
        _track_multiplexers[track.sid] = MultiplexedAudioStream(track)

    mux = _track_multiplexers[track.sid]
    q = mux.subscribe()

    try:
        while True:
            chunk = await q.get()
            if not chunk:
                break
            yield chunk
    finally:
        mux.unsubscribe(q)
        if not mux._subscribers:
            _track_multiplexers.pop(track.sid, None)
            # Store the task reference to prevent GC before completion.
            _cleanup_tasks: set[asyncio.Task] = set()
            task = asyncio.create_task(mux.aclose())
            _cleanup_tasks.add(task)
            task.add_done_callback(_cleanup_tasks.discard)


def make_audio_source() -> rtc.AudioSource:
    """An AudioSource sized for 24 kHz mono output."""
    return rtc.AudioSource(EBURON_OUTPUT_SAMPLE_RATE, AUDIO_CHANNELS)


async def push_pcm_to_source(
    source: rtc.AudioSource,
    pcm_bytes: bytes,
) -> None:
    """Wrap a raw 24 kHz mono int16 PCM chunk in an AudioFrame and capture it."""
    import array

    samples = array.array("h")
    samples.frombytes(pcm_bytes)
    frame = rtc.AudioFrame(
        data=samples.tobytes(),
        sample_rate=EBURON_OUTPUT_SAMPLE_RATE,
        num_channels=AUDIO_CHANNELS,
        samples_per_channel=len(samples),
    )
    try:
        await source.capture_frame(frame)
    except Exception as exc:
        # The source can be closed concurrently when the session tears down.
        if "closed" in str(exc).lower() or "invalidstate" in str(exc).lower():
            logger.debug("AudioSource closed mid-capture; dropping frame")
        else:
            raise
