"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Track, LocalVideoTrack, TrackPublication } from "livekit-client";
import { useUser } from "@/context/UserContext";
import { initSegmenter, getOrRefreshMask, getSegmenterStatus } from "@/lib/segmenter";

export default function VirtualBackgroundProcessor() {
  const { localParticipant } = useLocalParticipant();
  const { profile } = useUser();
  
  const videoBackground = profile?.video_background || "none";
  type CustomBg = { name: string; data: string; type?: 'image' | 'video' };
  const [customBgs, setCustomBgs] = useState<CustomBg[]>([]);

  // Keep references to active tracks/state to avoid stale closures
  const rawTrackRef = useRef<LocalVideoTrack | null>(null);
  const canvasTrackRef = useRef<MediaStreamTrack | null>(null);
  const publishedCanvasTrackRef = useRef<TrackPublication | null>(null); // TrackPublication
  const compositeLoopRunningRef = useRef<boolean>(false);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // Load custom backgrounds on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("orbit.customBgs");
      if (raw) {
        const timer = setTimeout(() => setCustomBgs(JSON.parse(raw)), 0);
        return () => clearTimeout(timer);
      }
    } catch { /* ignore */ }
  }, []);

  // Helper to clean up a background video element
  const stopBgVideo = useCallback(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
      bgVideoRef.current.src = "";
      bgVideoRef.current.load(); // release allocated media
      bgVideoRef.current = null;
    }
  }, []);

  // Preload and cache selected background image/video
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
      stopBgVideo();
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

  // Clean up background video on unmount
  useEffect(() => {
    return () => stopBgVideo();
  }, [stopBgVideo]);

  // Helper to cover-fill draw a source onto target dimensions
  const coverRect = (
    sw: number,
    sh: number,
    tw: number,
    th: number
  ): { x: number; y: number; w: number; h: number } => {
    const scale = Math.max(tw / sw, th / sh);
    const w = sw * scale;
    const h = sh * scale;
    return { x: (tw - w) / 2, y: (th - h) / 2, w, h };
  };

  // Starts the canvas composite loop
  const startCompositeLoop = (videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement) => {
    if (compositeLoopRunningRef.current) return;
    compositeLoopRunningRef.current = true;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    // Use a secondary offscreen canvas for drawing original video frames
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    const composite = () => {
      if (!compositeLoopRunningRef.current) return;

      if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
        animFrameIdRef.current = requestAnimationFrame(composite);
        return;
      }

      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;

      // Match canvas dimensions to the webcam's native track aspect ratio/dimensions
      if (canvasEl.width !== vw || canvasEl.height !== vh) {
        canvasEl.width = vw;
        canvasEl.height = vh;
      }
      if (tempCanvas.width !== vw || tempCanvas.height !== vh) {
        tempCanvas.width = vw;
        tempCanvas.height = vh;
      }

      const cw = canvasEl.width;
      const ch = canvasEl.height;

      // Step 1: Draw clean video frame onto temp canvas
      tempCtx.drawImage(videoEl, 0, 0, cw, ch);

      // Step 2: Get segmentation mask
      const now = performance.now();
      const { mask, width: mw, height: mh } = getOrRefreshMask(videoEl, now);

      if (!mask || mw === 0) {
        // Segmenter not ready yet, draw raw camera input
        ctx.drawImage(tempCanvas, 0, 0);
        animFrameIdRef.current = requestAnimationFrame(composite);
        return;
      }

      // Step 3: Draw background (blur, image, or video)
      const isBgBlur = videoBackground === "blur";
      const bgImg = bgImageRef.current;
      const bgVideo = bgVideoRef.current;
      const hasBgImg = bgImg && bgImg.complete && bgImg.naturalWidth > 0;
      const hasBgVideo = bgVideo && bgVideo.readyState >= 2 && bgVideo.videoWidth > 0;

      if (isBgBlur) {
        ctx.filter = "blur(14px)";
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.filter = "none";
      } else if (hasBgVideo) {
        const bgr = coverRect(bgVideo.videoWidth, bgVideo.videoHeight, cw, ch);
        ctx.drawImage(bgVideo, bgr.x, bgr.y, bgr.w, bgr.h);
      } else if (hasBgImg) {
        const bgr = coverRect(bgImg.naturalWidth, bgImg.naturalHeight, cw, ch);
        ctx.drawImage(bgImg, bgr.x, bgr.y, bgr.w, bgr.h);
      } else {
        ctx.fillStyle = "#1e1e24";
        ctx.fillRect(0, 0, cw, ch);
      }

      // Step 4: Alpha blend using confidence mask
      const bgData = ctx.getImageData(0, 0, cw, ch);
      const videoData = tempCtx.getImageData(0, 0, cw, ch);
      const vd = videoData.data;
      const bd = bgData.data;

      // Native resolution of the mask matches mw * mh
      const maskScaleX = mw / cw;
      const maskScaleY = mh / ch;
      const output = new Uint8ClampedArray(bd);

      for (let y = 0; y < ch; y++) {
        const maskY = Math.floor(y * maskScaleY);
        const maskRowOffset = maskY * mw;
        const canvasRowStart = y * cw * 4;

        for (let x = 0; x < cw; x++) {
          const maskX = Math.floor(x * maskScaleX);
          const conf = mask[maskRowOffset + maskX];
          const pix = canvasRowStart + x * 4;

          if (conf > 0.95) {
            output[pix] = vd[pix];
            output[pix + 1] = vd[pix + 1];
            output[pix + 2] = vd[pix + 2];
          } else if (conf > 0.05) {
            const inv = 1 - conf;
            output[pix] = bd[pix] * inv + vd[pix] * conf;
            output[pix + 1] = bd[pix + 1] * inv + vd[pix + 1] * conf;
            output[pix + 2] = bd[pix + 2] * inv + vd[pix + 2] * conf;
          }
          output[pix + 3] = 255;
        }
      }

      ctx.putImageData(new ImageData(output, cw, ch), 0, 0);
      animFrameIdRef.current = requestAnimationFrame(composite);
    };

    animFrameIdRef.current = requestAnimationFrame(composite);
  };

  const stopCompositeLoop = () => {
    compositeLoopRunningRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = 0;
    }
  };

  // Main controller for setting up the canvas track and publishing it
  const setupAndPublishCanvasTrack = useCallback(async (rawVideoTrack: LocalVideoTrack) => {
    console.log("[VB] Setting up canvas track. Background style:", videoBackground);

    // Initialize segmenter if needed
    if (getSegmenterStatus() === "idle") {
      await initSegmenter();
    }

    const videoEl = document.createElement("video");
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.muted = true;

    // Clone track to avoid side effects of LiveKit's unpublish track logic
    const clonedTrack = rawVideoTrack.mediaStreamTrack.clone();
    videoEl.srcObject = new MediaStream([clonedTrack]);
    await videoEl.play().catch(err => console.error("[VB] Failed to play raw video:", err));

    const canvasEl = document.createElement("canvas");
    canvasEl.width = videoEl.videoWidth || 640;
    canvasEl.height = videoEl.videoHeight || 360;

    startCompositeLoop(videoEl, canvasEl);

    // Capture the canvas stream at 30 fps
    const canvasStream = canvasEl.captureStream(30);
    const canvasVideoTrack = canvasStream.getVideoTracks()[0];
    canvasTrackRef.current = canvasVideoTrack;

    // Monitor track completion to clean up cloned resources
    canvasVideoTrack.addEventListener("ended", () => {
      clonedTrack.stop();
    });

    console.log("[VB] Publishing canvas track to room...");
    const pub = await localParticipant.publishTrack(canvasVideoTrack, {
      name: "camera",
      source: Track.Source.Camera,
    });
    publishedCanvasTrackRef.current = pub;
  }, [localParticipant, videoBackground]);

  const cleanUpCanvasTrack = useCallback(async () => {
    stopCompositeLoop();

    if (publishedCanvasTrackRef.current) {
      console.log("[VB] Unpublishing canvas track...");
      if (canvasTrackRef.current) await localParticipant.unpublishTrack(canvasTrackRef.current);
      publishedCanvasTrackRef.current = null;
    }

    if (canvasTrackRef.current) {
      canvasTrackRef.current.stop();
      canvasTrackRef.current = null;
    }
  }, [localParticipant]);

  const cleanUpAll = useCallback(async () => {
    await cleanUpCanvasTrack();
    if (rawTrackRef.current) {
      console.log("[VB] Stopping raw webcam track...");
      rawTrackRef.current.stop();
      rawTrackRef.current = null;
    }
  }, [cleanUpCanvasTrack]);

  // React to track publication changes and intercept raw camera tracks
  useEffect(() => {
    if (!localParticipant) return;

    const handleTrackPublished = async (pub: TrackPublication) => {
      if (pub.source !== Track.Source.Camera) return;
      if (!pub.track) return;

      const track = pub.track as LocalVideoTrack;

      // Avoid infinite loops: if this is our own canvas track, ignore it
      if (canvasTrackRef.current && track.mediaStreamTrack.id === canvasTrackRef.current.id) {
        console.log("[VB] Canvas track published successfully");
        return;
      }

      console.log("[VB] Raw webcam track published:", track.sid);
      rawTrackRef.current = track;

      if (videoBackground !== "none") {
        // Intercept: unpublish raw, setup processed background feed
        console.log("[VB] Virtual background active. Intercepting raw track...");
        await localParticipant.unpublishTrack(track);
        await setupAndPublishCanvasTrack(track);
      }
    };

    const handleTrackUnpublished = async (pub: TrackPublication) => {
      if (pub.source !== Track.Source.Camera) return;
      
      // If the unpublished track matches our canvas track or there are no camera tracks, clean up
      if (publishedCanvasTrackRef.current && pub.trackSid === publishedCanvasTrackRef.current.trackSid) {
        console.log("[VB] Canvas track unpublished");
        await cleanUpAll();
      } else if (rawTrackRef.current && pub.trackSid === rawTrackRef.current.sid) {
        console.log("[VB] Raw track unpublished");
        await cleanUpAll();
      }
    };

    localParticipant.on("localTrackPublished", handleTrackPublished);
    localParticipant.on("localTrackUnpublished", handleTrackUnpublished);

    // Initial check: if raw camera track is already published before we mount
    for (const pub of localParticipant.videoTrackPublications.values()) {
      if (pub.source === Track.Source.Camera && pub.track) {
        handleTrackPublished(pub);
      }
    }

    return () => {
      localParticipant.off("localTrackPublished", handleTrackPublished);
      localParticipant.off("localTrackUnpublished", handleTrackUnpublished);
    };
  }, [localParticipant, videoBackground, setupAndPublishCanvasTrack, cleanUpAll]);

  // Handle dynamic background setting changes in the middle of a call
  useEffect(() => {
    const handleBackgroundSettingChange = async () => {
      if (videoBackground === "none") {
        // Turn off background effect: switch from canvas to raw camera track
        if (publishedCanvasTrackRef.current) {
          console.log("[VB] VB disabled. Reverting back to raw track...");
          await cleanUpCanvasTrack();

          if (rawTrackRef.current) {
            console.log("[VB] Re-publishing raw track...");
            await localParticipant.publishTrack(rawTrackRef.current);
          }
        }
      } else {
        // VB is enabled
        if (!publishedCanvasTrackRef.current && rawTrackRef.current) {
          console.log("[VB] VB enabled. Publishing canvas track...");
          // We have raw track published, need to unpublish it and publish canvas
          const isRawPublished = rawTrackRef.current.sid ? localParticipant.videoTrackPublications.has(rawTrackRef.current.sid) : false;
          if (isRawPublished) {
            await localParticipant.unpublishTrack(rawTrackRef.current);
          }
          await setupAndPublishCanvasTrack(rawTrackRef.current);
        }
      }
    };

    handleBackgroundSettingChange();
  }, [videoBackground, localParticipant, cleanUpCanvasTrack, setupAndPublishCanvasTrack]);

  // Clean up all resources when component unmounts
  useEffect(() => {
    return () => {
      cleanUpAll();
    };
  }, [cleanUpAll]);

  return null;
}
