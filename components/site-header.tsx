"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const groups = [
  [
    "Education Loans",
    [
      ["Check eligibility", "eligibility.html"],
      ["How education loans work", "/#how-it-works"],
      ["Loan without collateral", "loan-without-collateral.html"],
      ["Loan with collateral", "loan-with-collateral.html"],
    ],
  ],
  [
    "Lenders",
    [
      ["All Lenders", "/lenders"],
      ["Compare Lenders", "compare-all-lenders.html"],
      ["Bank Loans", "/lenders?category=bank"],
      ["NBFC Loans", "/lenders?category=nbfc"],
      ["International Lenders", "/lenders?category=international"],
    ],
  ],
  [
    "Scholarships",
    [
      ["Explore Scholarships", "scholarships.html"],
      ["Scholarship Eligibility", "scholarship-eligibility.html"],
    ],
  ],
  [
    "Tools",
    [
      ["EMI Calculator", "emi-calculator.html"],
      ["Loan Takeover Calculator", "loan-takeover-calculator.html"],
      ["Interest Rate Comparison", "interest-rate-comparison.html"],
    ],
  ],
  [
    "Resources",
    [
      ["Blogs", "/blogs"],
      ["FAQ", "faq.html"],
    ],
  ],
  [
    "Contact",
    [
      ["Talk to an expert", "talk-to-an-expert.html"],
      ["Work with Credwisory", "contact.html"],
    ],
  ],
  ["Refer and Earn", [["Refer and Earn", "refer-a-friend.html"]]],
] as const;

const id = (name: string, mobile = false) =>
  `cw-${name.toLowerCase().replace(/[^a-z]+/g, "-")}${mobile ? "-mobile" : ""}`;

export function SiteHeader() {
  const pathname = usePathname();
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
        <button
          className="cw-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls={menuId}
          onClick={() => {
            cancelClose();
            setOpen((current) => (current === menuId ? null : menuId));
          }}
        >
          {name}
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
        <div className={`cw-panel${isOpen ? " open" : ""}`} id={menuId}>
          {links.map(([label, href]) => {
            const active = pathname === `/${href}`;
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
        <a className="cw-logo" href="index.html" aria-label="Credwisory home">
          <i aria-hidden="true" />
          <span>
            Credwisory<small>SOLUTIONS LLP</small>
          </span>
        </a>
        <div className="cw-desktop">
          {groups.map(([name, links]) => menu(name, links))}
        </div>
        <a className="cw-cta" href="eligibility.html">
          Check eligibility
        </a>
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
