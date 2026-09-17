import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://credwisory-app.vercel.app";
const publicPaths = [
  "", "eligibility", "lender-enquiry", "apply-with-us", "compare-all-lenders",
  "bank-lenders", "nbfc-lenders", "international-lenders", "scholarships",
  "scholarship-eligibility", "sop-guidance", "application-guidance", "blogs",
  "contact", "faq", "how-education-loans-work", "loan-with-collateral",
  "loan-without-collateral", "refer-a-friend", "talk-to-an-expert", "emi-calculator",
  "loan-takeover-calculator", "interest-rate-comparison", "apply", "privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({ url: new URL(path || "/", siteUrl).toString() }));
}
