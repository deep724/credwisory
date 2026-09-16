/* Source-controlled calculator behavior for the public home page. */
(() => {
  const limits = { amount: 100000000, rate: 100, years: 30, fee: 10000000 };
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const $ = (id) => document.getElementById(id);
  const numeric = (id) => {
    const value = String($(id)?.value ?? "").replaceAll(",", "").trim();
    return value === "" || value === "." ? Number.NaN : Number(value);
  };
  const emi = (principal, rate, years) => {
    const months = years * 12;
    const monthlyRate = rate / 1200;
    return monthlyRate === 0 ? principal / months : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
  };
  const text = (id, value) => { const output = $(id); if (output) output.textContent = value; };
  const invalid = (ids, errorId, message) => {
    ids.forEach((id) => $(id)?.setAttribute("aria-invalid", String(Boolean(message))));
    text(errorId, message);
  };
  const validAmount = (value, label) => Number.isFinite(value) && value > 0 && value <= limits.amount ? "" : `${label} must be between ₹1 and ₹${limits.amount.toLocaleString("en-IN")}.`;
  const validRate = (value) => Number.isFinite(value) && value >= 0 && value <= limits.rate ? "" : `Interest rates must be between 0% and ${limits.rate}%.`;
  const validYears = (value) => Number.isFinite(value) && value > 0 && value <= limits.years ? "" : `Tenure must be between 0.1 and ${limits.years} years.`;
  const clear = (ids) => ids.forEach((id) => text(id, "—"));

  const updateEmi = () => {
    const principal = numeric("emi-amount"), rate = numeric("emi-rate"), years = numeric("emi-years");
    const ids = ["emi-amount", "emi-rate", "emi-years"];
    const error = validAmount(principal, "Loan amount") || validRate(rate) || validYears(years);
    invalid(ids, "emi-error", error);
    if (error) return clear(["emi-monthly", "emi-interest", "emi-total"]);
    const monthly = emi(principal, rate, years), total = monthly * years * 12;
    if (!Number.isFinite(monthly) || !Number.isFinite(total)) { invalid(ids, "emi-error", "These values are too large to calculate safely."); return clear(["emi-monthly", "emi-interest", "emi-total"]); }
    text("emi-monthly", currency.format(monthly)); text("emi-interest", currency.format(total - principal)); text("emi-total", currency.format(total));
  };
  const updateTakeover = () => {
    const balance = numeric("takeover-balance"), current = numeric("current-rate"), next = numeric("new-rate"), years = numeric("takeover-years"), fee = numeric("takeover-fee");
    const ids = ["takeover-balance", "current-rate", "new-rate", "takeover-years", "takeover-fee"];
    const error = validAmount(balance, "Outstanding balance") || validRate(current) || validRate(next) || validYears(years) || (!Number.isFinite(fee) || fee < 0 || fee > limits.fee ? `Takeover fee must be between ₹0 and ₹${limits.fee.toLocaleString("en-IN")}.` : "");
    invalid(ids, "takeover-error", error);
    const outputs = ["current-emi", "new-emi", "takeover-savings", "current-total", "new-total", "gross-savings", "net-savings"];
    const note = $("takeover-message");
    if (error) { clear(outputs); if (note) { note.textContent = ""; note.className = "cw-takeover-note"; } return; }
    const currentEmi = emi(balance, current, years), newEmi = emi(balance, next, years), currentTotal = currentEmi * years * 12, newTotal = newEmi * years * 12, gross = currentTotal - newTotal, net = gross - fee;
    if (![currentEmi, newEmi, currentTotal, newTotal, gross, net].every(Number.isFinite)) { invalid(ids, "takeover-error", "These values are too large to calculate safely."); clear(outputs); return; }
    text("current-emi", currency.format(currentEmi)); text("new-emi", currency.format(newEmi)); text("takeover-savings", currency.format(currentEmi - newEmi)); text("current-total", currency.format(currentTotal)); text("new-total", currency.format(newTotal)); text("gross-savings", currency.format(gross)); text("net-savings", currency.format(net));
    if (note) { note.textContent = net > 0 ? `Takeover may be beneficial — estimated net savings are ${currency.format(net)} after fees.` : `Takeover may not be beneficial — estimated additional cost is ${currency.format(Math.abs(net))} after fees.`; note.className = `cw-takeover-note ${net > 0 ? "is-beneficial" : "is-neutral"}`; }
  };
  const bind = (ids, update) => ids.forEach((id) => $(id)?.addEventListener("input", update));
  bind(["emi-amount", "emi-rate", "emi-years"], updateEmi);
  bind(["takeover-balance", "current-rate", "new-rate", "takeover-years", "takeover-fee"], updateTakeover);
  $("emi-reset")?.addEventListener("click", () => { $("emi-amount").value = "2500000"; $("emi-rate").value = "10"; $("emi-years").value = "10"; updateEmi(); });
  $("takeover-reset")?.addEventListener("click", () => { $("takeover-balance").value = "1800000"; $("current-rate").value = "12.5"; $("new-rate").value = "10"; $("takeover-years").value = "7"; $("takeover-fee").value = "0"; updateTakeover(); });
  document.querySelectorAll(".cw-tab").forEach((tab) => tab.addEventListener("click", () => { const takeover = tab.id === "takeover-tab"; document.querySelectorAll(".cw-tab").forEach((item) => { const selected = item === tab; item.classList.toggle("is-active", selected); item.setAttribute("aria-selected", String(selected)); item.tabIndex = selected ? 0 : -1; }); $("emi-calculator").hidden = takeover; $("takeover-calculator").hidden = !takeover; }));
  updateEmi(); updateTakeover();
})();
