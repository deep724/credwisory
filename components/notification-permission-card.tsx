"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Versioned keys intentionally ignore stale settings written by the retired popup implementation.
const NOTIFICATION_PREFERENCE_KEY = "cw-notification-preference-v2";
const NOTIFICATION_SESSION_KEY = "cw-notification-card-seen-v2";
const GUIDANCE_COOLDOWN_KEY = "cw-guidance-cooldown-v2";
const GUIDANCE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SMALL_POPUP_DELAY_MS = 5_000;
const GUIDANCE_POPUP_DELAY_MS = 8_000;

function readStorage(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* Storage is optional. */ }
}
function isForceMode() {
  return process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).get("forcePopups") === "1";
}
function isExcludedPath(pathname: string) {
  return pathname.startsWith("/admin") || /^(?:\/contact|\/apply|\/eligibility)/.test(pathname);
}

export function NotificationPermissionCard() {
  const pathname = usePathname();
  const started = useRef(false);
  const guidanceTimer = useRef<number | null>(null);
  const [showNotificationCard, setShowNotificationCard] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    if (isExcludedPath(pathname) || started.current) return;
    const forceMode = isForceMode();
    let seenThisSession = false;
    try { seenThisSession = window.sessionStorage.getItem(NOTIFICATION_SESSION_KEY) === "1"; } catch { /* no-op */ }
    if (!forceMode && (readStorage(NOTIFICATION_PREFERENCE_KEY) || seenThisSession)) return;
    const timer = window.setTimeout(() => {
      // It is only marked as seen at the moment it becomes visible.
      started.current = true;
      setShowNotificationCard(true);
    }, forceMode ? 0 : SMALL_POPUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => () => {
    if (guidanceTimer.current !== null) window.clearTimeout(guidanceTimer.current);
  }, []);

  function showGuidanceAfterNotification() {
    setShowNotificationCard(false);
    try { window.sessionStorage.setItem(NOTIFICATION_SESSION_KEY, "1"); } catch { /* no-op */ }
    const forceMode = isForceMode();
    const cooldownUntil = Number(readStorage(GUIDANCE_COOLDOWN_KEY) || "0");
    if (isExcludedPath(pathname) || (!forceMode && Date.now() < cooldownUntil)) return;
    guidanceTimer.current = window.setTimeout(() => setShowGuidanceModal(true), forceMode ? 0 : GUIDANCE_POPUP_DELAY_MS);
  }

  function dismissNotification() {
    writeStorage(NOTIFICATION_PREFERENCE_KEY, "dismissed");
    showGuidanceAfterNotification();
  }
  async function requestNotifications() {
    let permission: NotificationPermission | "unsupported" = "unsupported";
    try { if ("Notification" in window) permission = await window.Notification.requestPermission(); } catch { /* no-op */ }
    writeStorage(NOTIFICATION_PREFERENCE_KEY, permission);
    if (permission === "granted") {
      setNotificationEnabled(true);
      window.setTimeout(() => setNotificationEnabled(false), 3_000);
    }
    showGuidanceAfterNotification();
  }
  function dismissGuidance() {
    writeStorage(GUIDANCE_COOLDOWN_KEY, String(Date.now() + GUIDANCE_COOLDOWN_MS));
    setShowGuidanceModal(false);
  }

  if (pathname.startsWith("/admin")) return null;
  return <>
    {showNotificationCard ? <aside className="cw-notify-card" role="dialog" aria-labelledby="cw-notify-title">
      <button className="cw-notify-close" type="button" aria-label="Close notification invitation" onClick={dismissNotification}>×</button>
      <span className="cw-notify-icon" aria-hidden="true">⌁</span>
      <div><h2 id="cw-notify-title">Stay updated on education loans</h2><p>Get important loan, lender, scholarship, and application updates from Credwisory.</p><div>
        <button className="cw-notify-later" type="button" onClick={dismissNotification}>Not now</button>
        <button className="cw-notify-allow" type="button" onClick={() => void requestNotifications()}>Allow notifications</button>
      </div></div>
    </aside> : null}
    {showGuidanceModal ? <GuidanceModal onClose={dismissGuidance} /> : null}
    {notificationEnabled ? <p className="cw-notify-toast" role="status">Notifications enabled.</p> : null}
  </>;
}

function GuidanceModal({ onClose }: { onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        kind: "CONTACT", name: form.get("name"), email: form.get("email"), mobile: form.get("mobile"), sourcePage: window.location.pathname,
        payload: { contactConsent: true, loanPurpose: "education_loan" },
      }) });
      if (!response.ok) throw new Error("Lead request failed");
      writeStorage(GUIDANCE_COOLDOWN_KEY, String(Date.now() + GUIDANCE_COOLDOWN_MS));
      setSuccess(true);
    } catch { setError("We could not submit your request. Please try again."); } finally { setSubmitting(false); }
  }
  return <div className="cw-guide-backdrop"><section className="cw-guide-modal" role="dialog" aria-modal="true" aria-labelledby="cw-guide-title">
    <button ref={closeButtonRef} className="cw-notify-close" type="button" aria-label="Close guidance form" onClick={onClose}>×</button>
    <aside><p>EDUCATION LOAN GUIDANCE</p><h2>Make your next step clearer.</h2><ul><li>Compare lender options</li><li>Understand eligibility</li><li>Get expert support</li></ul></aside>
    <form onSubmit={submit} noValidate>{success ? <div><h2 id="cw-guide-title">We&apos;ll be in touch shortly.</h2><button type="button" onClick={onClose}>Close</button></div> : <>
      <h2 id="cw-guide-title">Get expert guidance</h2>
      <label>Full name<input name="name" required minLength={2} autoComplete="name" /></label>
      <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
      <label>Mobile number<input name="mobile" inputMode="numeric" pattern="[6-9][0-9]{9}" required autoComplete="tel" /></label>
      <label className="cw-guide-consent"><input type="checkbox" required />I agree to be contacted.</label>
      {error ? <p className="cw-guide-error" role="alert">{error}</p> : null}
      <button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Get expert guidance →"}</button>
    </>}</form>
  </section></div>;
}
