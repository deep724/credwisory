(() => {
  const rows = document.querySelector("#rate-rows"), status = document.querySelector("#rate-status"), lenderFilter = document.querySelector("#rate-lender"), typeFilter = document.querySelector("#rate-loan-type"), amountFilter = document.querySelector("#rate-amount"), tenureFilter = document.querySelector("#rate-tenure"), reset = document.querySelector("#rate-reset");
  if (!rows || !status || !lenderFilter || !typeFilter || !amountFilter || !tenureFilter) return;
  const filters = [lenderFilter, typeFilter, amountFilter, tenureFilter];
  const escapeHtml = (value) => String(value ?? "Not available").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const detail = (lender, key) => lender.comparison?.[key] || "Not available";
  const available = (value) => value !== "Not available";
  const loanValue = (lender, type) => detail(lender, type === "unsecured" ? "unsecured" : "secured");
  const muted = (value) => `<span class="rate-not-published">${escapeHtml(value)}</span>`;
  let lenders = [];
  const render = () => {
    const type = typeFilter.value, lenderId = lenderFilter.value, amount = amountFilter.value, tenure = tenureFilter.value;
    const filtered = lenders.filter((lender) => {
      if (lenderId !== "all" && lender.slug !== lenderId) return false;
      if (type === "secured" && !available(detail(lender, "securedRate"))) return false;
      if (type === "unsecured" && !available(detail(lender, "unsecuredRate"))) return false;
      const loan = loanValue(lender, type);
      if (amount === "crore" && !/crore|cr/i.test(loan)) return false;
      if (amount === "lakh" && /crore|cr/i.test(loan)) return false;
      return !(tenure === "15" && !/15/i.test(detail(lender, "tenure")));
    });
    status.textContent = filtered.length ? `${filtered.length} published lender${filtered.length === 1 ? "" : "s"} shown. Final rates are subject to lender review.` : "No lenders match these filters.";
    rows.innerHTML = filtered.length ? filtered.map((lender) => {
      const secured = detail(lender, "securedRate"), unsecured = detail(lender, "unsecuredRate"), rate = type === "secured" ? secured : type === "unsecured" ? unsecured : [secured, unsecured].filter(available).join(" / ") || "Not available";
      const loan = type === "secured" ? detail(lender, "secured") : type === "unsecured" ? detail(lender, "unsecured") : `Secured: ${detail(lender, "secured")} · Unsecured: ${detail(lender, "unsecured")}`;
      const mark = `<span data-lender-logo-slot data-logo-name="${escapeHtml(lender.name)}" data-logo-slug="${escapeHtml(lender.slug)}" data-logo-url="${escapeHtml(lender.logoUrl || '')}"></span>`;
      return `<tr><td><div class="rate-lender">${mark}<span>${escapeHtml(lender.name)}</span></div></td><td class="rate-value">${available(rate) ? escapeHtml(rate) : muted("Not published")}</td><td>${muted("Not published")}</td><td>${available(detail(lender, "fee")) ? escapeHtml(detail(lender, "fee")) : muted("Not published")}</td><td>${available(loan) ? escapeHtml(loan) : muted("Not published")}</td><td>${available(detail(lender, "tenure")) ? escapeHtml(detail(lender, "tenure")) : muted("Not published")}</td><td class="rate-note">Illustrative; lender approval and pricing depend on your profile.</td><td><a class="rate-action" href="/apply?lender=${encodeURIComponent(lender.slug)}" aria-label="View details for ${escapeHtml(lender.name)}">View details <span aria-hidden="true">→</span></a></td></tr>`;
    }).join("") : '<tr><td class="rate-empty" colspan="8">No matching published lenders. Adjust a filter and try again.</td></tr>';
    rows.querySelectorAll("tr").forEach((row) => ["Lender","Interest rate","APR / effective rate","Processing fee","Loan amount","Tenure","Eligibility / notes","Action"].forEach((label, index) => { const cell = row.children[index]; if (cell) cell.dataset.label = label; }));
  };
  rows.innerHTML = '<tr><td class="rate-empty" colspan="8">Loading published lender data…</td></tr>';
  fetch("/api/lenders", { headers: { accept: "application/json" } }).then((response) => { if (!response.ok) throw new Error("Lender data request failed"); return response.json(); }).then((data) => { lenders = Array.isArray(data) ? data.filter((item) => item?.published !== false) : []; lenders.forEach((lender) => lenderFilter.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(lender.slug)}">${escapeHtml(lender.name)}</option>`)); render(); }).catch(() => { status.textContent = "We could not load lender data right now. Please refresh and try again."; rows.innerHTML = '<tr><td class="rate-empty" colspan="8">Lender data is temporarily unavailable.</td></tr>'; });
  filters.forEach((input) => input.addEventListener("change", render));
  reset?.addEventListener("click", () => { filters.forEach((input) => { input.value = "all"; }); render(); typeFilter.focus(); });
})();
