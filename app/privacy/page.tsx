import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy policy", description: "How Credwisory handles form data and optional anonymous analytics.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <main className="privacy-page"><h1>Privacy policy</h1><p>We use the details you voluntarily provide in forms to respond to your education-loan enquiry. We do not sell personal information.</p><h2>Optional analytics</h2><p>After you accept analytics cookies, we store an anonymous session identifier, page visits, approximate time on the site, referrer and device category. This helps us improve the experience. We do not connect this activity to your name unless you submit a form.</p><h2>Your choices</h2><p>You may decline analytics. You may also request access to or deletion of your submitted personal data by contacting us through the site contact form.</p><p><Link href="/">Return to Credwisory</Link></p></main>;
}
