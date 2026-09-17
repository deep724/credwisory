/* Legacy form styles are intentionally route-scoped until the legacy form is migrated. */
/* eslint-disable @next/next/no-css-tags */
import Link from "next/link";
import Script from "next/script";
import { SiteFooter } from "@/components/site-footer";
import type { AvailableLender } from "@/lib/available-lenders";

export function LenderApplicationPage({ lender }: { lender: AvailableLender | null }) {
  if (!lender) return <><link rel="stylesheet" href="/apply-with-us.css" /><link rel="stylesheet" href="/apply-flow-polish.css" /><main className="cw-apply-page"><Link className="cw-apply-back" href="/lenders">← Back to lenders</Link><section className="cw-apply-card cw-lender-unavailable" role="status"><p className="cw-apply-eyebrow">EDUCATION LOAN APPLICATION</p><h1>Lender not available</h1><p>This lender is unavailable or is no longer accepting applications. Please choose another available lender.</p><Link className="cw-apply-success__lenders" href="/lenders">Back to lenders</Link></section></main><SiteFooter /></>;
  return <><link rel="stylesheet" href="/apply-with-us.css" /><link rel="stylesheet" href="/apply-flow-polish.css" /><main className="cw-apply-page" id="applyWithUsPage"><Link className="cw-apply-back" href="/lenders">← Back to lenders</Link><div id="applyWithUsContent" data-lender={JSON.stringify(lender)} /></main><Script src="/apply-with-us.js" strategy="afterInteractive" /><SiteFooter /></>;
}
