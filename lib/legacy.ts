import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse, serializeOuter, type DefaultTreeAdapterTypes } from "parse5";

const legacyRoot = path.join(process.cwd(), "legacy");
const pageNames = new Set([
  "index.html", "eligibility.html", "lender-enquiry.html", "compare-all-lenders.html",
  "bank-lenders.html", "nbfc-lenders.html", "international-lenders.html", "scholarships.html",
  "scholarship-eligibility.html", "sop-guidance.html", "application-guidance.html", "blogs.html",
  "contact.html", "faq.html", "how-education-loans-work.html", "loan-with-collateral.html",
  "loan-without-collateral.html", "refer-a-friend.html", "talk-to-an-expert.html",
  "emi-calculator.html", "car-loan-calculator.html", "loan-takeover-calculator.html", "interest-rate-comparison.html"
]);
const pagesWithExtractedStyles = new Set([
  "application-guidance.html", "blogs.html", "eligibility.html", "faq.html", "how-education-loans-work.html",
  "index.html", "loan-with-collateral.html", "loan-without-collateral.html", "refer-a-friend.html",
  "scholarship-eligibility.html", "scholarships.html", "sop-guidance.html", "talk-to-an-expert.html"
]);

type Element = DefaultTreeAdapterTypes.Element;
type Node = DefaultTreeAdapterTypes.Node;

export type LegacyPage = {
  title: string;
  description?: string;
  /** Existing static stylesheets in public/. */
  stylesheets: string[];
  body: string;
  scripts: string[];
};

function isElement(node: Node, tagName?: string): node is Element {
  return "tagName" in node && (!tagName || node.tagName === tagName);
}

function attribute(node: Element, name: string) {
  return node.attrs.find((item) => item.name.toLowerCase() === name)?.value;
}

function findFirst(node: Node, tagName: string): Element | undefined {
  if (isElement(node, tagName)) return node;
  if ("childNodes" in node) {
    for (const child of node.childNodes) {
      const found = findFirst(child, tagName);
      if (found) return found;
    }
  }
  return undefined;
}

/** Legacy documents were served from one directory. Next routes need public
 * assets to be root-relative so `/lenders` does not request `/lenders/site-header.js`. */
function publicAssetPath(value: string) {
  return /^(?:\/|https?:\/\/|data:|#)/i.test(value) ? value : `/${value}`;
}

/** parse5 exposes commented markup as comment nodes, never as executable elements. */
function collectExecutableScripts(node: Node, scripts: string[]) {
  if (isElement(node, "script")) {
    if (attribute(node, "type")?.toLowerCase() !== "text/plain") {
      const source = serializeOuter(node);
      const src = attribute(node, "src");
      scripts.push(src ? source.replace(/\bsrc=(['"])[^'"]*\1/i, (_match, quote) => `src=${quote}${publicAssetPath(src)}${quote}`) : source);
    }
    return;
  }
  if ("childNodes" in node) node.childNodes.forEach((child) => collectExecutableScripts(child, scripts));
}

/**
 * No executable or document-level asset can remain inside the raw HTML React
 * hydrates. A nested script would execute while the browser parses the server
 * response, before React gets a chance to hydrate the LegacyRuntime subtree.
 */
function removeUnsafeBodyNodes(node: Node) {
  if (!("childNodes" in node)) return;
  node.childNodes = node.childNodes.filter((child) => {
    if (!isElement(child)) return true;
    if (child.tagName === "style" || child.tagName === "link") return false;
    if (child.tagName === "script" && attribute(child, "type")?.toLowerCase() !== "text/plain") return false;
    removeUnsafeBodyNodes(child);
    return true;
  });
}

function isLegacyNavigationHeader(node: Node): boolean {
  if (isElement(node, "nav") && attribute(node, "aria-label") === "Main navigation") return true;
  return "childNodes" in node && node.childNodes.some(isLegacyNavigationHeader);
}

/** The app owns shared navigation. Remove direct placeholders and the old home
 * navigation wrapper while preserving content headers inside main sections. */
function removeLegacyHeaderPlaceholder(node: Node, isBody = false) {
  if (!("childNodes" in node)) return;
  node.childNodes = node.childNodes.filter((child) => {
    if (isElement(child, "header") && (isBody || isLegacyNavigationHeader(child))) return false;
    removeLegacyHeaderPlaceholder(child);
    return true;
  });
}

export async function loadLegacyPage(filename: string): Promise<LegacyPage | null> {
  if (!pageNames.has(filename)) return null;
  const source = await readFile(path.join(legacyRoot, filename), "utf8");
  const document = parse(source);
  const head = findFirst(document, "head");
  const body = findFirst(document, "body");
  if (!body) return null;

  const scripts: string[] = [];
  collectExecutableScripts(document, scripts);
  const title = head ? findFirst(head, "title")?.childNodes.map((node) => "value" in node ? node.value : "").join("").trim() : "";
  const description = head ? findFirst(head, "meta")?.attrs.find((item) => item.name === "content")?.value : undefined;
  // Document-level assets must not be placed inside the div hydrated by
  // LegacyRuntime. Browsers normalize that invalid placement differently from
  // React's hydration tree. Extracted CSS stays route-scoped as a static file.
  const stylesheets = head?.childNodes
    .filter((node): node is Element => isElement(node, "link") && attribute(node, "rel")?.toLowerCase() === "stylesheet")
    .map((node) => attribute(node, "href"))
    .filter((href): href is string => Boolean(href))
    .map(publicAssetPath) ?? [];
  if (pagesWithExtractedStyles.has(filename)) stylesheets.unshift(`/legacy-styles/${filename.replace(/\.html$/, ".css")}`);
  // Inert calculator sources stay in the document until LegacyRuntime activates them.
  removeUnsafeBodyNodes(body);
  removeLegacyHeaderPlaceholder(body, true);
  const bodyMarkup = body.childNodes
    .filter((node) => !isElement(node, "footer"))
    .map((node) => serializeOuter(node))
    .join("");
  return { title: title || "Credwisory", description, stylesheets, body: bodyMarkup, scripts };
}

export function pathnameToLegacyFile(slug?: string[]): string {
  if (!slug?.length) return "index.html";
  const value = slug.join("/");
  return value.endsWith(".html") ? value : `${value}.html`;
}
