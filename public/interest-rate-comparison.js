(() => {
  const rows = document.querySelector("#rate-rows");
  const status = document.querySelector("#rate-status");
  const lenderFilter = document.querySelector("#rate-lender");
  const typeFilter = document.querySelector("#rate-loan-type");
  const amountFilter = document.querySelector("#rate-amount");
  const tenureFilter = document.querySelector("#rate-tenure");
  const reset = document.querySelector("#rate-reset");

  if (!rows || !status || !lenderFilter || !typeFilter || !amountFilter || !tenureFilter) return;

  const filters = [lenderFilter, typeFilter, amountFilter, tenureFilter];
  const labels = ["Lender", "Interest rate", "Loan type", "Processing fee", "Loan amount", "Loan tenure", "Repayment details", "Collateral", "Action"];
  const escapeHtml = (value) => String(value ?? "Not available").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const detail = (lender, key) => lender.comparison?.[key] || lender[key] || "Not available";
  const available = (value) => value !== "Not available";
  const loanValue = (lender, type) => detail(lender, type === "unsecured" ? "unsecured" : "secured");
  const muted = (value) => `<span class="rate-not-published">${escapeHtml(value)}</span>`;
  const display = (value) => (available(value) ? escapeHtml(value) : muted("Not published"));
  const loanType = (lender) => {
    const hasSecured = available(detail(lender, "securedRate"));
    const hasUnsecured = available(detail(lender, "unsecuredRate"));
    if (hasSecured && hasUnsecured) return "Secured & unsecured";
    if (hasSecured) return "Secured";
    if (hasUnsecured) return "Unsecured";
    return "Not available";
  };
  let lenders = [];

  const setLabels = () => {
    rows.querySelectorAll("tr").forEach((row) => labels.forEach((label, index) => {
      const cell = row.children[index];
      if (cell) cell.dataset.label = label;
    }));
  };

  const render = () => {
    const type = typeFilter.value;
    const lenderId = lenderFilter.value;
    const amount = amountFilter.value;
    const tenure = tenureFilter.value;
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
      const secured = detail(lender, "securedRate");
      const unsecured = detail(lender, "unsecuredRate");
      const rate = type === "secured" ? secured : type === "unsecured" ? unsecured : [secured, unsecured].filter(available).join(" / ") || "Not available";
      const loan = type === "secured" ? detail(lender, "secured") : type === "unsecured" ? detail(lender, "unsecured") : `Secured: ${detail(lender, "secured")} · Unsecured: ${detail(lender, "unsecured")}`;
      const mark = `<span data-lender-logo-slot data-logo-name="${escapeHtml(lender.name)}" data-logo-slug="${escapeHtml(lender.slug)}" data-logo-url="${escapeHtml(lender.logoUrl || "")}"></span>`;
      return `<tr><td><div class="rate-lender">${mark}<span>${escapeHtml(lender.name)}</span></div></td><td class="rate-value">${display(rate)}</td><td>${display(loanType(lender))}</td><td>${display(detail(lender, "fee"))}</td><td>${display(loan)}</td><td>${display(detail(lender, "tenure"))}</td><td>${display(detail(lender, "moratorium"))}</td><td>${display(detail(lender, "collateral"))}</td><td><a class="rate-action" href="/apply?lender=${encodeURIComponent(lender.slug)}" aria-label="View details and apply with ${escapeHtml(lender.name)}">View &amp; Apply <span class="rate-action-arrow" aria-hidden="true">→</span></a></td></tr>`;
    }).join("") : '<tr><td class="rate-empty" colspan="9">No matching published lenders. Adjust a filter and try again.</td></tr>';
    setLabels();
  };

  rows.innerHTML = '<tr><td class="rate-empty" colspan="9">Loading published lender data…</td></tr>';
  fetch("/api/lenders", { headers: { accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("Lender data request failed");
      return response.json();
    })
    .then((data) => {
      lenders = Array.isArray(data) ? data.filter((item) => item?.published !== false) : [];
      lenders.forEach((lender) => lenderFilter.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(lender.slug)}">${escapeHtml(lender.name)}</option>`));
      render();
    })
    .catch(() => {
      status.textContent = "We could not load lender data right now. Please refresh and try again.";
      rows.innerHTML = '<tr><td class="rate-empty" colspan="9">Lender data is temporarily unavailable.</td></tr>';
    });

  filters.forEach((input) => input.addEventListener("change", render));
  reset?.addEventListener("click", () => {
    filters.forEach((input) => { input.value = "all"; });
    render();
    typeFilter.focus();
  });
})();
