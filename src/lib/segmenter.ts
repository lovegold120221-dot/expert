/**
 * MediaPipe Selfie Segmenter — singleton model loader.
 *
 * Uses @mediapipe/tasks-vision ImageSegmenter with the selfie_segmenter model
 * for real-time person/background separation.
 *
 * Returns a Float32Array confidence mask where each value is in [0, 1]:
 *   0.0 = definitely background
 *   1.0 = definitely person
 *
 * This allows smooth alpha blending at edges (no hard green-screen cutout).
 */

import {
  ImageSegmenter,
  FilesetResolver,
  type MPMask,
} from "@mediapipe/tasks-vision";

// ── State ──────────────────────────────────────────────────────────────────
let segmenter: ImageSegmenter | null = null;
let loadPromise: Promise<void> | null = null;
let modelStatus: "idle" | "loading" | "ready" | "error" = "idle";

// Public accessors
export function getSegmenterStatus() {
  return modelStatus;
}

export function isSegmenterReady() {
  return modelStatus === "ready";
}

// ── Initialization ─────────────────────────────────────────────────────────

// Local WASM files (copied to public/mediapipe/wasm/ at build time)
const WASM_BASE = "/mediapipe/wasm/";

// Selfie segmenter model — general purpose (works for any posture)
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

export async function initSegmenter(): Promise<void> {
  if (segmenter) return;
  if (loadPromise) return loadPromise;

  modelStatus = "loading";
  console.log("[Segmenter] Initializing…");

  loadPromise = (async () => {
    try {
      // Resolve the WASM fileset from our local public/ copy
      const wasmFileset = await FilesetResolver.forVisionTasks(WASM_BASE);

      // Create a dedicated canvas for GPU-accelerated inference
      const gpuCanvas =
        typeof document !== "undefined" ? document.createElement("canvas") : undefined;

      segmenter = await ImageSegmenter.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
        // canvas is required for GPU delegate — bind textures to it
        canvas: gpuCanvas,
        runningMode: "VIDEO",
        // Use confidence masks (Float32Array 0..1) for smooth edge blending
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });

      modelStatus = "ready";
      console.log("[Segmenter] Model loaded successfully");
    } catch (err) {
      console.error("[Segmenter] Failed to load model:", err);
      modelStatus = "error";
      loadPromise = null; // allow retry on next attempt

      // Try CPU fallback
      try {
        console.log("[Segmenter] Retrying with CPU delegate…");
        const wasmFileset = await FilesetResolver.forVisionTasks(WASM_BASE);
        segmenter = await ImageSegmenter.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
        modelStatus = "ready";
        console.log("[Segmenter] Model loaded (CPU fallback)");
      } catch (err2) {
        console.error("[Segmenter] CPU fallback also failed:", err2);
        modelStatus = "error";
      }
    }
  })();

  return loadPromise;
}

// ── Per-frame mask acquisition ─────────────────────────────────────────────
// We refresh the mask every N frames and cache it. The compositing loop runs
// at full RAF speed but only calls inference at ~15fps.

let latestMask: Float32Array | null = null;
let latestMaskWidth = 0;
let latestMaskHeight = 0;
let frameSkipCounter = 0;
const SKIP_N = 2; // run inference every 2 frames (~15fps at 30fps composite)

export interface MaskResult {
  mask: Float32Array | null;
  width: number;
  height: number;
}

/**
 * Call this from inside the requestAnimationFrame compositing loop.
 * Every N frames it runs segmentation synchronously and caches the
 * person-confidence mask (Float32Array, 0.0=bg, 1.0=person).
 */
export function getOrRefreshMask(
  videoEl: HTMLVideoElement,
  timestamp: number
): MaskResult {
  if (!segmenter || modelStatus !== "ready") {
    return { mask: null, width: 0, height: 0 };
  }

  frameSkipCounter++;

  if (frameSkipCounter % SKIP_N === 0) {
    try {
      const result = segmenter.segmentForVideo(videoEl, timestamp);

      // confidenceMasks[0] = background confidence
      // confidenceMasks[1] = person confidence  ← this is what we want
      const personMask: MPMask | undefined = result.confidenceMasks?.[1];

      if (personMask) {
        latestMask = personMask.getAsFloat32Array();
        latestMaskWidth = personMask.width;
        latestMaskHeight = personMask.height;
      }
    } catch (err) {
      // Non-fatal — skip this frame, use cached mask
      console.warn("[Segmenter] Inference error:", err);
    }
  }

  return {
    mask: latestMask,
    width: latestMaskWidth,
    height: latestMaskHeight,
  };
}
