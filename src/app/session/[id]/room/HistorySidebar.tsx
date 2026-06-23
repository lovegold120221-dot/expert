"use client";

import { useEffect, useState } from "react";
import { getLanguageByCode } from "@/lib/languages";
import { supabase } from "@/lib/supabase";
import {
  loadHistory,
  downloadRoomHistoryFromSupabase,
  formatTimestamp,
  formatRoomName,
  type TranslationHistoryEntry,
} from "@/lib/translationHistory";

interface HistorySidebarProps {
  onClose: () => void;
  roomName: string;
}

type ChatHistoryRow = {
  id: string;
  meeting_id: string;
  user_id: string | null;
  sender_name: string | null;
  message: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | string | null;
  attachment_url: string | null;
  created_at: string;
};

type HistoryTimelineEntry =
  | ({ kind: "translation" } & TranslationHistoryEntry)
  | {
      kind: "chat";
      id: string;
      room_name: string;
      from: string;
      from_id: string;
      message: string;
      attachment_name?: string;
      attachment_type?: string;
      attachment_url?: string;
      attachment_size?: number;
      created_at: string;
    };

export default function HistorySidebar({
  onClose,
  roomName,
}: HistorySidebarProps) {
  const [entries, setEntries] = useState<HistoryTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const merged: HistoryTimelineEntry[] = [];
      const seen = new Set<string>();
      const pushTranslation = (entry: TranslationHistoryEntry) => {
        const key = `translation:${entry.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push({ kind: "translation", ...entry });
      };
      const pushChat = (row: ChatHistoryRow) => {
        const key = `chat:${row.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push({
          kind: "chat",
          id: row.id,
          room_name: row.meeting_id,
          from: row.sender_name || row.user_id || "Unknown",
          from_id: row.user_id || "",
          message: row.message || "",
          attachment_name: row.attachment_name || undefined,
          attachment_type: row.attachment_type || undefined,
          attachment_url: row.attachment_url || undefined,
          attachment_size:
            row.attachment_size === null || row.attachment_size === undefined
              ? undefined
              : Number(row.attachment_size),
          created_at: row.created_at,
        });
      };

      loadHistory()
        .filter((entry) => entry.room_name === roomName)
        .forEach(pushTranslation);

      try {
        const [remoteTranslations, remoteChats] = await Promise.all([
          downloadRoomHistoryFromSupabase(roomName),
          supabase
            .from("chat_messages")
            .select("*")
            .eq("meeting_id", roomName)
            .order("created_at", { ascending: false }),
        ]);

        remoteTranslations.forEach(pushTranslation);

        if (!remoteChats.error && Array.isArray(remoteChats.data)) {
          (remoteChats.data as ChatHistoryRow[]).forEach(pushChat);
        }
      } catch (error) {
        console.error("Failed to load room history:", error);
      }

      merged.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      if (!cancelled) {
        setEntries(merged);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [roomName]);

  const q = searchQuery.trim().toLowerCase();
  const filteredEntries = q
    ? entries.filter((entry) => {
        if (entry.kind === "translation") {
          return (
            entry.source_text.toLowerCase().includes(q) ||
            entry.translated_text.toLowerCase().includes(q) ||
            entry.speaker_name.toLowerCase().includes(q)
          );
        }

        return (
          entry.from.toLowerCase().includes(q) ||
          entry.message.toLowerCase().includes(q) ||
          entry.attachment_name?.toLowerCase().includes(q) ||
          false
        );
      })
    : entries;

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header history-sidebar-header">
        <div className="history-sidebar-header-copy">
          <span>Meeting History</span>
          <span className="history-sidebar-room-name">
            {formatRoomName(roomName)}
          </span>
          <span className="history-sidebar-room-id">Room ID: {roomName}</span>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="sidebar-body history-sidebar-body">
        <div className="history-sidebar-search">
          <svg
            className="history-search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="history-search-input"
            placeholder="Search room history…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="history-sidebar-status">
            <div className="history-spinner" />
            <p>Loading history…</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="history-sidebar-empty">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="status-title">No entries found</p>
            <p className="status-desc">
              Translations and chat messages for this room will appear here
              automatically.
            </p>
          </div>
        ) : (
          <div className="history-sidebar-list">
            {filteredEntries.map((entry) => {
              if (entry.kind === "translation") {
                const srcLang = getLanguageByCode(entry.source_lang);
                const tgtLang = getLanguageByCode(entry.target_lang);

                return (
                  <div
                    key={`translation:${entry.id}`}
                    className="history-sidebar-item"
                  >
                    <div className="history-item-meta">
                      <span className="history-item-speaker">
                        {entry.speaker_name}
                      </span>
                      <span className="history-item-langs">
                        {srcLang?.flag || ""} → {tgtLang?.flag || ""}
                      </span>
                      <span className="history-item-time">
                        {formatTimestamp(entry.created_at)}
                      </span>
                    </div>
                    <div className="history-item-texts">
                      <p className="history-item-source">
                        <strong>{entry.speaker_name}:</strong> {entry.source_text}
                      </p>
                      <p className="history-item-translated">
                        <strong>Orbit:</strong> {entry.translated_text}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`chat:${entry.id}`}
                  className="history-sidebar-item history-sidebar-item--chat"
                >
                  <div className="history-item-meta">
                    <span className="history-item-speaker">{entry.from}</span>
                    <span className="history-item-tag">Chat</span>
                    <span className="history-item-time">
                      {formatTimestamp(entry.created_at)}
                    </span>
                  </div>
                  <div className="history-item-texts">
                    {entry.message ? (
                      <p className="history-item-source">{entry.message}</p>
                    ) : null}
                    {entry.attachment_name ? (
                      <p className="history-item-translated history-item-attachment">
                        Attachment: {entry.attachment_name}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
