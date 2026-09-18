/* Homepage handoff to Compare All uses the same API IDs and ?compare= contract. */
(() => {
  const root = document.querySelector("#lender-explorer");
  if (!root || root.dataset.apiLendersMounted) return;
  root.dataset.apiLendersMounted = "true";

  const table = root.querySelector(".lender-table-standard");
  const count = root.querySelector("#selectedCount");
  const button = root.querySelector("#compareSelected");
  const message = root.querySelector("#compareMessage");
  const viewAll = root.querySelector("#viewAllLenders");
  const filters = [...root.querySelectorAll("[data-filter]")];
  if (!table || !count || !button || !viewAll) return;

  const destinations = { all: "/compare-all-lenders", bank: "/bank-lenders", nbfc: "/nbfc-lenders", international: "/international-lenders" };
  const category = (value) => {
    const normalized = String(value || "").toLowerCase();
    return ["bank", "nbfc", "international"].includes(normalized) ? normalized : null;
  };
  const initials = (name) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
  const detail = (lender, key, fallback = "Contact for details") => String(lender.comparison?.[key] ?? lender[key] ?? fallback);
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const logoSlot = (lender, size = "table") => `<span data-lender-logo-slot data-logo-name="${escape(lender.name)}" data-logo-slug="${escape(lender.id || lender.slug)}" data-logo-url="${escape(lender.logoUrl || '')}" data-logo-size="${size}"></span>`;
  let lenders = [], selected = [], active = "all";

  const visibleLenders = () => lenders.filter((lender) => active === "all" || lender.type === active).slice(0, 7);
  const draw = () => {
    if (!root.isConnected) return;
    const items = visibleLenders();
    table.innerHTML = items.length
      ? `<table class="semantic-lender-table"><thead><tr><th>Lender</th><th>Secured loan</th><th>Unsecured loan</th><th>Secured rate</th><th>Unsecured rate</th><th>Compare</th><th>Action</th></tr></thead><tbody>${items.map((lender) => `<tr><td data-label="Lender"><div class="lender-cell">${logoSlot(lender)}<span>${escape(lender.name)}<small class="illustrative">${escape(lender.type.toUpperCase())}</small></span></div></td><td data-label="Secured loan">${escape(lender.secured)}</td><td data-label="Unsecured loan">${escape(lender.unsecured)}</td><td data-label="Secured rate" class="rate">${escape(lender.securedRate)}</td><td data-label="Unsecured rate" class="rate">${escape(lender.unsecuredRate)}</td><td data-label="Compare"><label><input type="checkbox" data-id="${escape(lender.id)}" aria-label="Compare ${escape(lender.name)}" ${selected.includes(lender.id) ? "checked" : ""} ${selected.length === 4 && !selected.includes(lender.id) ? "disabled" : ""}> Compare</label></td><td data-label="Action"><a class="table-apply" href="/apply?lender=${encodeURIComponent(lender.id)}" aria-label="Apply with ${escape(lender.name)}">Apply with us</a></td></tr>`).join("")}</tbody></table>`
      : '<p class="py-6 text-sm font-bold text-muted" role="status">No published lenders are available in this category.</p>';
    count.textContent = `${selected.length} of 4 lenders selected`;
    button.disabled = selected.length < 2;
    viewAll.href = destinations[active];
    if (message) { message.hidden = selected.length < 4; if (selected.length === 4) message.textContent = "Maximum reached: deselect one lender to choose another."; }
  };

  table.addEventListener("change", (event) => {
    const input = event.target.closest("[data-id]");
    if (!input) return;
    selected = input.checked ? [...selected, input.dataset.id] : selected.filter((id) => id !== input.dataset.id);
    draw();
  });
  filters.forEach((filter) => filter.addEventListener("click", () => { active = filter.dataset.filter; filters.forEach((item) => item.classList.toggle("active", item === filter)); draw(); }));
  button.addEventListener("click", () => {
    if (selected.length < 2) return;
    try { sessionStorage.setItem("cw-lender-compare-scroll", selected.join(",")); } catch {}
    location.href = `/compare-all-lenders?compare=${encodeURIComponent(selected.join(","))}`;
  });

  table.innerHTML = '<p class="py-6 text-sm font-bold text-muted">Loading lenders...</p>';
  fetch("/api/lenders", { headers: { accept: "application/json" } })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((data) => {
      if (!Array.isArray(data)) throw new Error();
      lenders = data.map((lender) => {
        const type = category(lender.lenderType);
        return type ? { id: String(lender.slug || lender._id), type, displayOrder: Number(lender.displayOrder) || 0, initials: initials(lender.name), name: lender.name, logoUrl: lender.logoUrl, secured: detail(lender, "secured"), unsecured: detail(lender, "unsecured"), securedRate: detail(lender, "securedRate"), unsecuredRate: detail(lender, "unsecuredRate") } : null;
      }).filter(Boolean).sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
      draw();
    })
    .catch(() => { if (root.isConnected) table.innerHTML = '<p class="py-6 text-sm font-bold text-red-700" role="alert">We could not load lenders right now. Please refresh and try again.</p>'; });
})();
