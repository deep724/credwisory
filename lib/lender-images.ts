export const LENDER_LOGO_ACCEPT = "image/jpeg,image/png,image/webp";
export const LENDER_LOGO_MAX_BYTES = 4 * 1024 * 1024;
export const LENDER_LOGO_MAX_LABEL = "4 MB";
const externalImage = /\.(?:jpe?g|png|webp)$/i;
const localLogo = /^\/uploads\/lenders\/[a-z0-9][a-z0-9_-]*\.(?:jpe?g|png|webp)$/i;

export function isValidLenderLogo(value: string) {
  if (!value || localLogo.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && externalImage.test(url.pathname);
  } catch { return false; }
}
export const lenderLogoMessage = "Use an HTTPS JPG, PNG, or WebP URL, or a valid uploaded logo path.";
