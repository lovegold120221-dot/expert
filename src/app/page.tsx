/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Orbit Meeting | Real-Time AI Voice Translation",
  description:
    "Real-time AI voice translation for video meetings. Translation spins up on demand across 240+ languages.",
};

const SIGNUP_PATH = "/auth/signup";
const LOGIN_PATH = "/auth/login";

const featureCards: Array<{
  title: string;
  body: string;
  icon?: ReactNode;
  image?: string;
  imageAlt?: string;
  wide?: boolean;
}> = [
  {
    title: "240+ Languages",
    body: "Pick your native language from the world's most comprehensive list. You speak yours, they hear theirs. It's that simple.",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1500&auto=format&fit=crop",
    imageAlt: "Global Network",
    wide: true,
  },
  {
    title: "Faithful Vocal Mimic",
    body: "Preserves the original speaker's speed, rhythm, pitch contour, and emotion perfectly.",
    icon: <VideoIcon />,
  },
  {
    title: "40 Participants per Room",
    body: "Host large global meetings natively with breakout rooms and host moderation.",
    icon: <ParticipantsIcon />,
  },
  {
    title: "Cross-Platform Access",
    body: "Join from the Web, install the PWA, or download our native Electron desktop app (macOS/Windows/Linux) and Android APK.",
    image:
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=1500&auto=format&fit=crop",
    imageAlt: "Multiple Devices",
    wide: true,
  },
  {
    title: "Screen Share Audio",
    body: "Sharing a video? The agent automatically ducks the original audio and translates the content.",
    icon: <ScreenIcon />,
  },
  {
    title: "Zero Translation Cost",
    body: "Smart routing ensures same-language pairs bypass Gemini API entirely.",
    icon: <ShieldIcon />,
  },
];

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    alt: "Team meeting",
  },
  {
    src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop",
    alt: "Business collaboration",
  },
  {
    src: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800&auto=format&fit=crop",
    alt: "Modern workspace",
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-glow" aria-hidden="true" />

      <nav className="landing-nav" aria-label="Primary">
        <Link href="/" className="landing-brand">
          <img
            src="https://eburon.ai/icon-eburon.svg"
            alt="Eburon AI Logo"
            className="landing-brand-logo"
          />
          <span>Orbit Meeting</span>
        </Link>

        <div className="landing-nav-links">
          <a href="#features">Platform</a>
          <a href="#architecture">Architecture</a>
          <a href="https://eburon.ai" target="_blank" rel="noreferrer">
            Eburon AI
          </a>
        </div>

        <Link href={SIGNUP_PATH} className="landing-cta landing-cta--small">
          Get Started
        </Link>
      </nav>

      <header className="landing-hero">
        <div className="landing-kicker">
          <span aria-hidden="true" />
          Powered by Gemini Live
        </div>

        <h1>
          Speak your language.
          <br />
          <span>Hear theirs.</span>
        </h1>

        <p>
          Real-time AI voice translation for video meetings. Translation spins
          up on demand across 240+ languages. Same-language pairs cost nothing.
        </p>

        <div className="landing-hero-actions">
          <Link href={SIGNUP_PATH} className="landing-cta">
            Start a Meeting
          </Link>
          <a href="#architecture" className="landing-secondary">
            View Architecture
          </a>
        </div>

        <div className="landing-hero-visual">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000&auto=format&fit=crop"
            alt="Digital Network Matrix"
          />
          <div className="landing-live-card">
            <div className="landing-lang-badge">EN</div>
            <div>
              <strong>Live Translation Active</strong>
              <span>Routing voice streams...</span>
            </div>
            <div className="landing-wave" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </header>

      <section className="landing-feature-band" id="features">
        <div className="landing-feature-inner">
          <div className="landing-section-heading">
            <div>
              <h2>Engineered for global scale</h2>
              <p>
                A robust architecture combining low-latency edge networks with
                advanced vocal translation models.
              </p>
            </div>
          </div>

          <div className="landing-feature-grid">
            {featureCards.map((feature) => (
              <article
                className={`landing-feature-card${
                  feature.wide ? " landing-feature-card--wide" : ""
                }`}
                key={feature.title}
              >
                {feature.image ? (
                  <img
                    src={feature.image}
                    alt={feature.imageAlt ?? ""}
                    className="landing-feature-img"
                  />
                ) : (
                  <div className="landing-feature-icon" aria-hidden="true">
                    {feature.icon}
                  </div>
                )}
                <div className="landing-feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-architecture" id="architecture">
        <div className="landing-flow" aria-label="Translation flow">
          <FlowNode lang="EN" name="Beatrice" detail="Speaking English" />
          <div className="landing-flow-line" aria-hidden="true" />
          <div className="landing-agent-node">
            <span>Orbit Agent</span>
            <AgentIcon />
            <strong>Real-time Translation</strong>
            <small>Low-latency vocal rendering</small>
          </div>
          <div className="landing-flow-line" aria-hidden="true" />
          <FlowNode lang="ES" name="Bob" detail="Hearing Spanish" />
        </div>

        <div className="landing-copy">
          <h2>Sovereign control. Zero lock-in.</h2>
          <p>
            Designed for developers and enterprise teams. Self-host the entire
            Orbit Meeting stack on your own infrastructure — no dependency on
            cloud providers. Maintain complete data privacy while leveraging
            cutting-edge voice intelligence.
          </p>
          <ul>
            <li>Supabase auth with secure data persistence</li>
            <li>Dockerized Python worker agents</li>
            <li>Open-source WebRTC Server compatible</li>
          </ul>
        </div>
      </section>

      <section className="landing-gallery" aria-label="Orbit Meeting showcase">
        {galleryImages.map((image, index) => (
          <div
            className={`landing-gallery-item${
              index !== 1 ? " landing-gallery-item--side" : ""
            }`}
            key={image.alt}
          >
            <img src={image.src} alt={image.alt} />
          </div>
        ))}
      </section>

      <section className="landing-bottom-cta">
        <h2>Ready to break the language barrier?</h2>
        <p>
          Join a room instantly or create a free account to persist your
          settings, virtual backgrounds, and recording preferences.
        </p>
        <Link href={SIGNUP_PATH} className="landing-cta landing-cta--large">
          Create Free Account
        </Link>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="landing-footer-brand">
          <img
            src="https://eburon.ai/icon-eburon.svg"
            alt="Eburon AI Logo"
          />
          <span>Orbit Meeting</span>
        </Link>

        <p>
          Proudly built by{" "}
          <a href="https://eburon.ai" target="_blank" rel="noreferrer">
            Eburon AI
          </a>{" "}
          — founded by Joe Lernout.
        </p>

        <div>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <Link href={LOGIN_PATH}>Login</Link>
        </div>
      </footer>
    </main>
  );
}

function FlowNode({
  lang,
  name,
  detail,
}: {
  lang: string;
  name: string;
  detail: string;
}) {
  return (
    <div className="landing-flow-node">
      <span>{lang}</span>
      <strong>{name}</strong>
      <small>{detail}</small>
    </div>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14" />
      <path d="M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function ParticipantsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 4.354a4 4 0 1 1 0 5.292" />
      <path d="M15 21H3v-1a6 6 0 0 1 12 0v1Zm0 0h6v-1a6 6 0 0 0-9-5.197" />
      <path d="M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.75 17 9 20l-1 1h8l-1-1-.75-3" />
      <path d="M3 13h18" />
      <path d="M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m9 12 2 2 4-4" />
      <path d="M20.618 5.984A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016Z" />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19.428 15.428a2 2 0 0 0-1.022-.547l-2.387-.477a6 6 0 0 0-3.86.517l-.318.158a6 6 0 0 1-3.86.517L6.05 15.21a2 2 0 0 0-1.806.547" />
      <path d="M8 4h8l-1 1v5.172a2 2 0 0 0 .586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 0 0 9 10.172V5L8 4Z" />
    </svg>
  );
}
