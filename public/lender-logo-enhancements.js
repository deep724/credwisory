/* Local lender-brand assets for every API-rendered lender logo slot. */
(() => {
  const assets = {
    "union-bank-of-india": "union-bank-india.png",
    "axis-bank": "axis-bank.svg",
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
    // One geometry for every lender at every breakpoint, including SBI.
    style.textContent = `
      .lc-badge.lc-logo,.lender-cell i.lender-logo {
        display:flex;align-items:center;justify-content:center;box-sizing:border-box;
        flex:0 0 56px;width:56px;height:56px;min-width:56px;padding:7px;
        border:1px solid #DCE5EE;border-radius:12px;background:#fff;
        overflow:visible;box-shadow:none;font-size:0;
      }
      .lc-badge.lc-logo::before,.lc-badge.lc-logo::after,
      .lender-cell i.lender-logo::before,.lender-cell i.lender-logo::after {content:none}
      .lc-badge.lc-logo img,.lender-cell i.lender-logo img {
        display:block;width:100%;height:100%;max-width:none;max-height:none;
        object-fit:contain;object-position:center;opacity:1;filter:none;transform:none;
      }
      .lc-scroll th:first-child,.lc-scroll td:first-child {width:260px;min-width:260px}
      .lc-scroll td:first-child {padding:0!important}
      .lc-scroll .lc-lender {
        display:flex;align-items:center;gap:14px;min-height:72px;
        min-width:0;padding:12px 16px;box-sizing:border-box;
      }
      .lc-scroll .lc-lender .lc-badge.lc-logo {
        width:58px;height:58px;min-width:58px;flex:0 0 58px;
        display:flex;align-items:center;justify-content:center;
        background:#fff;border:1px solid #dbe7e8;border-radius:12px;
        padding:7px;box-sizing:border-box;overflow:hidden;
      }
      .lc-scroll .lc-lender .lc-badge.lc-logo img {
        display:block;width:100%;height:100%;
        object-fit:contain;object-position:center center;
        position:static;top:auto;right:auto;bottom:auto;left:auto;
        margin:0;padding:0;transform:none;translate:none;
      }
      .lc-scroll .lc-lender>span:last-child {
        display:flex;flex-direction:column;justify-content:center;min-width:0;flex:1;
      }
      .lc-scroll .lc-lender b {
        font-size:15px;font-weight:700;line-height:1.25;
        white-space:normal;word-break:normal;overflow-wrap:anywhere;
      }
      .lc-scroll .lc-lender small {display:block;margin-top:5px;line-height:1.3}
      @media(max-width:767px) {
        .lc-scroll th:first-child,.lc-scroll td:first-child {width:auto;min-width:220px}
        .lc-scroll .lc-lender {width:100%}
      }
    `;
    document.head.append(style);
  };

  const logo = (element, id, name) => {
    if (!element || element.dataset.logoReady === "true") return;
    element.dataset.logoReady = "true";
    const image = document.createElement("img");
    const asset = assets[id] ? `normalized/${id}.png` : unavailable;
    const isOfficial = asset !== unavailable;
    image.src = `/lender-logos/${asset}`;
    image.alt = isOfficial ? `${name} logo` : "Logo unavailable";
    image.loading = "lazy";
    image.width = 400;
    image.height = 400;
    image.addEventListener("error", () => {
      if (!image.src.endsWith(`/${unavailable}`)) {
        image.src = `/lender-logos/${unavailable}`;
        image.alt = "Logo unavailable";
      } else {
        image.remove();
        element.classList.add("lender-logo-fallback");
        element.textContent = name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 3).toUpperCase();
        element.setAttribute("aria-label", `${name} logo`);
      }
    });
    element.append(image);
  };

  const applyLogo = (element, id, name, className) => {
    if (!element || !id || !name || element.dataset.logoReady === "true") return;
    element.classList.add(className);
    element.dataset.lenderLogo = id;
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
