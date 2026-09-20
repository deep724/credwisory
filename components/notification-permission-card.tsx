"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const NOTIFICATION_PREFERENCE_KEY = "cw-notification-preference-v2";
const NOTIFICATION_SESSION_KEY = "cw-notification-card-seen-v2";
const GUIDANCE_COOLDOWN_KEY = "cw-guidance-cooldown-v3";
const GUIDANCE_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const NOTIFICATION_DELAY_MS = 5_000;
const GUIDANCE_DELAY_MS = 2_500;

function readFunctionalStorage(key: string) {
  try { return window.localStorage.getItem(key); } catch { /* Functional storage can be unavailable. */ }
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}
function writeFunctionalStorage(key: string, value: string) {
  try { window.localStorage.setItem(key, value); return; } catch { /* Fall back to this browser session only. */ }
  try { window.sessionStorage.setItem(key, value); } catch { /* Storage is optional. */ }
}
function isForceMode() {
  return process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).get("forcePopups") === "1";
}
function isNotificationExcluded(pathname: string) {
  return pathname.startsWith("/admin") || /^(?:\/contact|\/apply|\/eligibility)/.test(pathname);
}
function isGuidanceLandingPage(pathname: string) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/contact") || pathname.startsWith("/apply") || pathname === "/eligibility") return false;
  return true;
}
function isGuidanceTrigger(element: HTMLElement) {
  if (element.closest("[data-guidance-trigger]")) return true;
  const link = element.closest<HTMLAnchorElement>("a[href]");
  if (link) {
    const href = link.getAttribute("href") || "";
    return /(?:^|\/)(?:eligibility|talk-to-an-expert)(?:[/?#.]|$)/i.test(href) || /\/contact#talk-to-expert/i.test(href);
  }
  return element instanceof HTMLButtonElement && !element.form && /^(?:talk to an expert|talk to expert|check eligibility)$/i.test(element.textContent?.trim() || "");
}

export function NotificationPermissionCard() {
  const pathname = usePathname();
  const notificationStarted = useRef(false);
  const autoShownPaths = useRef(new Set<string>());
  const triggerRef = useRef<HTMLElement | null>(null);
  const [showNotificationCard, setShowNotificationCard] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    if (isNotificationExcluded(pathname) || notificationStarted.current) return;
    const forceMode = isForceMode();
    let seenThisSession = false;
    try { seenThisSession = window.sessionStorage.getItem(NOTIFICATION_SESSION_KEY) === "1"; } catch { /* no-op */ }
    if (!forceMode && (readFunctionalStorage(NOTIFICATION_PREFERENCE_KEY) || seenThisSession)) return;
    const timer = window.setTimeout(() => {
      notificationStarted.current = true;
      setShowNotificationCard(true);
    }, forceMode ? 0 : NOTIFICATION_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!isGuidanceLandingPage(pathname) || autoShownPaths.current.has(pathname)) return;
    const forceMode = isForceMode();
    const cooldownUntil = Number(readFunctionalStorage(GUIDANCE_COOLDOWN_KEY) || "0");
    if (!forceMode && Date.now() < cooldownUntil) return;
    const timer = window.setTimeout(() => {
      autoShownPaths.current.add(pathname);
      triggerRef.current = null;
      setShowGuidanceModal(true);
    }, forceMode ? 0 : GUIDANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const openFromTrigger = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-guidance-trigger], a[href], button");
      if (!target || !isGuidanceTrigger(target)) return;
      event.preventDefault();
      triggerRef.current = target;
      setShowGuidanceModal(true);
    };
    document.addEventListener("click", openFromTrigger, true);
    return () => document.removeEventListener("click", openFromTrigger, true);
  }, []);

  const closeGuidance = () => {
    setShowGuidanceModal(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };
  const dismissGuidanceForFourHours = () => {
    writeFunctionalStorage(GUIDANCE_COOLDOWN_KEY, String(Date.now() + GUIDANCE_COOLDOWN_MS));
    closeGuidance();
  };
  const dismissNotification = () => {
    writeFunctionalStorage(NOTIFICATION_PREFERENCE_KEY, "dismissed");
    try { window.sessionStorage.setItem(NOTIFICATION_SESSION_KEY, "1"); } catch { /* no-op */ }
    setShowNotificationCard(false);
  };
  const requestNotifications = async () => {
    let permission: NotificationPermission | "unsupported" = "unsupported";
    try { if ("Notification" in window) permission = await window.Notification.requestPermission(); } catch { /* no-op */ }
    writeFunctionalStorage(NOTIFICATION_PREFERENCE_KEY, permission);
    setShowNotificationCard(false);
    if (permission === "granted") {
      setNotificationEnabled(true);
      window.setTimeout(() => setNotificationEnabled(false), 3_000);
    }
  };

  if (pathname.startsWith("/admin")) return null;
  return <>
    {showNotificationCard && !showGuidanceModal ? <aside className="cw-notify-card" role="dialog" aria-labelledby="cw-notify-title">
      <button className="cw-notify-close" type="button" aria-label="Close notification invitation" onClick={dismissNotification}>×</button>
      <span className="cw-notify-icon" aria-hidden="true">⌁</span>
      <div><h2 id="cw-notify-title">Stay updated on education loans</h2><p>Get important loan, lender, scholarship, and application updates from Credwisory.</p><div>
        <button className="cw-notify-later" type="button" onClick={dismissNotification}>Not now</button>
        <button className="cw-notify-allow" type="button" onClick={() => void requestNotifications()}>Allow notifications</button>
      </div></div>
    </aside> : null}
    {showGuidanceModal ? <GuidanceModal onClose={closeGuidance} onDismissForFourHours={dismissGuidanceForFourHours} /> : null}
    {notificationEnabled ? <p className="cw-notify-toast" role="status">Notifications enabled.</p> : null}
  </>;
}

