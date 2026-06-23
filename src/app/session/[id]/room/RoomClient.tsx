"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCallContext } from "@/context/CallContext";
import InCall from "./InCall";

const STORAGE_KEY_NAME = "lt.displayName";
const STORAGE_KEY_LANG = "lt.lang";

// Refresh the token 5 minutes before it expires to avoid the 4h cliff.
const TOKEN_REFRESH_MARGIN_SEC = 5 * 60;

interface TokenResponse {
  token: string;
  serverUrl: string;
}

/**
 * Decode the `exp` field from a JWT without a library.
 * Returns the expiry in seconds-since-epoch, or null if unparseable.
 */
function getTokenExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    // browser atob + URI-decode the payload
    const payload = JSON.parse(
      decodeURIComponent(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      ),
    );
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export default function RoomClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { activeCall, setActiveCall, leaveCall } = useCallContext();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydration-safe state: initialize with SSR-safe defaults, then read the
  // real values from sessionStorage in a useEffect. This prevents SSR/CSR
  // mismatch warnings and the host-flag/language-attribute thrash that
  // occurs when useState initializers read browser-only storage.
  const [identity, setIdentity] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [initialLang, setInitialLang] = useState<string>("en");
  const [hydrated, setHydrated] = useState(false);

  // Read sessionStorage inside useEffect (never in useState initializers).
  // The synchronous setState calls are intentional — this is the
  // hydration-safe pattern mandated by AGENTS.md. The React 19 compiler
  // warns about cascading renders, but this runs once on mount and the
  // component renders a loading spinner until `hydrated` is true.
  /* eslint-disable react-hooks/set-state-in-effect -- intentional hydration pattern */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // For breakout rooms: use the pre-generated identity.
    const breakoutIdentity = window.sessionStorage.getItem("orbit.breakout-identity");
    if (breakoutIdentity) {
      setIdentity(breakoutIdentity);
    } else {
      // Guard crypto.randomUUID for older WebViews (Capacitor Android).
      const uuid =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      setIdentity(`peer-${uuid.slice(0, 8)}`);
    }

    setDisplayName(window.sessionStorage.getItem(STORAGE_KEY_NAME) ?? "");
    setInitialLang(window.sessionStorage.getItem(STORAGE_KEY_LANG) ?? "en");
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Pull name + lang chosen in the pre-flight screen. If missing, send the
  // user back to the pre-flight so they can pick.
  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    const name = window.sessionStorage.getItem(STORAGE_KEY_NAME);
    const lang = window.sessionStorage.getItem(STORAGE_KEY_LANG);
    if (!name || !lang) {
      router.replace(`/session/${sessionId}`);
    }
  }, [router, sessionId, hydrated]);

  // Mint a LiveKit token. For breakout rooms, use pre-generated token if available.
  /* eslint-disable react-hooks/set-state-in-effect -- synchronous setState for breakout/reuse paths is intentional */
  useEffect(() => {
    if (!hydrated || !identity || !displayName) return;

    // Check if this is a breakout room with a pre-generated token
    const breakoutToken = typeof window !== 'undefined' ? window.sessionStorage.getItem("orbit.breakout-token") : null;
    const breakoutUrl = typeof window !== 'undefined' ? window.sessionStorage.getItem("orbit.breakout-server-url") : null;

    if (breakoutToken && breakoutUrl) {
      setToken(breakoutToken);
      setServerUrl(breakoutUrl);
      // Clean up so reconnects use normal flow
      window.sessionStorage.removeItem("orbit.breakout-token");
      window.sessionStorage.removeItem("orbit.breakout-server-url");
      return;
    }

    const isHost = typeof window !== 'undefined' && window.sessionStorage.getItem("orbitHostRoom") === sessionId;
    
    // If we are already connected to this session, reuse the context
    if (activeCall && activeCall.sessionId === sessionId) {
      setToken(activeCall.token);
      setServerUrl(activeCall.serverUrl);
      return;
    }

    const url = `/api/token?room=${encodeURIComponent(
      sessionId,
    )}&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(displayName)}${isHost ? '&host=true' : ''}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Token request failed (${res.status})`);
        }
        return res.json() as Promise<TokenResponse>;
      })
      .then((data) => {
        setToken(data.token);
        setServerUrl(data.serverUrl);
        setActiveCall({
          token: data.token,
          serverUrl: data.serverUrl,
          sessionId,
          initialLang
        });
      })
      .catch((err) => setError(err.message));
  }, [sessionId, identity, displayName, hydrated, activeCall, initialLang, setActiveCall]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Token refresh: re-mint before the 4h TTL expires so long meetings
  // don't get kicked. Decodes the JWT exp and schedules a refresh.
  useEffect(() => {
    if (!token || !sessionId || !identity || !displayName) return;

    const exp = getTokenExp(token);
    if (!exp) return; // can't parse — nothing to schedule

    const nowSec = Math.floor(Date.now() / 1000);
    const refreshInSec = Math.max(exp - nowSec - TOKEN_REFRESH_MARGIN_SEC, 30);

    const timeoutId = setTimeout(async () => {
      const isHost = typeof window !== 'undefined' && window.sessionStorage.getItem("orbitHostRoom") === sessionId;
      const url = `/api/token?room=${encodeURIComponent(
        sessionId,
      )}&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(displayName)}${isHost ? '&host=true' : ''}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json() as TokenResponse;
        // Update the context — LiveKitRoom will reconnect with the fresh token.
        setActiveCall({
          token: data.token,
          serverUrl: data.serverUrl,
          sessionId,
          initialLang,
        });
        setToken(data.token);
        setServerUrl(data.serverUrl);
      } catch {
        // If refresh fails, the room will disconnect on expiry and the
        // onDisconnected handler in CallContext will navigate to dashboard.
      }
    }, refreshInSec * 1000);

    return () => clearTimeout(timeoutId);
  }, [token, sessionId, identity, displayName, initialLang, setActiveCall]);

  function handleLeave() {
    leaveCall();
  }

  if (error) {
    return (
      <div className="page text-center">
        <div className="container">
          <h1 className="display display-md mb-16">
            Couldn&apos;t join the call
          </h1>
          <p className="body mb-24">
            {error}
          </p>
          <button className="btn btn-outline" onClick={() => router.push("/dashboard")}>
            Back to meetings
          </button>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="page text-center">
        <div className="container">
          <div className="spinner mx-auto mb-16" />
          <p className="mono">Connecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-100vh bg-bg">
      <InCall initialLang={initialLang} onLeave={handleLeave} />
    </div>
  );
}
