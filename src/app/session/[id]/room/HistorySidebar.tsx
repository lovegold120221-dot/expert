"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getLanguageByCode } from "@/lib/languages";
import { supabase } from "@/lib/supabase";
import {
  loadHistory,
  formatTimestamp,
  type TranslationHistoryEntry,
} from "@/lib/translationHistory";

interface HistorySidebarProps {
  onClose: () => void;
  roomName: string;
}

export default function HistorySidebar({ onClose, roomName }: HistorySidebarProps) {
  const { profile, loading: profileLoading } = useUser();
  const [entries, setEntries] = useState<TranslationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      // 1. Load from localStorage first (filtered by roomName)
      const local = loadHistory().filter((e) => e.room_name === roomName);
      const merged = [...local];

      // 2. Try to fetch remote entries from Supabase filtered by user and roomName
      if (profile?.id) {
        try {
          const { data } = await supabase
            .from("translation_history")
            .select("*")
            .eq("user_id", profile.id)
            .eq("room_name", roomName)
            .order("created_at", { ascending: false });

          if (data && Array.isArray(data)) {
            // Merge remote entries with local, deduplicating by id
            const seen = new Set(merged.map((e) => e.id));
            for (const entry of data as TranslationHistoryEntry[]) {
              if (!seen.has(entry.id)) {
                merged.push(entry);
                seen.add(entry.id);
              }
            }
          }
        } catch {
          // Table may not exist or offline
        }
      }

      // Sort newest first
      merged.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEntries(merged);
      setLoading(false);
    }

    if (!profileLoading) {
      load();
    }
  }, [profile, profileLoading, roomName]);

  // Filter by search query
  const filteredEntries = searchQuery
    ? entries.filter(
        (e) =>
          e.source_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.translated_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.speaker_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <span>Meeting History</span>
        <button className="sidebar-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="sidebar-body history-sidebar-body">
        {/* Search row */}
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
            placeholder="Search meeting log…"
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
              Finalized translations for this meeting will be saved here automatically.
            </p>
          </div>
        ) : (
          <div className="history-sidebar-list">
            {filteredEntries.map((entry) => {
              const srcLang = getLanguageByCode(entry.source_lang);
              const tgtLang = getLanguageByCode(entry.target_lang);

              return (
                <div key={entry.id} className="history-sidebar-item">
                  <div className="history-item-meta">
                    <span className="history-item-speaker">{entry.speaker_name}</span>
                    <span className="history-item-langs">
                      {srcLang?.flag || ""} → {tgtLang?.flag || ""}
                    </span>
                    <span className="history-item-time">{formatTimestamp(entry.created_at)}</span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