function GuidanceModal({ onClose, onDismissForFourHours }: { onClose: () => void; onDismissForFourHours: () => void }) {
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !modalRef.current) return;
      const controls = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')).filter((element) => element.offsetParent !== null);
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [onClose]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !event.currentTarget.checkValidity()) { event.currentTarget.reportValidity(); return; }
    setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        kind: "CONTACT", name: form.get("name"), email: form.get("email"), mobile: form.get("mobile"), sourcePage: window.location.pathname,
        payload: { contactConsent: true, loanPurpose: "education_loan" },
      }) });
      if (!response.ok) throw new Error("Lead request failed");
      writeFunctionalStorage(GUIDANCE_COOLDOWN_KEY, String(Date.now() + GUIDANCE_COOLDOWN_MS));
      setSuccess(true);
    } catch { setError("We could not submit your request. Please try again."); } finally { setSubmitting(false); }
  }
  const modal = <div className="cw-guide-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={modalRef} className="cw-guide-modal" role="dialog" aria-modal="true" aria-labelledby="cw-guide-title" aria-busy={submitting || undefined}>
      <button ref={closeButtonRef} className="cw-guide-close" type="button" aria-label="Close popup" onClick={onClose}><CloseIcon /></button>
      <aside><p>EDUCATION LOAN GUIDANCE</p><h2>Make your next step clearer.</h2><ul><li>Compare lender options</li><li>Understand eligibility</li><li>Get expert support</li></ul></aside>
      <form onSubmit={submit} noValidate>{success ? <div className="cw-guide-success"><h2 id="cw-guide-title">We&apos;ll be in touch shortly.</h2><p>Thank you for sharing your details. A Credwisory expert will contact you soon.</p><button type="button" onClick={onClose}>Close</button></div> : <>
        <h2 id="cw-guide-title">Get expert guidance</h2>
        <label>Full name<input name="name" required minLength={2} autoComplete="name" /></label>
        <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
        <label>Mobile number<input name="mobile" inputMode="numeric" pattern="[6-9][0-9]{9}" required autoComplete="tel" /></label>
        <label className="cw-guide-consent"><input type="checkbox" required />I agree to be contacted.</label>
        {error ? <p className="cw-guide-error" role="alert">{error}</p> : null}
        <button className="cw-guide-submit" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Get expert guidance →"}</button>
        <button className="cw-guide-snooze" type="button" onClick={onDismissForFourHours} disabled={submitting}>Hide this popup for now</button>
      </>}</form>
    </section>
  </div>;
  return createPortal(modal, document.body);
}

function CloseIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m7 7 10 10M17 7 7 17" /></svg>; }
