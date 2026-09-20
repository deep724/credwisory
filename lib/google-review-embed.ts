/** Allows only HTTPS links on Google-owned domains or the official g.page short domain. */
export function safeGoogleReviewLink(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const isGoogleDomain = /^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2,3}|co\.[a-z]{2})$/.test(host);
    return url.protocol === "https:" && (isGoogleDomain || host === "g.page") ? url.toString() : null;
  } catch { return null; }
}
