/* Shared calculator component for the home page and public calculator tools. */
(() => {
  const limits = { amount: 100000000, rate: 100, years: 30, fee: 10000000 };
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  const panelMarkup = () => `
    <div class="cw-calculator-panel">
      <div class="cw-tabs" role="tablist" aria-label="Calculator type">
        <button class="cw-tab is-active" id="emi-tab" type="button" role="tab" aria-selected="true" aria-controls="emi-calculator">Education Loan EMI</button>
        <button class="cw-tab" id="takeover-tab" type="button" role="tab" aria-selected="false" aria-controls="takeover-calculator">Loan Takeover</button>
      </div>
      <div id="emi-calculator" class="cw-calculator-form" role="tabpanel" aria-labelledby="emi-tab">
        <div class="cw-input-grid">
          <div class="cw-input-group"><label for="emi-amount">Loan amount <span>(₹)</span></label><input id="emi-amount" type="text" inputmode="numeric" value="2500000" aria-describedby="emi-error"><p id="emi-error" class="cw-field-error" aria-live="polite"></p></div>
          <div class="cw-input-group"><label for="emi-rate">Annual interest rate <span>(%)</span></label><input id="emi-rate" type="number" min="0" step="0.01" inputmode="decimal" value="10" aria-describedby="emi-error"></div>
          <div class="cw-input-group"><label for="emi-years">Repayment period <span>(years)</span></label><input id="emi-years" type="number" min="0.1" step="0.1" inputmode="decimal" value="10" aria-describedby="emi-error"></div>
        </div>
        <div class="cw-results cw-results-three" aria-live="polite"><div><span>Estimated monthly EMI</span><strong id="emi-monthly">—</strong></div><div><span>Estimated total interest</span><strong id="emi-interest">—</strong></div><div><span>Total repayment amount</span><strong id="emi-total">—</strong></div></div>
        <button class="cw-reset" type="button" id="emi-reset">Reset values</button>
      </div>
      <div id="takeover-calculator" class="cw-calculator-form" role="tabpanel" aria-labelledby="takeover-tab" hidden>
        <div class="cw-input-grid">
          <div class="cw-input-group"><label for="takeover-balance">Outstanding loan balance <span>(₹)</span></label><input id="takeover-balance" type="text" inputmode="numeric" value="1800000" aria-describedby="takeover-error"><p id="takeover-error" class="cw-field-error" aria-live="polite"></p></div>
          <div class="cw-input-group"><label for="current-rate">Current interest rate <span>(%)</span></label><input id="current-rate" type="number" min="0" step="0.01" inputmode="decimal" value="12.5" aria-describedby="takeover-error"></div>
          <div class="cw-input-group"><label for="new-rate">New interest rate <span>(%)</span></label><input id="new-rate" type="number" min="0" step="0.01" inputmode="decimal" value="10" aria-describedby="takeover-error"></div>
          <div class="cw-input-group"><label for="takeover-years">Remaining loan tenure <span>(years)</span></label><input id="takeover-years" type="number" min="0.1" step="0.1" inputmode="decimal" value="7" aria-describedby="takeover-error"></div>
          <div class="cw-input-group"><label for="takeover-fee">Takeover / processing fee <span>(₹)</span></label><input id="takeover-fee" type="text" inputmode="numeric" value="0" aria-describedby="takeover-error"></div>
        </div>
        <div class="cw-results cw-results-takeover" aria-live="polite"><div><span>Current estimated EMI</span><strong id="current-emi">—</strong></div><div><span>New estimated EMI</span><strong id="new-emi">—</strong></div><div><span>Monthly savings</span><strong id="takeover-savings">—</strong></div><div><span>Current remaining cost</span><strong id="current-total">—</strong></div><div><span>New repayment cost</span><strong id="new-total">—</strong></div><div><span>Gross interest savings</span><strong id="gross-savings">—</strong></div><div><span>Net savings after fee</span><strong id="net-savings">—</strong></div></div>
        <p id="takeover-message" class="cw-takeover-note" aria-live="polite"></p><button class="cw-reset" type="button" id="takeover-reset">Reset values</button>
      </div>
      <p class="cw-disclaimer">This is an illustrative estimate. Actual terms, moratorium, and repayments depend on your lender and loan agreement.</p>
    </div>`;

  const mount = (root) => {
    if (root.dataset.calculatorMounted === "true") return;
    if (!root.querySelector(".cw-calculator-panel")) root.innerHTML = panelMarkup();
    root.dataset.calculatorMounted = "true";

    const $ = (id) => root.querySelector(`#${id}`);
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
      const principal = numeric("emi-amount");
      const rate = numeric("emi-rate");
      const years = numeric("emi-years");
      const ids = ["emi-amount", "emi-rate", "emi-years"];
      const error = validAmount(principal, "Loan amount") || validRate(rate) || validYears(years);
      invalid(ids, "emi-error", error);
      if (error) return clear(["emi-monthly", "emi-interest", "emi-total"]);
      const monthly = emi(principal, rate, years);
      const total = monthly * years * 12;
      if (!Number.isFinite(monthly) || !Number.isFinite(total)) {
        invalid(ids, "emi-error", "These values are too large to calculate safely.");
        return clear(["emi-monthly", "emi-interest", "emi-total"]);
      }
      text("emi-monthly", currency.format(monthly));
      text("emi-interest", currency.format(total - principal));
      text("emi-total", currency.format(total));
    };

    const updateTakeover = () => {
      const balance = numeric("takeover-balance");
      const current = numeric("current-rate");
      const next = numeric("new-rate");
      const years = numeric("takeover-years");
      const fee = numeric("takeover-fee");
      const ids = ["takeover-balance", "current-rate", "new-rate", "takeover-years", "takeover-fee"];
      const error = validAmount(balance, "Outstanding balance") || validRate(current) || validRate(next) || validYears(years) || (!Number.isFinite(fee) || fee < 0 || fee > limits.fee ? `Takeover fee must be between ₹0 and ₹${limits.fee.toLocaleString("en-IN")}.` : "");
      invalid(ids, "takeover-error", error);
      const outputs = ["current-emi", "new-emi", "takeover-savings", "current-total", "new-total", "gross-savings", "net-savings"];
      const note = $("takeover-message");
      if (error) {
        clear(outputs);
        if (note) { note.textContent = ""; note.className = "cw-takeover-note"; }
        return;
      }
      const currentEmi = emi(balance, current, years);
      const newEmi = emi(balance, next, years);
      const currentTotal = currentEmi * years * 12;
      const newTotal = newEmi * years * 12;
      const gross = currentTotal - newTotal;
      const net = gross - fee;
      if (![currentEmi, newEmi, currentTotal, newTotal, gross, net].every(Number.isFinite)) {
        invalid(ids, "takeover-error", "These values are too large to calculate safely.");
        return clear(outputs);
      }
      text("current-emi", currency.format(currentEmi)); text("new-emi", currency.format(newEmi)); text("takeover-savings", currency.format(currentEmi - newEmi));
      text("current-total", currency.format(currentTotal)); text("new-total", currency.format(newTotal)); text("gross-savings", currency.format(gross)); text("net-savings", currency.format(net));
      if (note) {
        note.textContent = net > 0 ? `Takeover may be beneficial — estimated net savings are ${currency.format(net)} after fees.` : `Takeover may not be beneficial — estimated additional cost is ${currency.format(Math.abs(net))} after fees.`;
        note.className = `cw-takeover-note ${net > 0 ? "is-beneficial" : "is-neutral"}`;
      }
    };

    const selectTab = (tab) => {
      const takeover = tab.id === "takeover-tab";
      root.querySelectorAll(".cw-tab").forEach((item) => {
        const selected = item === tab;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      $("emi-calculator").hidden = takeover;
      $("takeover-calculator").hidden = !takeover;
    };
    const tabs = [...root.querySelectorAll(".cw-tab")];
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        next.focus();
        selectTab(next);
      });
    });
    ["emi-amount", "emi-rate", "emi-years"].forEach((id) => $(id)?.addEventListener("input", updateEmi));
    ["takeover-balance", "current-rate", "new-rate", "takeover-years", "takeover-fee"].forEach((id) => $(id)?.addEventListener("input", updateTakeover));
    $("emi-reset")?.addEventListener("click", () => { $("emi-amount").value = "2500000"; $("emi-rate").value = "10"; $("emi-years").value = "10"; updateEmi(); });
    $("takeover-reset")?.addEventListener("click", () => { $("takeover-balance").value = "1800000"; $("current-rate").value = "12.5"; $("new-rate").value = "10"; $("takeover-years").value = "7"; $("takeover-fee").value = "0"; updateTakeover(); });
    selectTab(root.dataset.defaultTab === "takeover" ? $("takeover-tab") : $("emi-tab"));
    updateEmi();
    updateTakeover();
  };

  document.querySelectorAll("[data-cw-calculator]").forEach(mount);
  window.CredwisoryCalculator = { mount };
})();
