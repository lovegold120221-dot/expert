/**
 * Server-only API helpers: lightweight in-memory rate limiting and host
 * verification for the LiveKit-backed routes.
 *
 * These are intentionally dependency-free (no zod/redis) to keep the
 * stateless API routes Vercel-friendly. The rate limiter is per-instance
 * (per serverless function cold start), which is sufficient to stop trivial
 * abuse of the open token mint / moderation endpoints; a distributed store
 * can be dropped in later if needed.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";

// ---------------------------------------------------------------------------
// Rate limiter — token-bucket per client IP.
// ---------------------------------------------------------------------------

type Bucket = { tokens: number; lastRefill: number };

const buckets = new Map<string, Bucket>();

const RATE_LIMIT_MAX = 30; // burst capacity
const RATE_LIMIT_REFILL_PER_SEC = 3; // sustained rate

/**
 * Returns true if the request is allowed, false if rate-limited.
 * Call this at the top of a route handler.
 */
export function rateLimit(req: NextRequest): boolean {
  // x-forwarded-for is set by Vercel / most reverse proxies.
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_MAX, lastRefill: now };
    buckets.set(ip, bucket);
  }

  // Refill.
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(RATE_LIMIT_MAX, bucket.tokens + elapsed * RATE_LIMIT_REFILL_PER_SEC);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    return false;
  }
  bucket.tokens -= 1;
  return true;
}

export function rateLimitedResponse() {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": "10" } },
  );
}

// ---------------------------------------------------------------------------
// Host verification — for moderation / recording routes.
// ---------------------------------------------------------------------------

/**
 * Verifies that the caller's `requesterIdentity` is the host of `roomName`.
 *
 * LiveKit tokens carry `roomAdmin: true` for hosts (set in the token route).
 * The server SDK can list participants and inspect their attributes — we
 * check `orbit_host === "true"` on the requester's participant. This blocks
 * non-hosts from kicking/muting other participants.
 *
 * Returns true if the requester is the host, false otherwise.
 */
export async function isRoomHost(
  roomName: string,
  requesterIdentity: string,
): Promise<boolean> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !serverUrl) return false;

  const client = new RoomServiceClient(serverUrl, apiKey, apiSecret);
  try {
    const participants = await client.listParticipants(roomName);
    const requester = participants.find((p) => p.identity === requesterIdentity);
    if (!requester) return false;
    // Hosts self-identify via the orbit_host attribute (set in InCall.tsx).
    // The token route also grants roomAdmin to host-flagged joiners.
    return requester.attributes?.orbit_host === "true";
  } catch {
    return false;
  }
}

/**
 * Wraps a handler with host verification. Extracts `requesterIdentity` from
 * the JSON body and rejects non-hosts with 403.
 *
 * Accepts a Request (the result of `req.clone()`) since the caller has
 * already consumed the original NextRequest's body via `req.json()`.
 */
export async function requireHost(
  req: Request,
  roomName: string,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }> {
  const body = await req.json().catch(() => ({}));
  const requesterIdentity = body?.requesterIdentity;
  if (!requesterIdentity) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing requesterIdentity parameter" },
        { status: 400 },
      ),
    };
  }
  const isHost = await isRoomHost(roomName, requesterIdentity);
  if (!isHost) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Only the host can perform this action" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, body };
}
