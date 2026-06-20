"use client";

import { useState, useRef, useEffect } from "react";
import { MagicWandIcon } from "./icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  id: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "How do I translate a meeting?",
  "How do I share my screen?",
  "What are breakout rooms?",
  "How do I record a meeting?",
];

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm Orbit AI, your meeting assistant. I can help you with Orbit Meeting features like translation, captions, screen sharing, breakout rooms, and more. How can I help you today?",
  id: "welcome",
};

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrbitAISidebar({
  onClose,
}: {
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Send message to Orbit AI ──

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    setInput("");
    setShowSuggestions(false);

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      id: `user-${Date.now()}`,
    };

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      id: `assistant-${Date.now()}`,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/orbit-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ message: text, history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Error: ${err.error || "Failed to get response"}` }
              : m,
          ),
        );
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "Error: No response stream available" }
              : m,
          ),
        );
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.done) continue;
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: m.content + parsed.content }
                    : m,
                ),
              );
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "Error: Connection lost. Please try again." }
            : m,
        ),
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="sidebar-panel oai-sidebar">
      {/* ── Header ── */}
      <div className="oai-header">
        <div className="oai-header-left">
          <div className="oai-header-icon">
            <MagicWandIcon />
          </div>
          <div className="oai-header-info">
            <span className="oai-header-title">Orbit AI</span>
            <span className="oai-header-status">
              <span className="oai-status-dot" />
              CSR Agent
            </span>
          </div>
        </div>
        <button className="oai-header-close" onClick={onClose} aria-label="Close Orbit AI">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="oai-body" ref={bodyRef}>
        <div className="oai-date-divider">
          <span>Today</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`oai-msg oai-msg--${msg.role}`}>
            {msg.role === "assistant" && (
              <div className="oai-avatar oai-avatar--ai">
                <MagicWandIcon />
              </div>
            )}
            <div className="oai-msg-content">
              <div className="oai-bubble">
                {msg.content || (
                  <span className="oai-typing">
                    <span className="oai-dot" />
                    <span className="oai-dot" />
                    <span className="oai-dot" />
                  </span>
                )}
              </div>
              {msg.content && msg.role === "assistant" && (
                <span className="oai-time">{formatTime()}</span>
              )}
            </div>
            {msg.role === "user" && (
              <div className="oai-avatar oai-avatar--user">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* ── Suggestion chips (only on welcome) ── */}
        {showSuggestions && messages.length === 1 && (
          <div className="oai-suggestions">
            <p className="oai-suggestions-label">Try asking:</p>
            <div className="oai-chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="oai-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="oai-input-row">
        <div className="oai-input-wrap">
          <input
            ref={inputRef}
            type="text"
            className="oai-input"
            placeholder="Ask me anything about Orbit Meeting..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Ask Orbit AI"
          />
          <button
            className="oai-send"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
