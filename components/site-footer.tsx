const footerLinks = [
  ["Check eligibility", "/eligibility"],
  ["Compare lenders", "/compare-all-lenders"],
  ["Scholarships", "/scholarships"],
  ["Talk to an expert", "/talk-to-an-expert"],
];

/** Shared footer used after every preserved legacy document. */
export function SiteFooter() {
  return <footer className="cw-site-footer">
    <div className="cw-site-footer__inner">
      <Link className="cw-site-footer__brand" href="/" aria-label="Credwisory home">
        <Image src="/logo-new.png" alt="Credwisory Solutions LLP" width={1700} height={320} sizes="190px" />
      </Link>
      <nav aria-label="Footer navigation" className="cw-site-footer__links">
        {footerLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <address className="cw-site-footer__contact">
        <a href="mailto:saurabh@credwisory.com"><ContactIcon kind="email" />saurabh@credwisory.com</a>
        <a href="tel:+918828156972"><ContactIcon kind="phone" />+91 88281 56972</a>
        <span><ContactIcon kind="pin" />312, 3rd Floor, Sahajanand Integrity, Kilavani Road, Silvassa 396230</span>
      </address>
      <p>© {new Date().getFullYear()} Credwisory. Education-loan guidance, made clearer.</p>
    </div>
  </footer>;
}
import Image from "next/image";
import Link from "next/link";

function ContactIcon({ kind }: { kind: "email" | "phone" | "pin" }) {
  const paths = {
    email: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    phone: <path d="M7 3 5 5c-1 1 1 6 5 10s9 6 10 5l2-2-4-3-2 2c-2-1-4-3-5-5l2-2-3-4Z" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };
  return <svg className="cw-site-footer__contact-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}
