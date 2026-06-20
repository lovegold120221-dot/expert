"use client";

import { useState, useEffect } from "react";
import { InviteIcon } from "./icons";

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.456 3.474 1.32 4.98L2 22l5.166-1.356a9.92 9.92 0 0 0 4.846 1.258h.004c5.504 0 9.986-4.482 9.986-9.988C22 6.482 17.518 2 12.012 2zm5.782 14.168c-.246.696-1.428 1.374-1.968 1.464-.492.084-1.134.12-1.8.12-2.796 0-5.832-1.638-7.728-4.296-1.122-1.572-1.92-3.468-1.92-5.466 0-1.848.882-2.82 1.698-3.084.246-.084.498-.12.75-.12.246 0 .498.012.678.024.192.012.456-.072.714.54.258.624.882 2.148.96 2.304.078.156.132.336.024.54-.108.204-.204.348-.36.528-.156.18-.324.396-.462.528-.156.156-.324.324-.138.636.18.3.804 1.326 1.722 2.142.924.822 1.704 1.38 2.022 1.542.318.156.498.132.684-.084.186-.216.792-.924.996-1.236.21-.312.414-.258.696-.156.282.102 1.782.84 2.088.996.3.156.504.228.576.36.072.132.072.756-.174 1.452z" />
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.17 14.09l-2.95-1.79v-4.6l2.95 1.79v4.6zm1.17-4.84l-3.42-2.07L12 7.08l3.42 2.06L14.34 11.25zm1.17 4.84l-.01-4.6 2.95-1.79v4.6l-2.94 1.79z" />
    </svg>
  );
}

interface ShareSidebarProps {
  onClose: () => void;
}

export default function ShareSidebar({ onClose }: ShareSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  function getEmailLink() {
    const subject = `Join my Orbit Meeting`;
    const body = `You are invited to join my Orbit Meeting!\n\nMeeting Link: ${url}\n\nSee you there!`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function getGmailLink() {
    const subject = `Join my Orbit Meeting`;
    const body = `You are invited to join my Orbit Meeting!\n\nMeeting Link: ${url}\n\nSee you there!`;
    return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function getWhatsAppLink() {
    const text = `You are invited to join my Orbit Meeting!\n\nMeeting Link: ${url}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }

  function getOutlookLink() {
    const subject = `Join my Orbit Meeting`;
    const body = `You are invited to join my Orbit Meeting!\n\nMeeting Link: ${url}\n\nSee you there!`;
    return `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <span>Invite People</span>
        <button className="sidebar-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="sidebar-body share-sidebar-body">
        <p className="share-sidebar-desc">
          Share the meeting link to invite others.
        </p>

        <div className="invite-dialog-bar">
          <span className="invite-dialog-link" title={url}>{url}</span>
          <button
            type="button"
            className="invite-dialog-copy"
            onClick={copyMeetingLink}
            aria-label={copied ? "Copied" : "Copy meeting link"}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="share-sidebar-divider">
          <span>Or share via</span>
        </div>

        <div className="invite-dialog-share">
          <button
            type="button"
            className="invite-share-btn invite-share-email"
            onClick={() => { window.location.href = getEmailLink(); }}
            title="Share via Email"
            aria-label="Share via Email"
          >
            <MailIcon />
            <span>Email</span>
          </button>
          <button
            type="button"
            className="invite-share-btn invite-share-gmail"
            onClick={() => { window.open(getGmailLink(), "_blank", "noopener,noreferrer"); }}
            title="Share via Gmail"
            aria-label="Share via Gmail"
          >
            <GmailIcon />
            <span>Gmail</span>
          </button>
          <button
            type="button"
            className="invite-share-btn invite-share-whatsapp"
            onClick={() => { window.open(getWhatsAppLink(), "_blank", "noopener,noreferrer"); }}
            title="Share via WhatsApp"
            aria-label="Share via WhatsApp"
          >
            <WhatsAppIcon />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            className="invite-share-btn invite-share-outlook"
            onClick={() => { window.open(getOutlookLink(), "_blank", "noopener,noreferrer"); }}
            title="Share via Outlook"
            aria-label="Share via Outlook"
          >
            <OutlookIcon />
            <span>Outlook</span>
          </button>
        </div>
      </div>
    </div>
  );
}
