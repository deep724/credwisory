/** Approved local artwork; display files preserve each mark's natural proportions. */
const known = new Set([
  "union-bank-of-india", "state-bank-of-india", "axis-bank", "icici-bank", "idfc-bank",
  "punjab-national-bank", "bank-of-baroda", "credila", "avanse", "incred", "auxilo",
  "edgro", "poonawalla", "j-p-morgan",
]);
const aliases: Record<string, string> = {
  sbi: "state-bank-of-india", "idfc-first-bank": "idfc-bank", "hdfc-credila": "credila",
  "poonawalla-fincorp": "poonawalla", "incred-finance": "incred", "auxilo-finserve": "auxilo",
};
export function officialLenderLogo(slug: string, name: string) {
  const key = (slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id = aliases[key] || key;
  return known.has(id) ? `/lender-logos/display/${id}.png` : "";
}

export function lenderLogoSources(slug: string, name: string, logoUrl?: string, preview = false) {
  // Previews must show exactly the file being edited; public logos prefer approved artwork.
  const uploaded = logoUrl?.trim() || "";
  const safe = /^(https?:\/\/|\/(?!\/)|blob:|data:image\/(?:png|jpeg|webp);)/i.test(uploaded) ? uploaded : "";
  return [...new Set((preview ? [safe] : [officialLenderLogo(slug, name), safe]).filter(Boolean))];
}
