import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LegacyRuntime } from "@/components/legacy-runtime";
import { SiteFooter } from "@/components/site-footer";
import { loadLegacyPage, pathnameToLegacyFile } from "@/lib/legacy";

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await loadLegacyPage(pathnameToLegacyFile((await params).slug));
  return page ? { title: page.title, description: page.description } : {};
}

export default async function Page({ params }: Props) {
  const filename = pathnameToLegacyFile((await params).slug);
  const page = await loadLegacyPage(filename);
  if (!page) notFound();
  // Tailwind is compiled from the preserved legacy HTML at build time. Do not
  // execute the former CDN loader after hydration.
  const scripts = page.scripts.filter((script) =>
    !/src=["']https:\/\/cdn\.tailwindcss\.com["']/i.test(script)
    && !/tailwind\.config\s*=/i.test(script)
    // Navigation is rendered by the React SiteHeader. Do not execute the
    // legacy header script as a second competing header owner.
    && !/src=["'][^"']*site-header\.js["']/i.test(script)
    // The home page's former inline lender widgets each own a different
    // hard-coded list. One API-backed widget is added below instead.
    && !(filename === "index.html" && script.includes("#lender-explorer")),
  );
  if (["index.html", "compare-all-lenders.html", "bank-lenders.html", "nbfc-lenders.html", "international-lenders.html"].includes(filename)) scripts.unshift('<script src="/lender-data-normalizer.js"></script>');
  if (["index.html", "compare-all-lenders.html", "bank-lenders.html", "nbfc-lenders.html", "international-lenders.html", "interest-rate-comparison.html"].includes(filename)) scripts.unshift('<script src="/lender-logo-enhancements.js"></script>');
  if (filename === "index.html") scripts.push('<script src="/homepage-lender-directory.js"></script>');
  if (["compare-all-lenders.html", "bank-lenders.html", "nbfc-lenders.html", "international-lenders.html"].includes(filename)) scripts.push('<script src="/lender-mobile-comparison.js"></script>');
  return <>
    {page.stylesheets.map((href) => <link key={href} rel="stylesheet" href={href} />)}
    <LegacyRuntime body={page.body} scripts={scripts} />
    <SiteFooter />
  </>;
}
