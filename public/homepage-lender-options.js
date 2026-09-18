/* Homepage lender options retain API data while preferring approved local logo assets. */
(() => {
  const root = document.getElementById("homepageLenderOptions");
  if (!root || root.dataset.mounted) return;
  root.dataset.mounted = "true";
  root.classList.add("cw-home-lender-options");
  const panel = root.parentElement;
  panel?.classList.add("cw-home-lender-panel");
  const heading = panel?.querySelector("h2");
  if (heading) {
    heading.textContent = "Find an education loan that fits.";
    if (!panel.querySelector(".cw-home-lender-badges")) heading.insertAdjacentHTML("afterend", '<div class="cw-home-lender-badges"><span>Fully digital process</span><span>No hidden surprises</span></div>');
  }
  const choices = [
    ["union-bank-of-india", "Competitive rates for ambitious plans", "Competitive rates"],
    ["state-bank-of-india", "Trusted support for global study plans", "Trusted lender support"],
    ["incred", "Flexible financing for your future", "Flexible loan routes"],
  ];

  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

  root.innerHTML = '<p class="cw-home-options-state">Loading lender options…</p>';
  fetch("/api/lenders", { headers: { accept: "application/json" } })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((items) => {
      const lenders = new Map(Array.isArray(items) ? items.map((item) => [item.slug, item]) : []);
      const cards = choices.map(([slug, description, benefit]) => {
        const lender = lenders.get(slug);
        if (!lender?.name) return "";
        const logo = `<span data-lender-logo-slot data-logo-name="${esc(lender.name)}" data-logo-slug="${esc(slug)}" data-logo-url="${esc(lender.logoUrl || '')}" data-logo-size="card"></span>`;
        return `<article class="cw-home-option-card"><div class="cw-home-option-logo">${logo}</div><div class="cw-home-option-copy"><h3>${esc(lender.name)}</h3><p>${esc(description)}</p><small>${esc(lender.comparison?.securedRate || benefit)}</small></div><a href="/apply?lender=${encodeURIComponent(lender.slug)}" aria-label="View details for ${esc(lender.name)}">View details <b aria-hidden="true">→</b></a></article>`;
      }).filter(Boolean);
      root.innerHTML = cards.length ? cards.join("") : '<p class="cw-home-options-state">Lender options are temporarily unavailable.</p>';
    })
    .catch(() => { root.innerHTML = '<p class="cw-home-options-state">Lender options are temporarily unavailable.</p>'; });
})();
