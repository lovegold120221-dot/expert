import { NextRequest, NextResponse } from "next/server";
import {
  AccessToken,
  RoomConfiguration,
  RoomAgentDispatch,
} from "livekit-server-sdk";
import {
  DEPARTURE_TIMEOUT,
  EMPTY_ROOM_TIMEOUT,
  MAX_PARTICIPANTS,
  SESSION_TTL_SECONDS,
} from "@/lib/config";
import { rateLimit, rateLimitedResponse } from "@/lib/api-utils";

// Must match agent_name in translator/src/agent.py. Using a branded name
// (not "translator") so we don't collide with stale Cloud Agents registered
// under common names — see git history for the diagnosis.
const TRANSLATOR_AGENT_NAME = "eburon-translator";

// Reject identities/room names that could break JWT subjects or LiveKit
// routing. Allow word chars, dashes, dots, colons, and the breakout prefix.
const IDENTITY_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const ROOM_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export async function GET(req: NextRequest) {
  if (!rateLimit(req)) return rateLimitedResponse();

  const room = req.nextUrl.searchParams.get("room");
  const identity = req.nextUrl.searchParams.get("identity");
  const hostParam = req.nextUrl.searchParams.get("host");
  const isHost = hostParam === "true";
  const displayName =
    req.nextUrl.searchParams.get("name")?.trim() || identity || "";

  if (!room || !identity) {
    return NextResponse.json(
      { error: "Missing room or identity parameter" },
      { status: 400 },
    );
  }

  if (!ROOM_RE.test(room) || !IDENTITY_RE.test(identity)) {
    return NextResponse.json(
      { error: "Invalid room or identity format" },
      { status: 400 },
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.LIVEKIT_URL;
  const publicServerUrl = process.env.LIVEKIT_PUBLIC_URL || serverUrl;

  if (!apiKey || !apiSecret || !serverUrl) {
    return NextResponse.json(
      { error: "Meeting service credentials not configured" },
      { status: 500 },
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: displayName,
    ttl: SESSION_TTL_SECONDS,
  });

  // Peer model (grill Q7): every participant can publish audio + video and
  // subscribe; can update their own attributes (used to broadcast their
  // chosen language to the agent + other peers).
  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
    roomAdmin: isHost,
  });

  // Dispatch the Python translator agent when the room is created (grill Q9).
  // RoomConfiguration is only applied on first creation; subsequent token
  // mints for an existing room are ignored by LiveKit. So idempotent.
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: TRANSLATOR_AGENT_NAME,
        metadata: JSON.stringify({ sessionId: room }),
      }),
    ],
    emptyTimeout: EMPTY_ROOM_TIMEOUT,
    departureTimeout: DEPARTURE_TIMEOUT,
    maxParticipants: MAX_PARTICIPANTS,
  });

  const token = await at.toJwt();

  return NextResponse.json({ token, serverUrl: publicServerUrl });
}
