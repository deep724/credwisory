"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

const groups = [
  [
    "Education Loans",
    [
      ["Check eligibility", "/eligibility"],
      ["How education loans work", "/how-education-loans-work"],
      ["Loan without collateral", "/loan-without-collateral"],
      ["Loan with collateral", "/loan-with-collateral"],
    ],
  ],
  [
    "Lenders",
    [
      ["All Lenders", "/lenders"],
      ["Compare Lenders", "/compare-all-lenders"],
      ["Bank Loans", "/lenders?category=bank"],
      ["NBFC Loans", "/lenders?category=nbfc"],
      ["International Lenders", "/lenders?category=international"],
    ],
  ],
  [
    "Scholarships",
    [
      ["Explore Scholarships", "/scholarships"],
      ["Scholarship Eligibility", "/scholarship-eligibility"],
    ],
  ],
  [
    "Tools",
    [
      ["EMI Calculator", "/emi-calculator"],
      ["Loan Takeover Calculator", "/loan-takeover-calculator"],
      ["Interest Rate Comparison", "/interest-rate-comparison"],
    ],
  ],
  [
    "Resources",
    [
      ["Blogs", "/blogs"],
      ["FAQ", "/faq"],
    ],
  ],
  [
    "Contact",
    [
      ["Talk to an expert", "/contact?tab=expert"],
      ["Work with Credwisory", "/contact?tab=credwisory"],
      ["Submit Your Resume", "/contact#submit-resume"],
    ],
  ],
  ["Refer and Earn", [["Refer and Earn", "/refer-a-friend"]]],
] as const;

const id = (name: string, mobile = false) =>
  `cw-${name.toLowerCase().replace(/[^a-z]+/g, "-")}${mobile ? "-mobile" : ""}`;

export function SiteHeader() {
  return <Suspense fallback={<header className="cw-header" />}><SiteHeaderContent /></Suspense>;
}

function SiteHeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const close = useCallback(() => {
    cancelClose();
    setOpen(null);
    setMobileOpen(false);
  }, [cancelClose]);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setOpen(null);
      closeTimer.current = null;
    }, 200);
  }, [cancelClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest("[data-cw-header]")
      )
        close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      cancelClose();
    };
  }, [close, cancelClose]);

  const menu = (
    name: string,
    links: readonly (readonly [string, string])[],
    mobile = false,
  ) => {
    const menuId = id(name, mobile);
    const isOpen = open === menuId;
    return (
      <div
        className="cw-group"
        key={menuId}
        onMouseEnter={() => {
          if (!mobile) {
            cancelClose();
            setOpen(menuId);
          }
        }}
        onMouseLeave={() => {
          if (!mobile) scheduleClose();
        }}
        onFocusCapture={() => {
          if (!mobile) {
            cancelClose();
            setOpen(menuId);
          }
        }}
        onBlurCapture={(event) => {
          if (mobile) return;
          const nextTarget = event.relatedTarget;
          if (
            !(nextTarget instanceof Node) ||
            !event.currentTarget.contains(nextTarget)
          )
            scheduleClose();
        }}
      >
        <div className="cw-toggle">
          {name === "Lenders" ? <Link href="/lenders" onClick={close}>Lenders</Link> : <button type="button" onClick={() => { cancelClose(); setOpen((current) => (current === menuId ? null : menuId)); }}>{name}</button>}
          <button
            className="cw-toggle-arrow"
            type="button"
            aria-label={`${isOpen ? "Close" : "Open"} ${name} menu`}
            aria-expanded={isOpen}
            aria-controls={menuId}
            onClick={() => { cancelClose(); setOpen((current) => (current === menuId ? null : menuId)); }}
          >
          <svg
            className="cw-chevron"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m3 6 5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          </button>
        </div>
        <div className={`cw-panel${isOpen ? " open" : ""}`} id={menuId}>
          {links.map(([label, href]) => {
            const [hrefPath, hrefQuery] = href.split("?");
            const active = pathname === hrefPath && (!hrefQuery || searchParams.toString() === hrefQuery);
            return href.startsWith("/") ? (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={close}
              >
                {label}
              </Link>
            ) : (
              <a
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={close}
              >
                {label}
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <header className="cw-header" data-cw-header="true">
      <nav className="cw-nav" aria-label="Main navigation">
        <Link className="cw-logo" href="/" aria-label="Credwisory home">
          <i aria-hidden="true" />
          <span>
            Credwisory<small>SOLUTIONS LLP</small>
          </span>
        </Link>
        <div className="cw-desktop">
          {groups.map(([name, links]) => menu(name, links))}
        </div>
        <Link className="cw-cta" href="/eligibility">
          Check eligibility
        </Link>
        <button
          className="cw-burger"
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="cw-mobile"
          onClick={() => {
            setMobileOpen(!mobileOpen);
            setOpen(null);
          }}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`cw-mobile${mobileOpen ? " open" : ""}`} id="cw-mobile">
          {groups.map(([name, links]) => menu(name, links, true))}
        </div>
      </nav>
    </header>
  );
}
