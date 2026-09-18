import type { Metadata } from "next";
import { Suspense } from "react";
import { LenderDirectory } from "@/components/lender-directory";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./lenders.css";
import "./selection-polish.css";
import "./lender-directory-terms.css";

export const metadata: Metadata = {
  title: "Education loan lenders",
  description: "Compare education loan options from banks, NBFCs, and international lenders.",
  alternates: { canonical: "/lenders" },
};

export default function LendersPage() {
  return <>
    <SiteHeader />
    <main className="lender-directory-page">
      <section className="lender-directory-hero" aria-labelledby="lender-directory-title">
        <div className="lender-directory-hero__glow" aria-hidden="true" />
        <div className="lender-directory-hero__content">
          <p className="lender-directory-hero__eyebrow">Education loan directory</p>
          <h1 id="lender-directory-title">Find a lender that fits your study plan.</h1>
          <p>Explore lending options side by side, understand the terms that matter, and apply with Credwisory when you are ready.</p>
        </div>
      </section>
      <Suspense fallback={<div className="lender-directory lender-directory__fallback" role="status">Loading lender directory…</div>}>
        <LenderDirectory />
      </Suspense>
    </main>
    <SiteFooter />
  </>;
}
