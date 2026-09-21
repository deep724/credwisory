/** Only bundled, verified standalone bank marks may be shown as images. */
const bankMarks: Record<string, string> = {
  "axis-bank": "/lender-logos/axis-bank-mark.svg",
  "union-bank-of-india": "/lender-logos/union-bank-mark.png",
  "icici-bank": "/lender-logos/icici-mark.png",
  "idfc-bank": "/lender-logos/idfc-first-bank-mark.png",
  "punjab-national-bank": "/lender-logos/pnb-mark.png",
  "bank-of-baroda": "/lender-logos/bank-of-baroda-mark.png",
  "state-bank-of-india": "/lender-logos/sbi-mark.svg",
  credila: "/lender-logos/credila-mark.png",
  avanse: "/lender-logos/avanse-mark.png",
  incred: "/lender-logos/incred-mark.png",
  auxilo: "/lender-logos/auxilo-mark.png",
  edgro: "/lender-logos/edgro-mark.png",
  poonawalla: "/lender-logos/poonawalla-mark.png",
  "j-p-morgan": "/lender-logos/jp-morgan-mark.png",
};
const aliases: Record<string, string> = {
  sbi: "state-bank-of-india", "idfc-first-bank": "idfc-bank", "hdfc-credila": "credila",
  "poonawalla-fincorp": "poonawalla", "incred-finance": "incred", "auxilo-finserve": "auxilo",
  jpmorgan: "j-p-morgan",
  "union-bank": "union-bank-of-india", "union-bank-india": "union-bank-of-india",
  "state-bank-india": "state-bank-of-india", "idfc-first": "idfc-bank",
};
const textTileLabels: Record<string, string> = {
  "state-bank-of-india": "SBI",
  "union-bank-of-india": "Union Bank",
  "icici-bank": "ICICI",
  "punjab-national-bank": "PNB",
  "bank-of-baroda": "BOB",
  "axis-bank": "Axis",
  "idfc-bank": "IDFC FIRST",
  credila: "Credila",
  avanse: "Avanse",
  incred: "InCred",
  auxilo: "Auxilo",
  edgro: "Edgro",
  poonawalla: "Poonawalla",
  "j-p-morgan": "J.P. Morgan",
};

function lenderId(slug: string, name: string) {
  const key = (slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return aliases[key] || key;
}

export function officialLenderLogo(slug: string, name: string, lenderType?: string) {
  // All artwork comes from bundled lender-provided sources; no remote logo URL is rendered.
  return bankMarks[lenderId(slug, name)] || "";
}

export function lenderLogoSources(slug: string, name: string, lenderType?: string) {
  const mark = officialLenderLogo(slug, name, lenderType);
  return mark ? [mark] : [];
}

export function lenderTextTileLabel(slug: string, name: string) {
  const fallback = name.trim() || "Lender";
  if (textTileLabels[lenderId(slug, name)]) return textTileLabels[lenderId(slug, name)];
  return fallback;
}
