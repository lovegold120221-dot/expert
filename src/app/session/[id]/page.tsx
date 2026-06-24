"use client";

import { use, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PICKER_LANGUAGES } from "@/lib/languages";
import { useUser } from "@/context/UserContext";
import { isMobile } from "@/lib/permissions";
import {
  initSegmenter,
  getOrRefreshMask,
  isSegmenterReady,
  getSegmenterStatus,
} from "@/lib/segmenter";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileDevice = isMobile();

  // Video effects
  const [videoBackground, setVideoBackground] = useState(profile?.video_background || "none");
  const [mirrorVideo, setMirrorVideo] = useState(profile?.mirror_video !== false);
  const [studioEffect, setStudioEffect] = useState(profile?.studio_effect || false);
  type CustomBg = { name: string; data: string; type?: 'image' | 'video' };
  const [customBgs, setCustomBgs] = useState<CustomBg[]>([]);
  const STORAGE_BGS_KEY = "orbit.customBgs";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const prevMaskRef = useRef<Float32Array | null>(null);
  const [segmenterStatus, setSegmenterStatus] = useState("idle"); // Managed via effect
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const segmenterInitRef = useRef(false);

  const hasImageBg = useMemo(() => {
    return videoBackground !== "none" && videoBackground !== "blur";
  }, [videoBackground]);

  const BG_PRESETS = [
    { id: "none", label: "None", thumb: null },
    { id: "blur", label: "Blur", thumb: null },
    { id: "bg-studio/bg1.jpg", label: "Studio 1", thumb: "/bg-studio/bg1.jpg" },
    { id: "bg-studio/bg2.jpg", label: "Studio 2", thumb: "/bg-studio/bg2.jpg" },
    { id: "bg-studio/bg3.jpg", label: "Studio 3", thumb: "/bg-studio/bg3.jpg" },
    { id: "bg-studio/bg4.jpg", label: "Studio 4", thumb: "/bg-studio/bg4.jpg" },
    { id: "bg-studio/bg5.jpg", label: "Studio 5", thumb: "/bg-studio/bg5.jpg" },
  ];

  // ── Lazy-init the segmenter when user picks a background effect ──────────
  useEffect(() => {
    if (videoBackground === "none") return;
    if (segmenterInitRef.current) return;

    segmenterInitRef.current = true;
    setSegmenterStatus("loading");

    initSegmenter().then(() => {
      setSegmenterStatus(isSegmenterReady() ? "ready" : "error");
    });
  }, [videoBackground]);

  // Poll segmenter status (init is async, status updates via the getter)
  useEffect(() => {
    if (segmenterStatus !== "loading") return;
    const id = setInterval(() => {
      const s = getSegmenterStatus();
      if (s !== "loading") {
        setSegmenterStatus(s);
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, [segmenterStatus]);

  // Helper to clean up a background video element
  const stopBgVideo = useCallback(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
      bgVideoRef.current.src = "";
      bgVideoRef.current.load(); // release allocated media
      bgVideoRef.current = null;
    }
  }, []);

  // Also clean up video on unmount
  useEffect(() => {
    return () => stopBgVideo();
  }, [stopBgVideo]);

  // Load background image/video into ref when it changes
  useEffect(() => {
    if (videoBackground === "none" || videoBackground === "blur") {
      bgImageRef.current = null;
      stopBgVideo();
      return;
    }

    const entry = videoBackground.startsWith("custom-")
      ? customBgs.find((b) => `custom-${b.name}` === videoBackground)
      : null;

    if (entry?.type === "video") {
      // Video background — create a looping video element
      bgImageRef.current = null;
      stopBgVideo(); // release any previous video
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.src = entry.data;
      video.play().catch(() => {});
      bgVideoRef.current = video;
    } else if (entry) {
      bgVideoRef.current = null;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = entry.data;
      img.onload = () => { bgImageRef.current = img; };
    } else if (!videoBackground.startsWith("custom-")) {
      bgVideoRef.current = null;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `/${videoBackground}`;
      img.onload = () => { bgImageRef.current = img; };
    }
  }, [videoBackground, customBgs]);

  // ── Canvas compositing loop (ML person segmentation) ────────────────────
  useEffect(() => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    const boxEl = videoBoxRef.current;
    if (!canvasEl || !videoEl || !boxEl) return;

    // Reusable temp canvas for clean video frames
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement("canvas");
    }
    const tempCanvas = tempCanvasRef.current;
    const tempCtx = tempCanvas.getContext("2d")!;

    // Match canvas pixel dimensions to container
    function sizeCanvas() {
      const b = videoBoxRef.current;
      const c = canvasRef.current;
      if (!b || !c) return;
      const rect = b.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w > 0 && h > 0 && (c.width !== w || c.height !== h)) {
        c.width = w;
        c.height = h;
      }
    }

    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(boxEl);
    sizeCanvas();

    let running = true;

    // Compute cover-fill draw rect for a source w×h onto target w×h
    function coverRect(
      sw: number,
      sh: number,
      tw: number,
      th: number
    ): { x: number; y: number; w: number; h: number } {
      const scale = Math.max(tw / sw, th / sh);
      const w = sw * scale;
      const h = sh * scale;
      return { x: (tw - w) / 2, y: (th - h) / 2, w, h };
    }

    function composite() {
      if (!running) return;

      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx) {
        animFrameRef.current = requestAnimationFrame(composite);
        return;
      }

      sizeCanvas();
      // Also size temp canvas
      tempCanvas.width = c.width;
      tempCanvas.height = c.height;

      const cw = c.width;
      const ch = c.height;
      if (cw === 0 || ch === 0) {
        animFrameRef.current = requestAnimationFrame(composite);
        return;
      }

      const vEl = videoRef.current;
      if (!vEl || vEl.readyState < 2 || vEl.videoWidth === 0) {
        // No video yet — just show black
        ctx.clearRect(0, 0, cw, ch);
        animFrameRef.current = requestAnimationFrame(composite);
        return;
      }

      const vw = vEl.videoWidth;
      const vh = vEl.videoHeight;
      const vr = coverRect(vw, vh, cw, ch);

      // ── Step 1: Draw the raw video frame onto the temp canvas ──────
      // (mirror handled via transform)
      if (mirrorVideo) {
        tempCtx.save();
        tempCtx.translate(cw, 0);
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(vEl, vr.x, vr.y, vr.w, vr.h);
        tempCtx.restore();
      } else {
        tempCtx.drawImage(vEl, vr.x, vr.y, vr.w, vr.h);
      }

      const isBlank = videoBackground === "none";

      if (isBlank) {
        // No effect — just copy video frame directly
        ctx.drawImage(tempCanvas, 0, 0);
        animFrameRef.current = requestAnimationFrame(composite);
        return;
      }

      // ── Step 2: Get segmentation mask (before building bg) ─────────
      // Check mask first so we can skip expensive bg building if model
      // isn't ready yet — just show plain video during loading.
      const now = performance.now();
      const { mask, width: mw, height: mh } = getOrRefreshMask(vEl, now);

      if (!mask || mw === 0) {
        // Model not ready yet — show plain video (no overlay, no bg)
        ctx.drawImage(tempCanvas, 0, 0);
        animFrameRef.current = requestAnimationFrame(composite);
        return;
      }

      // ── Step 3: Build the background layer on the main canvas ──────
      const isBgBlur = videoBackground === "blur";
      const bgImg = bgImageRef.current;
      const bgVideo = bgVideoRef.current;
      const hasBgImg = bgImg && bgImg.complete && bgImg.naturalWidth > 0;
      const hasBgVideo = bgVideo && bgVideo.readyState >= 2 && bgVideo.videoWidth > 0;

      if (isBgBlur) {
        // Blurred video as background (blur the whole frame, then cut
        // out the person and paste them sharp on top)
        ctx.filter = "blur(14px)";
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.filter = "none";
      } else if (hasBgVideo) {
        // Looping video as background
        const bgr = coverRect(bgVideo.videoWidth, bgVideo.videoHeight, cw, ch);
        ctx.drawImage(bgVideo, bgr.x, bgr.y, bgr.w, bgr.h);
      } else if (hasBgImg) {
        // Cover-fill the background image
        const bgr = coverRect(bgImg.naturalWidth, bgImg.naturalHeight, cw, ch);
        ctx.drawImage(bgImg, bgr.x, bgr.y, bgr.w, bgr.h);
      } else {
        // Fallback: clear to dark
        ctx.clearRect(0, 0, cw, ch);
      }

      // ── Step 4: Read background pixels ─────────────────────────────
      const bgData = ctx.getImageData(0, 0, cw, ch);

      // ── Step 5: Read video pixels from temp canvas ─────────────────
      const videoData = tempCtx.getImageData(0, 0, cw, ch);
      const vd = videoData.data;
      const bd = bgData.data;

      // ── Step 6: Alpha-blend using person-confidence mask ───────────
      // mask is Float32Array at video-native resolution (mw × mh).
      // The video was drawn onto temp canvas at cover-rect (vr), so
      // canvas pixels must be mapped through the cover-fill crop to
      // find the correct mask pixel.
      // canvas_y → mask_y:  maskY = (canvas_y - vr.y) * mh / vr.h
      const maskScaleX = mw / vr.w;
      const maskScaleY = mh / vr.h;
      const maskOffsetX = -vr.x * maskScaleX;
      const maskOffsetY = -vr.y * maskScaleY;
      const output = new Uint8ClampedArray(bd); // start with background

      for (let y = 0; y < ch; y++) {
        const maskY = Math.floor(y * maskScaleY + maskOffsetY);
        if (maskY < 0 || maskY >= mh) {
          // Outside mask bounds — keep background
          continue;
        }
        const maskRowOffset = maskY * mw;
        const canvasRowStart = y * cw * 4;

        for (let x = 0; x < cw; x++) {
          const maskX = Math.floor(x * maskScaleX + maskOffsetX);
          if (maskX < 0 || maskX >= mw) {
            // Outside mask bounds — keep background
            continue;
          }

          const conf = mask[maskRowOffset + maskX];
          const pix = canvasRowStart + x * 4;

          if (conf > 0.95) {
            // Definitely person — copy video pixel directly
            output[pix] = vd[pix];
            output[pix + 1] = vd[pix + 1];
            output[pix + 2] = vd[pix + 2];
          } else if (conf > 0.05) {
            // Edge zone — alpha-blend for smooth feathered transition
            const inv = 1 - conf;
            output[pix] = bd[pix] * inv + vd[pix] * conf;
            output[pix + 1] = bd[pix + 1] * inv + vd[pix + 1] * conf;
            output[pix + 2] = bd[pix + 2] * inv + vd[pix + 2] * conf;
          }
          // conf <= 0.05: definitely background — keep bg pixel (already in output)
          output[pix + 3] = 255;
        }
      }

      ctx.putImageData(new ImageData(output, cw, ch), 0, 0);

      animFrameRef.current = requestAnimationFrame(composite);
    }

    animFrameRef.current = requestAnimationFrame(composite);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, [previewStream, videoBackground, mirrorVideo, segmenterStatus]);

  // Studio effect CSS filter (applied to canvas element)
  const canvasFilter = studioEffect
    ? "brightness(1.08) contrast(0.92) saturate(0.85) blur(0.3px)"
    : undefined;

  // Video CSS transform (only used when no background effect active — "none")
  const videoTransform = mirrorVideo
    ? "scaleX(-1)"
    : undefined;

  // Video CSS filter (only used for "none" — no segmentation needed)
  const videoFilter = studioEffect && videoBackground === "none"
    ? "brightness(1.08) contrast(0.92) saturate(0.85) blur(0.3px)"
    : undefined;

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

      // Auto-select saved devices from profile, or first available if none saved
      if (!selectedCam && videoDevices.length > 0) {
        const savedCam = profile?.cam_device_id;
        const camToUse = savedCam && videoDevices.some(d => d.deviceId === savedCam)
          ? savedCam
          : videoDevices[0].deviceId;
        setSelectedCam(camToUse);
      }
      if (!selectedMic && audioInputs.length > 0) {
        const savedMic = profile?.mic_device_id;
        const micToUse = savedMic && audioInputs.some(d => d.deviceId === savedMic)
          ? savedMic
          : audioInputs[0].deviceId;
        setSelectedMic(micToUse);
      }
      if (!selectedSpeaker && audioOutputs.length > 0) {
        const savedSpeaker = profile?.speaker_device_id;
        const speakerToUse = savedSpeaker && audioOutputs.some(d => d.deviceId === savedSpeaker)
          ? savedSpeaker
          : audioOutputs[0].deviceId;
        setSelectedSpeaker(speakerToUse);
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

  // Load custom backgrounds from localStorage
  useEffect(() => {
    setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_BGS_KEY);
        if (raw) setCustomBgs(JSON.parse(raw));
      } catch { /* ignore */ }
    }, 0);
  }, []);

  // Save video settings to profile on change
  const saveVideoSettings = useCallback((bg: string, mirror: boolean, studio: boolean) => {
    if (profile) {
      updateProfile({ video_background: bg, mirror_video: mirror, studio_effect: studio });
    }
  }, [profile, updateProfile]);

  const handleBgChange = useCallback((bg: string) => {
    setVideoBackground(bg);
    saveVideoSettings(bg, mirrorVideo, studioEffect);
  }, [mirrorVideo, studioEffect, saveVideoSettings]);

  const handleMirrorChange = useCallback((val: boolean) => {
    setMirrorVideo(val);
    saveVideoSettings(videoBackground, val, studioEffect);
  }, [videoBackground, studioEffect, saveVideoSettings]);

  const handleStudioChange = useCallback((val: boolean) => {
    setStudioEffect(val);
    saveVideoSettings(videoBackground, mirrorVideo, val);
  }, [videoBackground, mirrorVideo, saveVideoSettings]);

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    if (!file.type.startsWith("image/") && !isVideo) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const name = `bg-${Date.now()}`;
      const updated: CustomBg[] = [...customBgs, { name, data: dataUrl, type: isVideo ? 'video' : 'image' }];
      setCustomBgs(updated);
      localStorage.setItem(STORAGE_BGS_KEY, JSON.stringify(updated));
      setVideoBackground(`custom-${name}`);
      saveVideoSettings(`custom-${name}`, mirrorVideo, studioEffect);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [customBgs, mirrorVideo, studioEffect, saveVideoSettings]);

  // ── Camera switch ──────────────────────────────────────────────────────

  const handleCameraChange = useCallback((deviceId: string) => {
    setSelectedCam(deviceId);
    updateProfile({ cam_device_id: deviceId });
    startPreview(deviceId);
  }, [startPreview, updateProfile]);

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
    updateProfile({ mic_device_id: deviceId });
  }, [updateProfile]);

  const handleSpeakerChange = useCallback((deviceId: string) => {
    setSelectedSpeaker(deviceId);
    updateProfile({ speaker_device_id: deviceId });
  }, [updateProfile]);

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
          onClick={() => router.push("/dashboard")}
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
                <div
                  ref={videoBoxRef}
                  className={`preflight-preview-video-box${videoBackground !== "none" ? " preflight-preview-video-box--canvas" : ""}`}
                >
                  {/* Canvas compositing layer (used when any bg effect active) */}
                  {videoBackground !== "none" ? (
                    <canvas
                      ref={canvasRef}
                      className="preflight-preview-canvas"
                      style={{ filter: canvasFilter }}
                    />
                  ) : null}
                  {/* Video element: hidden when canvas compositing, visible otherwise */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`preflight-preview-video${videoBackground !== "none" ? " preflight-preview-video--hidden" : ""}`}
                    style={{
                      transform: videoTransform,
                      filter: videoFilter,
                    }}
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

                {/* ── Video background presets ── */}
                <div className="preflight-bg-bar">
                  {BG_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`preflight-bg-opt${videoBackground === preset.id ? " preflight-bg-opt--active" : ""}`}
                      onClick={() => handleBgChange(preset.id)}
                      title={preset.label}
                    >
                      {preset.id === "none" ? (
                        <div className="preflight-bg-thumb preflight-bg-thumb--none">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                          </svg>
                        </div>
                      ) : preset.id === "blur" ? (
                        <div className="preflight-bg-thumb preflight-bg-thumb--blur">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a10 10 0 0 1 0 20" />
                          </svg>
                        </div>
                      ) : (
                        <div className="preflight-bg-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preset.thumb!} alt={preset.label} className="preflight-bg-thumb-img" />
                        </div>
                      )}
                    </button>
                  ))}
                  {/* Upload button */}
                  <button
                    className="preflight-bg-opt preflight-bg-opt--upload"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload custom background"
                  >
                    <div className="preflight-bg-thumb preflight-bg-thumb--upload">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    onChange={handleBgUpload}
                  />
                  {/* Custom uploaded items */}
                  {customBgs.map((bg) => (
                    <button
                      key={bg.name}
                      className={`preflight-bg-opt${videoBackground === `custom-${bg.name}` ? " preflight-bg-opt--active" : ""}`}
                      onClick={() => handleBgChange(`custom-${bg.name}`)}
                      title={bg.name}
                    >
                      <div className="preflight-bg-thumb" style={{ position: "relative" }}>
                        {bg.type === "video" ? (
                          <div className="preflight-bg-thumb-video-indicator">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={bg.data} alt="" className="preflight-bg-thumb-img" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* ── Model loading indicator ── */}
                {videoBackground !== "none" && segmenterStatus === "loading" && (
                  <div className="preflight-model-loading">
                    <div className="preflight-preview-spinner" />
                    <span>Loading AI model…</span>
                  </div>
                )}

                {/* ── Mirror + Studio toggles ── */}
                <div className="preflight-video-toggles">
                  <label className="preflight-toggle">
                    <span className="preflight-toggle-label">Mirror video</span>
                    <div className="preflight-toggle-switch">
                      <input
                        type="checkbox"
                        checked={mirrorVideo}
                        onChange={(e) => handleMirrorChange(e.target.checked)}
                      />
                      <span className="preflight-toggle-slider" />
                    </div>
                  </label>
                  <label className="preflight-toggle">
                    <span className="preflight-toggle-label">Studio effect</span>
                    <div className="preflight-toggle-switch">
                      <input
                        type="checkbox"
                        checked={studioEffect}
                        onChange={(e) => handleStudioChange(e.target.checked)}
                      />
                      <span className="preflight-toggle-slider" />
                    </div>
                  </label>
                </div>
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
