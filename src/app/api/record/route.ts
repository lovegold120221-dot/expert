import { NextRequest, NextResponse } from "next/server";
import { EgressClient, AccessToken } from "livekit-server-sdk";
import { isRoomHost, rateLimit, rateLimitedResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  if (!rateLimit(req)) return rateLimitedResponse();

  try {
    const { action, roomName, requesterIdentity } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: "Missing roomName parameter" }, { status: 400 });
    }

    // Recording is host-only.
    if (!requesterIdentity || !(await isRoomHost(roomName, requesterIdentity))) {
      return NextResponse.json(
        { error: "Only the host can perform this action" },
        { status: 403 },
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json({ error: "Meeting service credentials not configured" }, { status: 500 });
    }

    const egressClient = new EgressClient(serverUrl, apiKey, apiSecret);

    if (action === "start") {
      // Bypass EgressClient's output validation bug by hitting Twirp directly
      const at = new AccessToken(apiKey, apiSecret, { identity: "admin-bot", ttl: 60 });
      at.addGrant({ roomRecord: true });
      const jwt = await at.toJwt();
      
      let host = serverUrl.replace(/\/$/, "");
      host = host.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
      
      const res = await fetch(`${host}/twirp/livekit.Egress/StartRoomCompositeEgress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({
          room_name: roomName,
          file: {
            filepath: `recording-${roomName}-${Date.now()}.mp4`,
            file_type: 1 // MP4
          },
          file_outputs: [{
            filepath: `recording-${roomName}-${Date.now()}.mp4`,
            file_type: 1
          }]
        })
      });

      if (!res.ok) {
        // Don't leak Twirp internals; surface a generic message.
        throw new Error(`Failed to start egress (${res.status})`);
      }

      const egressData = await res.json();
      return NextResponse.json({ success: true, egressId: egressData.egress_id });
    } else if (action === "stop") {
      const list = await egressClient.listEgress({ roomName });
      let stoppedCount = 0;
      
      for (const e of list) {
        // Status 1 (STARTING) or 2 (ACTIVE) indicates an ongoing egress
        if (e.status === 1 || e.status === 2) {
          await egressClient.stopEgress(e.egressId);
          stoppedCount++;
        }
      }
      return NextResponse.json({ success: true, stoppedCount });
    } else {
      return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Recording API Error:", error);
    return NextResponse.json(
      { error: "Failed to process recording request. Ensure recording service is configured." },
      { status: 500 }
    );
  }
}
