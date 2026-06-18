"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PICKER_LANGUAGES } from "@/lib/languages";
import { useUser } from "@/context/UserContext";
import { isMobile } from "@/lib/permissions";

const STORAGE_KEY_NAME = "lt.displayName";
const STORAGE_KEY_LANG = "lt.lang";

function getSessionItem(key: string) {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

export default function PreFlightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { profile, updateProfile } = useUser();

  const [displayName, setDisplayName] = useState(() => {
    if (typeof window === "undefined") return "";
    return getSessionItem(STORAGE_KEY_NAME) || "";
  });
  const [lang, setLang] = useState<string>("en");
  const [shareCopied, setShareCopied] = useState(false);
  const [hostMode, setHostMode] = useState(false);

  // Device state
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedCam, setSelectedCam] = useState("");
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState("");
  const [usingFrontCam, setUsingFrontCam] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mobileDevice = isMobile();

  // ── Enumerate devices ──────────────────────────────────────────────────

  const startPreview = useCallback(async (cameraId?: string, frontFacing?: boolean) => {
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const constraints: MediaStreamConstraints = {
      video: cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: frontFacing ? "user" : "environment" },
      audio: true,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPreviewStream(stream);
      setCamError("");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // After getting a stream, enumerate devices with proper labels
      const all = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = all.filter((d) => d.kind === "videoinput");
      const audioInputs = all.filter((d) => d.kind === "audioinput");
      const audioOutputs = all.filter((d) => d.kind === "audiooutput");

      setCameras(
        videoDevices.map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${videoDevices.indexOf(d) + 1}` }))
      );
      setMics(
        audioInputs.map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${audioInputs.indexOf(d) + 1}` }))
      );
      setSpeakers(
        audioOutputs.map((d) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${audioOutputs.indexOf(d) + 1}` }))
      );

      // Auto-select first camera if none selected
      if (!selectedCam && videoDevices.length > 0) {
        setSelectedCam(videoDevices[0].deviceId);
      }
      if (!selectedMic && audioInputs.length > 0) {
        setSelectedMic(audioInputs[0].deviceId);
      }
      if (!selectedSpeaker && audioOutputs.length > 0) {
        setSelectedSpeaker(audioOutputs[0].deviceId);
      }
    } catch (err: unknown) {
      const msg = err instanceof DOMException && err.name === "NotAllowedError"
        ? "Camera and microphone access denied. Please allow access in your browser settings."
        : "Could not access camera. Check your device permissions.";
      setCamError(msg);
      setPreviewStream(null);
    }
  }, [selectedCam, selectedMic, selectedSpeaker]);

  // Init: request media + enumerate on mount
  useEffect(() => {
    const timer = setTimeout(() => startPreview(undefined, true), 0);
    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach stream to video element whenever it changes
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // ── Camera switch ──────────────────────────────────────────────────────

  const handleCameraChange = useCallback((deviceId: string) => {
    setSelectedCam(deviceId);
    startPreview(deviceId);
  }, [startPreview]);

  const flipCamera = useCallback(() => {
    setUsingFrontCam((prev) => !prev);
    // Find front vs back camera
    const front = cameras.find((c) => c.label.toLowerCase().includes("front"));
    const back = cameras.find((c) => c.label.toLowerCase().includes("back"));
    if (usingFrontCam && back) {
      handleCameraChange(back.deviceId);
    } else if (!usingFrontCam && front) {
      handleCameraChange(front.deviceId);
    } else if (cameras.length >= 2) {
      // Cycle through available cameras
      const currentIdx = cameras.findIndex((c) => c.deviceId === selectedCam);
      const nextIdx = (currentIdx + 1) % cameras.length;
      handleCameraChange(cameras[nextIdx].deviceId);
    }
  }, [cameras, usingFrontCam, selectedCam, handleCameraChange]);

  // ── Mic/Speaker change ─────────────────────────────────────────────────

  const handleMicChange = useCallback((deviceId: string) => {
    setSelectedMic(deviceId);
  }, []);

  const handleSpeakerChange = useCallback((deviceId: string) => {
    setSelectedSpeaker(deviceId);
  }, []);

  // ── Save preferences on mount ──────────────────────────────────────────

  useEffect(() => {
    const savedName = getSessionItem(STORAGE_KEY_NAME);
    const savedLang = getSessionItem(STORAGE_KEY_LANG);

    setTimeout(() => {
      if (!savedName && profile?.name) setDisplayName(profile.name);
      if (!savedLang && profile?.default_language) setLang(profile.default_language);

      const hostRoom = window.sessionStorage.getItem("orbitHostRoom");
      if (hostRoom === id) setHostMode(true);
    }, 0);
  }, [profile, id]);

  // ── Join / Copy ────────────────────────────────────────────────────────

  async function handleJoin() {
    if (!displayName.trim()) return;
    window.sessionStorage.setItem(STORAGE_KEY_NAME, displayName.trim());
    window.sessionStorage.setItem(STORAGE_KEY_LANG, lang);

    if (profile && (profile.name !== displayName.trim() || profile.default_language !== lang)) {
      updateProfile({ name: displayName.trim(), default_language: lang });
    }

    // Stop preview before entering room
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    router.push(`/session/${id}/room`);
  }

  async function copyInviteLink() {
    const url = `${window.location.origin}/session/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // ignored
    }
  }

  // ── Device label helper ────────────────────────────────────────────────

  const camLabel = cameras.find((c) => c.deviceId === selectedCam)?.label || "Select camera";

  return (
    <div className="preflight-shell">
      <div className="preflight-card enter-d1">

        {/* ── Close button ── */}
        <button
          type="button"
          className="preflight-close"
          onClick={() => router.push("/")}
          title="Go back"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* ── Brand header ── */}
        <div className="preflight-brand">
          <div className="preflight-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-eburon.svg" alt="Eburon AI" className="preflight-logo" />
          </div>
          <div className="preflight-brand-text">
            <span className="preflight-brand-name">Orbit Meeting</span>
            {hostMode && (
              <span className="preflight-host-badge">Host</span>
            )}
          </div>
        </div>

        {/* ── Heading ── */}
        <div className="preflight-header">
          <h1 className="preflight-title">Host Orbit Meeting</h1>
        </div>

        {/* ── Profile section ── */}
        <section className="preflight-section">
          <div className="preflight-section-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Your profile</span>
          </div>

          <div className="preflight-field-group">
            <label className="preflight-field">
              <span className="preflight-field-label">Name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                maxLength={40}
              />
            </label>

            <label className="preflight-field">
              <span className="preflight-field-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                I speak &amp; listen in
              </span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                {PICKER_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* ── Camera & Devices section ── */}
        <section className="preflight-section">
          <div className="preflight-section-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-13A1.5 1.5 0 0 0 0 5.5v9A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 4Z" />
              <path d="m20 7 4.5 3.5L20 14V7Z" />
            </svg>
            <span>Camera &amp; Audio</span>
          </div>

          {/* ── Video preview ── */}
          <div className="preflight-preview-wrap">
            {camError ? (
              <div className="preflight-preview-error">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-13A1.5 1.5 0 0 0 0 5.5v9A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 4Z" />
                  <path d="m20 7 4.5 3.5L20 14V7Z" />
                  <path d="M1 1l22 22" />
                </svg>
                <p>{camError}</p>
                <button
                  className="preflight-preview-retry"
                  onClick={() => startPreview(selectedCam, usingFrontCam)}
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="preflight-preview-video-box">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="preflight-preview-video"
                  />
                  {mobileDevice && cameras.length > 1 && (
                    <button
                      type="button"
                      className="preflight-flip-btn"
                      onClick={flipCamera}
                      title="Flip camera"
                      aria-label="Flip camera"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12a11 11 0 0 1 21.5-4.5M23 12a11 11 0 0 1-21.5 4.5" />
                        <path d="m1 4v4h4" />
                        <path d="m23 20v-4h-4" />
                      </svg>
                    </button>
                  )}
                  {!previewStream && !camError && (
                    <div className="preflight-preview-loading">
                      <div className="preflight-preview-spinner" />
                      <span>Starting camera...</span>
                    </div>
                  )}
                </div>
                <p className="preflight-preview-label">
                  {camLabel}
                  {cameras.length > 1 && (
                    <span className="preflight-preview-count">
                      &nbsp;· {cameras.length} available
                    </span>
                  )}
                </p>
              </>
            )}
          </div>

          {/* ── Device selectors ── */}
          <div className="preflight-device-selects">
            <label className="preflight-dselect">
              <span className="preflight-dselect-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-13A1.5 1.5 0 0 0 0 5.5v9A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 4Z" />
                  <path d="m20 7 4.5 3.5L20 14V7Z" />
                </svg>
                Camera
              </span>
              <select
                value={selectedCam}
                onChange={(e) => handleCameraChange(e.target.value)}
                disabled={cameras.length === 0}
              >
                {cameras.length === 0 && (
                  <option value="">No cameras detected</option>
                )}
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="preflight-dselect">
              <span className="preflight-dselect-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <path d="M12 19v3" />
                </svg>
                Microphone
              </span>
              <select
                value={selectedMic}
                onChange={(e) => handleMicChange(e.target.value)}
                disabled={mics.length === 0}
              >
                {mics.length === 0 && (
                  <option value="">No microphones detected</option>
                )}
                {mics.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="preflight-dselect">
              <span className="preflight-dselect-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                Speakers
              </span>
              <select
                value={selectedSpeaker}
                onChange={(e) => handleSpeakerChange(e.target.value)}
                disabled={speakers.length === 0}
              >
                {speakers.length === 0 && (
                  <option value="">No speakers detected</option>
                )}
                {speakers.map((s) => (
                  <option key={s.deviceId} value={s.deviceId}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="preflight-actions">
          <button
            className="preflight-btn preflight-btn--primary"
            onClick={handleJoin}
            disabled={!displayName.trim()}
            id="join-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {hostMode ? "Enter room" : "Join call"}
          </button>

          <button
            className="preflight-btn preflight-btn--ghost"
            onClick={copyInviteLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {shareCopied ? "Link copied!" : "Copy invite link"}
          </button>
        </div>

      </div>
    </div>
  );
}
