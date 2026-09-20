export const BLOG_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const BLOG_IMAGE_MAX_LABEL = "5 MB";
const imageExtension = /\.(?:jpe?g|png|webp)$/i;
const localUploadPath = /^\/uploads\/blog\/[a-z0-9][a-z0-9_-]*\.(?:jpe?g|png|webp)$/i;

/** Stored image references are deliberately limited to safe public image URLs. */
export function isValidBlogImageValue(value: string) {
  if (!value) return true;
  if (localUploadPath.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && imageExtension.test(url.pathname);
  } catch {
    return false;
  }
}

export function validBlogImageMessage() {
  return "Use an HTTPS JPG, PNG, or WebP URL, or a valid uploaded blog image.";
}
