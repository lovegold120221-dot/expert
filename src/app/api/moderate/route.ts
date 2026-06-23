import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { isRoomHost, rateLimit, rateLimitedResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  if (!rateLimit(req)) return rateLimitedResponse();

  try {
    const { action, roomName, identity, trackSid, requesterIdentity } = await req.json();

    if (!action || !roomName || !identity) {
      return NextResponse.json(
        { error: "Missing required parameters (action, roomName, identity)" },
        { status: 400 }
      );
    }

    // Verify the caller is the host before allowing kick/mute.
    if (!requesterIdentity || !(await isRoomHost(roomName, requesterIdentity))) {
      return NextResponse.json(
        { error: "Only the host can perform this action" },
        { status: 403 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json(
        { error: "Meeting service credentials not configured" },
        { status: 500 }
      );
    }

    const roomService = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    if (action === "kick") {
      await roomService.removeParticipant(roomName, identity);
      return NextResponse.json({ success: true, action: "kick" });
    } else if (action === "mute") {
      if (!trackSid) {
        return NextResponse.json(
          { error: "Missing trackSid for mute action" },
          { status: 400 }
        );
      }
      await roomService.mutePublishedTrack(roomName, identity, trackSid, true);
      return NextResponse.json({ success: true, action: "mute" });
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Moderation API Error:", error);
    // Don't leak internal LiveKit/Twirp error details to the client.
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Failed to process moderation request" },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
