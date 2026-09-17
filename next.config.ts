import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  // Allow the private-network development origin without relaxing production
  // CSP or exposing any development-only capability in production.
  allowedDevOrigins: ["192.168.137.1"],
  async redirects() {
    const publicPages = [
      "eligibility", "lender-enquiry", "apply-with-us", "compare-all-lenders",
      "bank-lenders", "nbfc-lenders", "international-lenders", "scholarships",
      "scholarship-eligibility", "sop-guidance", "application-guidance", "blogs",
      "contact", "faq", "how-education-loans-work", "loan-with-collateral",
      "loan-without-collateral", "refer-a-friend", "talk-to-an-expert",
      "emi-calculator", "loan-takeover-calculator", "interest-rate-comparison",
    ];
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...publicPages.map((page) => ({ source: `/${page}.html`, destination: `/${page}`, permanent: true })),
    ];
  },
  async headers() {
    const production = process.env.NODE_ENV === "production";
    // React's development runtime uses eval for source-mapped component code.
    // Keep that development-only exception out of the production policy.
    const scriptSource = production
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    const headers = [
      // This app is also served on a private-network HTTP address during local
      // use. `upgrade-insecure-requests` makes browsers request every CSS and
      // JavaScript asset over HTTPS, but the LAN server intentionally has no
      // HTTPS listener, leaving the page as unstyled HTML.
      { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; ${scriptSource}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self'` },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    ];
    if (production) headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
    return [{ source: "/(.*)", headers }];
  },
};

export default nextConfig;
