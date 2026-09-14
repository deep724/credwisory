const footerLinks = [
  ["Check eligibility", "eligibility.html"],
  ["Compare lenders", "compare-all-lenders.html"],
  ["Scholarships", "scholarships.html"],
  ["Talk to an expert", "talk-to-an-expert.html"],
];

/** Shared footer used after every preserved legacy document. */
export function SiteFooter() {
  return <footer className="cw-site-footer">
    <div className="cw-site-footer__inner">
      <a className="cw-site-footer__brand" href="index.html" aria-label="Credwisory home">
        <Image src="/logo-new.png" alt="Credwisory Solutions LLP" width={1700} height={320} sizes="190px" />
      </a>
      <nav aria-label="Footer navigation" className="cw-site-footer__links">
        {footerLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <address className="cw-site-footer__contact">
        <a href="mailto:saurabh@credwisory.com">saurabh@credwisory.com</a>
        <a href="tel:+918828156972">+91 88281 56972</a>
        <span>312, 3rd Floor, Sahajanand Integrity, Kilavani Road, Silvassa 396230</span>
      </address>
      <p>© {new Date().getFullYear()} Credwisory. Education-loan guidance, made clearer.</p>
    </div>
  </footer>;
}
import Image from "next/image";
