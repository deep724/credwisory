/* Apply administrator-provided lender logos after the API-backed directories render. */
(() => {
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const apply = (logos) => {
    document.querySelectorAll(".lc-lender, .lender-cell").forEach((cell) => {
      const name = cell.querySelector("b")?.textContent?.trim() || cell.querySelector("span")?.childNodes[0]?.textContent?.trim();
      const url = logos.get(name);
      const badge = cell.querySelector(".lc-badge, i");
      if (!url || !badge || badge.dataset.savedLogo === url) return;
      badge.dataset.savedLogo = url;
      badge.innerHTML = `<img src="${escape(url)}" alt="${escape(name)} logo">`;
    });
  };
  fetch("/api/lenders", { headers: { accept: "application/json" } })
    .then((response) => response.ok ? response.json() : [])
    .then((lenders) => {
      const logos = new Map((Array.isArray(lenders) ? lenders : []).filter((lender) => lender?.name && lender?.logoUrl).map((lender) => [lender.name, lender.logoUrl]));
      if (!logos.size) return;
      const refresh = () => apply(logos);
      refresh();
      new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
    })
    .catch(() => {});
})();
