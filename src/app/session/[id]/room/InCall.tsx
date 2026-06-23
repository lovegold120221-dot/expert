"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useDataChannel,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { ConnectionState, ParticipantKind, RoomEvent, Track } from "livekit-client";
import { useRouter } from "next/navigation";
import { PARTICIPANT_LANG_ATTR } from "@/lib/config";
import { getLanguageByCode } from "@/lib/languages";
import { useTranslationRouting } from "./useTranslationRouting";
import { useUser } from "@/context/UserContext";

import ControlBar from "./ControlBar";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatSidebar from "./ChatSidebar";
import CaptionsSidebar from "./CaptionsSidebar";
import BreakoutSidebar from "./BreakoutSidebar";
import ScreenShareView from "./ScreenShareView";
import OrbitTranslationPanel from "./OrbitTranslationPanel";
import OrbitAISidebar from "./OrbitAISidebar";
import ShareSidebar from "./ShareSidebar";
import HistorySidebar from "./HistorySidebar";
import GalleryView from "./GalleryView";
import { SpeakerIcon, SpeakerOffIcon, ChevronDownIcon, LinkIcon, ShieldCheckIcon, FilmIcon } from "./icons";
import VirtualBackgroundProcessor from "./VirtualBackgroundProcessor";

export default function InCall({
  initialLang,
  onLeave,
}: {
  initialLang: string;
  onLeave: () => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remotes = useRemoteParticipants();
  const { profile } = useUser();
  const [lang, setLang] = useState(initialLang);
  const [translatorMuted, setTranslatorMuted] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<"participants" | "captions" | "translation" | "chat" | "breakout" | "orbit-ai" | "share" | "history" | null>("translation");
  const [speakerMuted, setSpeakerMuted] = useState(true);
  const [headerCopied, setHeaderCopied] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [contentType, setContentType] = useState<"normal" | "movie" | "cinematic_faithful">(
    profile?.content_type || "normal"
  );
  const router = useRouter();

  // Hydration-safe host check: read sessionStorage in useEffect, not in the
  // render body, to prevent SSR/CSR mismatch and host-flag thrash.
  const [isHost, setIsHost] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration pattern
    setIsHost(window.sessionStorage.getItem("orbitHostRoom") === room.name);
  }, [room.name]);

  // Reconnect state — shows a banner when the WebRTC signal connection drops.
  const [isReconnecting, setIsReconnecting] = useState(false);

  useDataChannel("moderate", (msg) => {
    try {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload));
      if (payload.type === "REQUEST_VIDEO" && payload.targetIdentity === localParticipant.identity) {
        if (confirm("The host has requested you to turn on your camera. Turn it on now?")) {
          localParticipant.setCameraEnabled(true);
        }
      }
    } catch {}
  });

  const [reactions, setReactions] = useState<Map<string, { emoji: string; ts: number }>>(new Map());
  const [reactionToasts, setReactionToasts] = useState<Array<{ id: number; emoji: string; from: string }>>([]);
  let toastIdCounter = 0;

  useDataChannel("react", (msg) => {
    try {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload));
      if (payload.emoji && payload.fromId) {
        // Update sidebar badge
        setReactions((prev) => {
          const next = new Map(prev);
          next.set(payload.fromId, { emoji: payload.emoji, ts: Date.now() });
          return next;
        });
        setTimeout(() => {
          setReactions((prev) => {
            const next = new Map(prev);
            next.delete(payload.fromId);
            return next;
          });
        }, 4000);
        // Show floating toast for all participants
        const id = ++toastIdCounter;
        setReactionToasts((prev) => [...prev, { id, emoji: payload.emoji, from: payload.from || payload.fromId }]);
        setTimeout(() => {
          setReactionToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
      }
    } catch {}
  });

  useDataChannel("breakout", (msg) => {
    try {
      const payload = JSON.parse(new TextDecoder().decode(msg.payload));
      if (payload.type === "BREAKOUT_JOIN" && payload.newRoom) {
        // Preserve identity for the new room
        const name = sessionStorage.getItem("lt.displayName") || localParticipant.name || "participant";
        const lang = sessionStorage.getItem("lt.lang") || initialLang;
        sessionStorage.setItem("lt.displayName", name);
        sessionStorage.setItem("lt.lang", lang);
        if (payload.token) {
          // Store pre-generated token for the breakout room
          sessionStorage.setItem("orbit.breakout-token", payload.token);
          sessionStorage.setItem("orbit.breakout-server-url", payload.serverUrl || "");
          // Store the breakout identity so RoomClient uses it instead of generating a new one
          if (payload.breakoutIdentity) {
            sessionStorage.setItem("orbit.breakout-identity", payload.breakoutIdentity);
          }
        }
        alert("You have been assigned to a breakout room. Moving now...");
        router.push(`/session/${payload.newRoom}/room?returnTo=${payload.originalRoom}`);
      } else if (payload.type === "BREAKOUT_END" && payload.originalRoom) {
        const name = sessionStorage.getItem("lt.displayName") || localParticipant.name || "participant";
        const lang = sessionStorage.getItem("lt.lang") || initialLang;
        sessionStorage.setItem("lt.displayName", name);
        sessionStorage.setItem("lt.lang", lang);
        alert("Breakout session ended. Returning to main room...");
        router.push(`/session/${payload.originalRoom}/room`);
      }
    } catch {
      // Ignore non-JSON or unrelated messages
    }
  });

  const toggleSidebar = (sidebar: "participants" | "captions" | "translation" | "chat" | "breakout" | "orbit-ai" | "share" | "history") => {
    setActiveSidebar((current) => (current === sidebar ? null : sidebar));
  };

  // Push the local lang into participant attributes so the agent + peers see
  // it. setAttributes is silently dropped before the room is connected, so we
  // both fire on `lang` change and re-fire when the connection becomes ready.
  // Host status is also broadcast so all participants can identify the host.
  useEffect(() => {
    if (!localParticipant || !room) return;
    const apply = () => {
      console.log("[Orbit] Attempting to set attributes. Room state:", room.state, "Lang:", lang);
      if (room.state === ConnectionState.Connected) {
        // Serialize glossary as JSON string for the agent to read
        const glossaryStr = profile?.glossary?.length
          ? JSON.stringify(profile.glossary)
          : "";
        console.log("[Orbit] Room connected. Setting attributes for", localParticipant.identity);
        localParticipant.setAttributes({
          [PARTICIPANT_LANG_ATTR]: lang,
          orbit_hand: handRaised ? "raised" : "",
          orbit_host: isHost ? "true" : "",
          orbit_glossary: glossaryStr,
          orbit_content_type: contentType,
        });
      } else {
        console.log("[Orbit] Room not connected. Skipping setAttributes.");
      }
    };
    apply();
    room.on(RoomEvent.Connected, apply);
    return () => {
      room.off(RoomEvent.Connected, apply);
    };
  }, [room, localParticipant, lang, handRaised, isHost, profile?.glossary, contentType]);

  // Sync local contentType state from the user profile when it loads/changes
  useEffect(() => {
    if (profile?.content_type) {
      const ct = profile.content_type;
      const timer = setTimeout(() => setContentType(ct), 0);
      return () => clearTimeout(timer);
    }
  }, [profile?.content_type]);

  const applyTranslationRouting = useTranslationRouting(lang, localParticipant.identity, true, true, true, translatorMuted, speakerMuted);

  // ── Reconnect handling: show a banner while reconnecting and re-run
  // translation routing after a successful reconnect to reconcile track
  // subscriptions that may have been lost server-side.
  useEffect(() => {
    if (!room) return;
    const onReconnecting = () => setIsReconnecting(true);
    const onReconnected = () => {
      setIsReconnecting(false);
      // Re-run translation routing now that tracks are re-published.
      applyTranslationRouting.current?.();
    };
    const onDisconnected = () => setIsReconnecting(false);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room, applyTranslationRouting]);

  const humanRemotes = useMemo(
    () => remotes.filter((p) => p.kind !== ParticipantKind.AGENT),
    [remotes],
  );
  const peerLangs = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const p of humanRemotes) {
      map.set(p.identity, p.attributes?.[PARTICIPANT_LANG_ATTR]);
    }
    return map;
  }, [humanRemotes]);

  const langInfo = getLanguageByCode(lang);

  const screenShareTracks = useTracks([Track.Source.ScreenShare]);
  const hasScreenShare = screenShareTracks.length > 0;


  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/session/${room.name}`
    : "";
  const shellClassName = `room-shell${
    activeSidebar ? ` room-shell--sidebar-open room-shell--${activeSidebar}-open` : ""
  }`;

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setHeaderCopied(true);
    setTimeout(() => setHeaderCopied(false), 2000);
  }

  return (
    <div className={shellClassName} data-sidebar={activeSidebar ?? "none"}>
      <div className="room">
        {/* Reconnect banner — shown when the WebRTC signal connection drops */}
        {isReconnecting && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: "rgba(245, 158, 11, 0.95)",
              color: "#fff",
              textAlign: "center",
              padding: "6px 12px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Reconnecting to meeting…
          </div>
        )}
        {/* Top chrome */}
        <header className="orbit-header">
          {/* Desktop Single Line Header */}
          <div className="orbit-topbar-desktop">
            <div className="orbit-topbar-left">
              <span className="orbit-titlebar-title">Orbit Meeting</span>
              <span className="orbit-translation-status orbit-translation-status-text">
                Translation: {langInfo?.name || lang}
              </span>
              <label
                className={`orbit-movie-toggle${contentType !== "normal" ? " active" : ""}${contentType === "cinematic_faithful" ? " faithful" : ""}`}
                title={
                  contentType === "normal"
                    ? "Content mode: Normal — click for Movie"
                    : contentType === "movie"
                    ? "Content mode: Movie dubbing — click for Cinematic Faithful"
                    : "Content mode: Cinematic Faithful — click to reset to Normal"
                }
                onClick={() => {
                  const cycle: Array<"normal" | "movie" | "cinematic_faithful"> = ["normal", "movie", "cinematic_faithful"];
                  const idx = cycle.indexOf(contentType);
                  const next = cycle[(idx + 1) % cycle.length];
                  setContentType(next);
                  localParticipant?.setAttributes({ orbit_content_type: next });
                }}
              >
                <FilmIcon />
                <span>{contentType === "normal" ? "Normal" : contentType === "movie" ? "Movie" : "Faithful"}</span>
              </label>
              <button
                className="orbit-view-btn"
                onClick={() => setTranslatorMuted(!translatorMuted)}
                title={translatorMuted ? "Unmute translator" : "Mute translator"}
                aria-label={translatorMuted ? "Unmute translator" : "Mute translator"}
              >
                {translatorMuted ? <SpeakerOffIcon /> : <SpeakerIcon />}
              </button>
            </div>
            
            <div className="orbit-topbar-right">
              <span className="orbit-room-id">{room.name}</span>
              <button
                className="orbit-copy-btn"
                onClick={copyShareLink}
                title={headerCopied ? "Copied!" : "Copy meeting link"}
                aria-label="Copy meeting link"
              >
                <LinkIcon />
                <span>{headerCopied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Mobile topbar content — hidden on desktop */}
          <div className="orbit-topbar-mobile">
            <button
              className="orbit-mobile-audio"
              aria-label={speakerMuted ? "Unmute speaker" : "Mute speaker"}
              onClick={() => setSpeakerMuted((v) => !v)}
            >
              {speakerMuted ? <SpeakerOffIcon /> : <SpeakerIcon />}
            </button>
            <button
              className="orbit-mobile-brand"
              onClick={() => toggleSidebar("translation")}
              aria-label="Open translation controls"
            >
              <ShieldCheckIcon style={{ color: "#22c55e", strokeWidth: 1.5, width: "18px", height: "18px" }} />
              <span>Orbit</span>
              <ChevronDownIcon />
            </button>
            <button className="orbit-mobile-leave" onClick={async () => { try { await room.disconnect(); } finally { onLeave(); } }}>
              Leave
            </button>
          </div>
        </header>

        {/* Stage */}
        <main className="room-stage orbit-stage">
          <div className="orbit-stage-center">
            {hasScreenShare ? (
              <ScreenShareView
                myLang={lang}
              />
            ) : (
              <GalleryView remotes={humanRemotes} myLang={lang} isHost={isHost} roomName={room.name} />
            )}
          </div>

          {/* Floating reaction toasts */}
          {reactionToasts.length > 0 && (
            <div className="reaction-toast-container">
              {reactionToasts.map((t) => (
                <div key={t.id} className="reaction-toast">
                  <span className="reaction-toast-emoji">{t.emoji}</span>
                  <span className="reaction-toast-name">{t.from}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sidebar Panels */}
          {activeSidebar === "participants" && (
            <ParticipantsPanel 
              localParticipant={localParticipant}
              participants={humanRemotes} 
              myLang={lang} 
              isHost={isHost}
              roomName={room.name}
              onClose={() => setActiveSidebar(null)}
              onToggleChat={() => toggleSidebar("chat")}
              reactions={reactions}
            />
          )}
          {activeSidebar === "captions" && (
            <CaptionsSidebar
              open
              onClose={() => setActiveSidebar(null)}
              myLang={lang}
              peerLangs={peerLangs}
            />
          )}
          {activeSidebar === "translation" && (
            <OrbitTranslationPanel
              onClose={() => setActiveSidebar(null)}
              myLang={lang}
              onLangChange={setLang}
              translatorMuted={translatorMuted}
              onToggleTranslator={() => setTranslatorMuted((v) => !v)}
              peerLangs={peerLangs}
              roomName={room.name}
            />
          )}
          {activeSidebar === "chat" && (
            <ChatSidebar onClose={() => setActiveSidebar(null)} />
          )}
          {activeSidebar === "breakout" && (
            <BreakoutSidebar onClose={() => setActiveSidebar(null)} />
          )}
          {activeSidebar === "orbit-ai" && (
            <OrbitAISidebar onClose={() => setActiveSidebar(null)} />
          )}
          {activeSidebar === "share" && (
            <ShareSidebar onClose={() => setActiveSidebar(null)} />
          )}
          {activeSidebar === "history" && (
            <HistorySidebar onClose={() => setActiveSidebar(null)} roomName={room.name} />
          )}
        </main>

        {/* Control bar */}
        <ControlBar
          onLeave={onLeave}
          activeSidebar={activeSidebar}
          onToggleSidebar={toggleSidebar}
          speakerMuted={speakerMuted}
          onToggleSpeaker={() => setSpeakerMuted((v) => !v)}
          handRaised={handRaised}
          onToggleHand={() => {
            const cur = localParticipant?.attributes?.orbit_hand === "raised";
            setHandRaised(!cur);
            localParticipant?.setAttributes({ orbit_hand: cur ? "" : "raised" });
          }}
        />
      </div>
      <VirtualBackgroundProcessor />
    </div>
  );
}
