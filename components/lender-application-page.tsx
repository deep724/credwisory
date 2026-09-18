/* eslint-disable @next/next/no-css-tags */
import Link from "next/link";
import { LenderBackButton } from "@/components/lender-back-button";
import { LenderApplicationForm } from "@/components/lender-application-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { AvailableLender } from "@/lib/available-lenders";

export function LenderApplicationPage({ lender }: { lender: AvailableLender | null }) {
  return <><link rel="stylesheet" href="/apply-with-us.css" /><link rel="stylesheet" href="/apply-flow-polish.css" /><link rel="stylesheet" href="/lender-application-context.css" /><SiteHeader /><main className="cw-apply-page">{!lender ? <><LenderBackButton /><section className="cw-apply-card cw-lender-unavailable" role="status"><p className="cw-apply-eyebrow">EDUCATION LOAN APPLICATION</p><h1>Lender not available</h1><p>This lender is unavailable or is no longer accepting applications. Please choose another available lender.</p><Link className="cw-apply-success__lenders" href="/lenders">Back to lenders</Link></section></> : <><LenderBackButton /><LenderApplicationForm lender={lender} /></>}</main><SiteFooter /></>;
}
