/* Local lender-brand assets for every API-rendered lender logo slot. */
(() => {
  const assets = {
    "union-bank-of-india": "union-bank-india.png",
    "axis-bank": "axis-bank-mark.svg",
    "icici-bank": "icici-bank.svg",
    "idfc-bank": "idfc-first-bank.svg",
    "punjab-national-bank": "punjab-national-bank.png",
    "bank-of-baroda": "bank-of-baroda.png",
    "state-bank-of-india": "state-bank-of-india.svg",
    credila: "credila.svg",
    avanse: "avanse.svg",
    incred: "incred.svg",
    auxilo: "auxilo.svg",
    edgro: "edgro.png",
    poonawalla: "poonawalla.svg",
    "j-p-morgan": "jp-morgan.svg",
  };
  const unavailable = "unavailable.svg";
  const styleId = "cw-local-lender-logo-styles";
  window.CredwisoryLenderLogos = assets;

  const addStyles = () => {
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = ".lc-badge.lc-logo,.lender-cell i.lender-logo{display:grid;place-items:center;overflow:hidden;background:#fff!important;border:1px solid #dce5e8;color:transparent!important;font-size:0!important}.lc-badge.lc-logo{width:37px;height:37px;padding:5px;border-radius:50%}.lender-cell i.lender-logo{width:38px;height:38px;min-width:38px;padding:5px;border-radius:11px}.lc-logo img,.lender-logo img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;overflow:hidden;image-rendering:auto}.lc-logo[aria-label],.lender-logo[aria-label]{color:transparent}@media(max-width:1279px){.lender-cell i.lender-logo{width:32px;height:32px;min-width:32px}}";
    document.head.append(style);
  };

  const logo = (element, id, name) => {
    if (!element || element.dataset.logoReady === "true") return;
    element.dataset.logoReady = "true";
    const image = document.createElement("img");
    const asset = assets[id] || unavailable;
    const isOfficial = asset !== unavailable;
    image.src = `/lender-logos/${asset}`;
    image.alt = isOfficial ? `${name} logo` : "Logo unavailable";
    image.loading = "lazy";
    image.addEventListener("error", () => {
      if (!image.src.endsWith(`/${unavailable}`)) {
        image.src = `/lender-logos/${unavailable}`;
        image.alt = "Logo unavailable";
      } else {
        image.remove();
        element.setAttribute("aria-label", "Logo unavailable");
      }
    });
    element.append(image);
  };

  const applyLogo = (element, id, name, className) => {
    if (!element || !id || !name || element.dataset.logoReady === "true") return;
    element.classList.add(className);
    element.textContent = "";
    logo(element, id, name);
  };

  const enhance = () => {
    addStyles();
    document.querySelectorAll(".lc-scroll tr").forEach((row) => applyLogo(
      row.querySelector(".lc-lender .lc-badge"), row.querySelector("input[data-id]")?.dataset.id, row.querySelector(".lc-lender b")?.textContent?.trim(), "lc-logo",
    ));
    document.querySelectorAll(".lc-summary").forEach((summary) => applyLogo(
      summary.querySelector("header .lc-badge"), summary.querySelector("[data-remove]")?.dataset.remove, summary.querySelector("header b")?.textContent?.trim(), "lc-logo",
    ));
    document.querySelectorAll(".lc-mobile-selected-card").forEach((card) => applyLogo(
      card.querySelector(".lc-badge"), card.querySelector("[data-remove]")?.dataset.remove, card.querySelector("b")?.textContent?.trim(), "lc-logo",
    ));
    document.querySelectorAll("#lender-explorer .semantic-lender-table tr").forEach((row) => applyLogo(
      row.querySelector(".lender-cell i"), row.querySelector("input[data-id]")?.dataset.id, row.querySelector(".lender-cell span")?.childNodes[0]?.textContent?.trim(), "lender-logo",
    ));
  };

  const start = () => {
    enhance();
    new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
