(() => {
  const logos = window.CredwisoryLenderLogos || {
    "union-bank-of-india": "union-bank-india.png", "axis-bank": "axis-bank-mark.svg", "icici-bank": "icici-bank.svg", "idfc-bank": "idfc-first-bank.svg", "punjab-national-bank": "punjab-national-bank.png", "bank-of-baroda": "bank-of-baroda.svg", "state-bank-of-india": "state-bank-of-india.svg", credila: "credila.svg", avanse: "avanse.svg", incred: "incred.svg", auxilo: "auxilo.svg", edgro: "edgro.png", poonawalla: "poonawalla.svg", "j-p-morgan": "jp-morgan.svg",
  };
  const rows = document.querySelector("#rate-rows");
  const status = document.querySelector("#rate-status");
  const lenderFilter = document.querySelector("#rate-lender");
  const typeFilter = document.querySelector("#rate-loan-type");
  const amountFilter = document.querySelector("#rate-amount");
  const tenureFilter = document.querySelector("#rate-tenure");
  if (!rows || !status || !lenderFilter || !typeFilter || !amountFilter || !tenureFilter) return;

  const escapeHtml = (value) => String(value ?? "Not available").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  const detail = (lender, key) => lender.comparison?.[key] || "Not available";
  const available = (value) => value !== "Not available";
  const loanValue = (lender, type) => detail(lender, type === "unsecured" ? "unsecured" : "secured");
  let lenders = [];

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
      if (tenure === "15" && !/15/i.test(detail(lender, "tenure"))) return false;
      return true;
    });
    status.textContent = filtered.length ? `${filtered.length} published lender${filtered.length === 1 ? "" : "s"} shown. Final rates are subject to lender review.` : "No lenders match these filters.";
    rows.innerHTML = filtered.length ? filtered.map((lender) => {
      const secured = detail(lender, "securedRate");
      const unsecured = detail(lender, "unsecuredRate");
      const rate = type === "secured" ? secured : type === "unsecured" ? unsecured : [secured, unsecured].filter(available).join(" / ") || "Not available";
      const loan = type === "secured" ? detail(lender, "secured") : type === "unsecured" ? detail(lender, "unsecured") : `Secured: ${detail(lender, "secured")} · Unsecured: ${detail(lender, "unsecured")}`;
      const logo = logos[lender.slug] || "unavailable.svg";
      return `<tr><td><div class="rate-lender"><img src="/lender-logos/${escapeHtml(logo)}" alt="${escapeHtml(lender.name)} logo" onerror="this.onerror=null;this.src='/lender-logos/unavailable.svg';this.alt='Logo unavailable'"><span>${escapeHtml(lender.name)}</span></div></td><td>${escapeHtml(rate)}</td><td>Not published</td><td>${escapeHtml(detail(lender, "fee"))}</td><td>${escapeHtml(loan)}</td><td>${escapeHtml(detail(lender, "tenure"))}</td><td>Illustrative; lender approval and pricing depend on your profile.</td><td><a class="rate-action" href="lender-enquiry.html?lender=${encodeURIComponent(lender.slug)}">View details</a></td></tr>`;
    }).join("") : '<tr><td class="rate-empty" colspan="8">No matching published lenders. Adjust a filter and try again.</td></tr>';
  };

  rows.innerHTML = '<tr><td class="rate-empty" colspan="8">Loading published lender data…</td></tr>';
  fetch("/api/lenders", { headers: { accept: "application/json" } })
    .then((response) => { if (!response.ok) throw new Error("Lender data request failed"); return response.json(); })
    .then((data) => {
      lenders = Array.isArray(data) ? data.filter((item) => item?.published !== false) : [];
      lenders.forEach((lender) => lenderFilter.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(lender.slug)}">${escapeHtml(lender.name)}</option>`));
      render();
    })
    .catch(() => {
      status.textContent = "We could not load lender data right now. Please refresh and try again.";
      rows.innerHTML = '<tr><td class="rate-empty" colspan="8">Lender data is temporarily unavailable.</td></tr>';
    });
  [lenderFilter, typeFilter, amountFilter, tenureFilter].forEach((input) => input.addEventListener("change", render));
})();
