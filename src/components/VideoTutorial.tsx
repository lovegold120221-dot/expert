"use client";

import { useState, useEffect, useCallback } from "react";

const TUTORIAL_URL = "https://eburon.ai/tutorial/";

export default function VideoTutorial() {
  const [isOpen, setIsOpen] = useState(false);

  const openPlayer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePlayer = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePlayer();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, closePlayer]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <section className="landing-video-tutorial" id="tutorial">
      <div className="landing-video-inner">
        <div className="landing-section-heading">
          <div>
            <h2>See it in action</h2>
            <p>
              Watch a quick walkthrough of Orbit Meeting&apos;s real-time
              translation in action.
            </p>
          </div>
        </div>

        <button
          className="landing-video-thumb"
          onClick={openPlayer}
          aria-label="Play video tutorial"
          type="button"
        >
          <img
            src="/video-thumbnail.jpg"
            alt="Video tutorial thumbnail"
            className="landing-video-thumb-img"
          />
          <div className="landing-video-play-btn" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      </div>

      {isOpen && (
        <div
          className="landing-video-overlay"
          onClick={closePlayer}
          role="presentation"
        >
          <div
            className="landing-video-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Video player"
          >
            <button
              className="landing-video-close"
              onClick={closePlayer}
              aria-label="Close video"
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <iframe
              src={TUTORIAL_URL}
              className="landing-video-player"
              title="Orbit Meeting Tutorial"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
