import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LegacyRuntime } from "@/components/legacy-runtime";
import { SiteFooter } from "@/components/site-footer";
import { HomepageTestimonials } from "@/components/homepage-testimonials";
import { TestimonialSubmission } from "@/components/testimonial-submission";
import { loadLegacyPage, pathnameToLegacyFile } from "@/lib/legacy";

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const cleanPath = !slug?.length ? "/" : `/${slug.join("/").replace(/\.html$/, "")}`;
  const filename =
    slug?.join("/") === "lenders"
      ? "compare-all-lenders.html"
      : pathnameToLegacyFile(slug);
  const page = await loadLegacyPage(filename);
  // The historical home document was saved with mojibake in its title. Keep
  // the canonical title in application source rather than repairing it in the
  // browser after rendering.
  return page
    ? {
        title:
          filename === "index.html"
            ? { absolute: "Credwisory | Education loans, made clear." }
            : page.title,
        description: page.description,
        alternates: { canonical: cleanPath },
      }
    : {};
}

export default async function Page({ params }: Props) {
  const slug = (await params).slug;
  const filename =
    slug?.join("/") === "lenders"
      ? "compare-all-lenders.html"
      : pathnameToLegacyFile(slug);
  const page = await loadLegacyPage(filename);
  if (!page) notFound();
  const stylesheets = [
    ...(filename === "compare-all-lenders.html" ? [...page.stylesheets, "/compare-selection-fix.css"] : page.stylesheets),
    ...(filename === "index.html" ? ["/shared-calculator.css"] : []),
  ];
  // Tailwind is compiled from the preserved legacy HTML at build time. Do not
  // execute the former CDN loader after hydration.
  const scripts = page.scripts.filter(
    (script) =>
      !/src=["']https:\/\/cdn\.tailwindcss\.com["']/i.test(script) &&
      !/tailwind\.config\s*=/i.test(script) &&
      // Navigation is rendered by the React SiteHeader. Do not execute the
      // legacy header script as a second competing header owner.
      !/src=["'][^"']*site-header\.js["']/i.test(script) &&
      // The home page's former inline lender widgets each own a different
      // hard-coded list. One API-backed widget is added below instead.
      !(filename === "index.html" && script.includes("#lender-explorer")),
  );
  // The preserved home document accumulated several competing inline owners
  // for menus, lender selection, and calculator fields. Keep source-owned
  // implementations as the sole interactive owners.
  if (filename === "index.html") {
    scripts.splice(
      0,
      scripts.length,
      ...scripts.filter(
        (script) =>
          /\bsrc=["'][^"']+/.test(script) && !/site-header\.js/.test(script),
      ),
    );
    scripts.push('<script src="/shared-calculator.js"></script>');
  }
  if (
    [
      "index.html",
      "compare-all-lenders.html",
      "bank-lenders.html",
      "nbfc-lenders.html",
      "international-lenders.html",
    ].includes(filename)
  )
    scripts.unshift('<script src="/lender-data-normalizer.js"></script>');
  if (
    [
      "index.html",
      "lender-enquiry.html",
      "compare-all-lenders.html",
      "bank-lenders.html",
      "nbfc-lenders.html",
      "international-lenders.html",
      "interest-rate-comparison.html",
    ].includes(filename)
  )
    scripts.unshift('<script src="/lender-application-modal.js"></script>');

  if (filename === "index.html")
    scripts.push(
      '<script src="/homepage-lender-directory.js"></script>',
      '<script src="/homepage-lender-options.js"></script>',
      '<script src="/homepage-journey.js"></script>',
    );

  // Website-controlled lead capture is available across public legacy pages;
  // its per-load guard prevents duplicate prompts during a single visit.
  if (["eligibility.html", "scholarship-eligibility.html"].includes(filename))
    scripts.push('<script src="/contact-fields-only.js"></script>');
  if (filename === "scholarships.html")
    scripts.push('<script src="/scholarship-cleanup.js"></script>');
  if (filename === "compare-all-lenders.html")
    scripts.push('<script src="/lender-tabs.js"></script>');
  if (filename === "contact.html")
    scripts.push('<script src="/contact-enhancements.js"></script>');
  if (filename === "refer-a-friend.html")
    scripts.push('<script src="/referral-form.js"></script>');
  if (
    [
      "compare-all-lenders.html",
      "bank-lenders.html",
      "nbfc-lenders.html",
      "international-lenders.html",
    ].includes(filename)
  )
    scripts.push('<script src="/lender-mobile-comparison.js"></script>');
  return (
    <>
      {stylesheets.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <LegacyRuntime body={page.body} scripts={scripts} />
      {filename === "index.html" ? <HomepageTestimonials /> : null}
      {filename === "index.html" ? <TestimonialSubmission /> : null}
      <SiteFooter />
    </>
  );
}
