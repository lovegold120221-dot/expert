"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import "@livekit/components-styles";
import PersistentCallBar from "@/components/PersistentCallBar";
import { useUser } from "@/context/UserContext";

export interface ActiveCallState {
  token: string;
  serverUrl: string;
  sessionId: string;
  initialLang: string;
}

interface CallContextValue {
  activeCall: ActiveCallState | null;
  setActiveCall: (call: ActiveCallState | null) => void;
  leaveCall: () => void;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

function CallProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { profile } = useUser();
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);

  const leaveCall = () => {
    setActiveCall(null);
    router.push("/dashboard");
  };

  // Get speaker device ID from profile for audio output (enables proper AEC)
  const speakerDeviceId = profile?.speaker_device_id;

  return (
    <CallContext.Provider value={{ activeCall, setActiveCall, leaveCall }}>
      {activeCall ? (
        <LiveKitRoom
          token={activeCall.token}
          serverUrl={activeCall.serverUrl}
          video={false}
          audio={false}
          connect={true}
          options={{
            audioOutput: speakerDeviceId ? { deviceId: speakerDeviceId } : undefined,
          }}
          onDisconnected={() => {
            setActiveCall(null);
          }}
          data-lk-theme="default"
        >
          {children}
          <RoomAudioRenderer />
          <StartAudio
            label="🔊 Tap to enable translated audio"
            className="btn start-audio-fixed"
          />
          <PersistentCallBar sessionId={activeCall.sessionId} onLeave={leaveCall} />
        </LiveKitRoom>
      ) : (
        children
      )}
    </CallContext.Provider>
  );
}

export function CallProvider({ children }: { children: ReactNode }) {
  // Ensure UserProvider is available
  const { loading } = useUser();

  if (loading) {
    return <>{children}</>;
  }

  return <CallProviderInner>{children}</CallProviderInner>;
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return context;
}
