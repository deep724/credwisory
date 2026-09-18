import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ApplyLoading() {
  return <><SiteHeader /><main className="cw-apply-page"><section className="cw-apply-card cw-apply-loading" role="status" aria-live="polite"><p className="cw-apply-eyebrow">EDUCATION LOAN APPLICATION</p><h1>Loading your application</h1><p>Preparing your lender details and application form…</p></section></main><SiteFooter /></>;
}
