(() => {
  const root = document.getElementById("applyWithUsContent");
  if (!root) return;
  const slug = new URLSearchParams(location.search).get("lender") || "";
  const safe = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const readable = (value) => String(value || "LNLenders").replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
  let lenderName = slug ? readable(slug) : "LNLenders";
  let submitting = false;

  const input = (name, label, options = {}) => {
    const { type = "text", required = false, placeholder = "", wide = false, select = [], currency = false, min = "", inputMode = "" } = options;
    const control = select.length ? `<select name="${name}" ${required ? "required" : ""}><option value="">Select an option</option>${select.map((item) => `<option value="${safe(item)}">${safe(item)}</option>`).join("")}</select>` : `<input name="${name}" type="${type}" ${min ? `min="${min}"` : ""} ${inputMode ? `inputmode="${inputMode}"` : ""} placeholder="${safe(placeholder)}" ${required ? "required" : ""}>`;
    return `<label class="cw-apply-field ${wide ? "wide" : ""}"><span>${label}${required ? ' <b class="cw-apply-required" aria-hidden="true">*</b>' : ""}</span>${currency ? `<span class="cw-apply-currency"><b aria-hidden="true">₹</b>${control}</span>` : control}<span class="cw-apply-error" aria-live="polite"></span></label>`;
  };

  function render() {
    root.innerHTML = `<section class="cw-apply-card" aria-labelledby="apply-title"><header class="cw-apply-head"><div><p class="cw-apply-eyebrow">LENDER APPLICATION</p><h1 id="apply-title">Apply With LNLenders</h1><p>Complete this secure application in a few simple steps. Our lending team will review your details and contact you shortly.</p></div><span class="cw-apply-lender" id="selectedLender">${safe(lenderName)}</span></header><div class="cw-apply-steps" aria-label="Application progress"><span class="cw-apply-step active" data-step-indicator="1"><i>1</i><span>Contact details</span></span><span class="cw-apply-step" data-step-indicator="2"><i>2</i><span>Loan details</span></span><span class="cw-apply-step" data-step-indicator="3"><i>3</i><span>Review &amp; submit</span></span></div><form class="cw-apply-form" data-lead-submit="managed" novalidate><input type="hidden" name="lender" value="${safe(slug)}"><section class="cw-apply-pane" data-pane="1"><h2>Contact details</h2><p>Tell us the best way to reach you.</p><div class="cw-apply-fields">${input("fullName", "Full name", { required: true, placeholder: "Your full name", wide: true })}${input("email", "Email address", { type: "email", required: true, placeholder: "name@example.com" })}${input("mobile", "Mobile number", { type: "tel", required: true, inputMode: "numeric", placeholder: "10-digit mobile number" })}${input("company", "Company name", { placeholder: "Optional" })}<fieldset class="cw-apply-field"><legend>Preferred contact method <b class="cw-apply-required" aria-hidden="true">*</b></legend><div class="cw-apply-choice"><label><input type="radio" name="contactMethod" value="Phone" required checked> Phone</label><label><input type="radio" name="contactMethod" value="Email"> Email</label><label><input type="radio" name="contactMethod" value="WhatsApp"> WhatsApp</label></div><span class="cw-apply-error" aria-live="polite"></span></fieldset></div></section><section class="cw-apply-pane" data-pane="2" hidden><h2>Loan details</h2><p>These details help us assess the most suitable lending path.</p><div class="cw-apply-fields">${input("loanPurpose", "Loan purpose", { required: true, select: ["Education loan", "Personal loan", "Business loan", "Home loan", "Vehicle loan", "Other"] })}${input("loanAmount", "Required loan amount", { type: "number", required: true, min: "1", inputMode: "decimal", placeholder: "e.g. 500000", currency: true })}${input("monthlyIncome", "Monthly income", { type: "number", required: true, min: "1", inputMode: "decimal", placeholder: "e.g. 75000", currency: true })}${input("employmentType", "Employment type", { required: true, select: ["Salaried", "Self-employed", "Student", "Business owner", "Other"] })}${input("cityState", "City / State", { required: true, placeholder: "e.g. Pune, Maharashtra", wide: true })}${input("creditScoreRange", "Credit score range", { select: ["Below 550", "550–649", "650–699", "700–749", "750+", "Prefer not to say"] })}${input("existingEmi", "Existing loans / EMI amount", { type: "number", min: "0", inputMode: "decimal", placeholder: "Optional", currency: true })}</div></section><section class="cw-apply-pane" data-pane="3" hidden><h2>Review &amp; submit</h2><p>Confirm your details and consent before sending your application.</p><div class="cw-apply-review" aria-live="polite"></div><div class="cw-apply-consent"><label><input name="contactConsent" type="checkbox" required><span>I agree to be contacted by LNLenders regarding my application. <b class="cw-apply-required" aria-hidden="true">*</b></span></label><span class="cw-apply-error" data-error="contactConsent" aria-live="polite"></span><label><input name="policyAccepted" type="checkbox"><span>I have read and accept the <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a> and Terms.</span></label></div></section><p class="cw-apply-message" role="alert" hidden></p><div class="cw-apply-actions"><button class="cw-apply-secondary" type="button" data-back hidden>Back</button><button class="cw-apply-primary" type="button" data-next>Continue</button><button class="cw-apply-primary" type="submit" data-submit hidden>Submit Application</button></div></form></section>`;
  }

  function errorFor(control, message) {
    const wrapper = control.closest(".cw-apply-field") || control.closest(".cw-apply-consent");
    const output = wrapper?.querySelector(".cw-apply-error");
    control.setAttribute("aria-invalid", String(Boolean(message)));
    if (output) output.textContent = message || "";
  }

  function mount() {
    const form = root.querySelector("form");
    const back = form.querySelector("[data-back]");
    const next = form.querySelector("[data-next]");
    const submit = form.querySelector("[data-submit]");
    const message = form.querySelector(".cw-apply-message");
    const panes = [...form.querySelectorAll(".cw-apply-pane")];
    const indicators = [...root.querySelectorAll("[data-step-indicator]")];
    const income = form.elements.monthlyIncome;
    let step = 1;

    const showStep = (newStep) => {
      step = newStep;
      panes.forEach((pane) => { pane.hidden = Number(pane.dataset.pane) !== step; });
      indicators.forEach((indicator) => { const value = Number(indicator.dataset.stepIndicator); indicator.classList.toggle("active", value === step); indicator.classList.toggle("complete", value < step); indicator.querySelector("i").textContent = value < step ? "✓" : String(value); });
      back.hidden = step === 1;
      next.hidden = step === 3;
      submit.hidden = step !== 3;
      if (step === 3) updateReview(form);
      form.querySelector(`[data-pane="${step}"] input, [data-pane="${step}"] select`)?.focus();
    };
    const validate = (pane) => {
      const controls = [...form.querySelectorAll(`[data-pane="${pane}"] input[required], [data-pane="${pane}"] select[required]`)];
      let first = null;
      let valid = true;
      controls.forEach((control) => {
        if (control.name === "mobile") control.value = control.value.replace(/\D/g, "").slice(0, 10);
        const invalidIncome = control.name === "monthlyIncome" && (!/^\d+(\.\d+)?$/.test(control.value) || Number(control.value) <= 0);
        const invalidMobile = control.name === "mobile" && control.value && !/^[6-9]\d{9}$/.test(control.value);
        const text = invalidIncome ? "Monthly income must be greater than 0." : invalidMobile ? "Enter a valid 10-digit mobile number." : control.validity.valid ? "" : "Please complete this field.";
        errorFor(control, text);
        if (text) { valid = false; first ||= control; }
      });
      first?.focus();
      return valid;
    };

    const blockInvalidIncome = (event) => {
      if (["-", "+", "e", "E"].includes(event.key)) { event.preventDefault(); errorFor(income, "Monthly income must be greater than 0."); }
      if (event.key === "ArrowDown" && Number(income.value || 1) <= 1) { event.preventDefault(); errorFor(income, "Monthly income must be greater than 0."); }
    };
    income.addEventListener("keydown", blockInvalidIncome);
    income.addEventListener("paste", (event) => { const value = event.clipboardData?.getData("text") || ""; if (value.includes("-") || Number(value) <= 0) { event.preventDefault(); errorFor(income, "Monthly income must be greater than 0."); } });
    income.addEventListener("input", () => { if (!/^\d*(\.\d*)?$/.test(income.value)) income.value = income.value.replace(/[^\d.]/g, ""); const invalid = income.value && Number(income.value) <= 0; errorFor(income, invalid ? "Monthly income must be greater than 0." : ""); });
    form.addEventListener("input", (event) => { const control = event.target; if (control.matches("input,select") && control !== income) errorFor(control, ""); });
    next.addEventListener("click", () => { if (validate(step)) showStep(step + 1); });
    back.addEventListener("click", () => showStep(step - 1));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting || !validate(3)) return;
      submitting = true;
      submit.disabled = true;
      submit.textContent = "Submitting…";
      message.hidden = true;
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = { ...data, lender: slug, lenderName, applicationSource: "Apply With Us lender form" };
      try {
        const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "LENDER_ENQUIRY", name: String(data.fullName || "").trim(), email: String(data.email || "").trim(), mobile: String(data.mobile || "").replace(/\D/g, ""), sourcePage: location.pathname, payload }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error();
        form.innerHTML = '<section class="cw-apply-success" role="status" aria-live="polite"><i aria-hidden="true">✓</i><h2>Application received</h2><p>Thank you — your application has been received. Our lending team will contact you shortly.</p><a class="cw-apply-primary" href="index.html">Back to Home</a></section>';
      } catch {
        message.textContent = "We could not submit your application right now. Please check your connection and try again.";
        message.hidden = false;
        submit.disabled = false;
        submit.textContent = "Submit Application";
        submitting = false;
      }
    });
    showStep(1);
  }

  function updateReview(form) {
    const data = new FormData(form);
    const review = form.querySelector(".cw-apply-review");
    const fields = [["Lender", lenderName], ["Name", data.get("fullName")], ["Email", data.get("email")], ["Mobile", data.get("mobile")], ["Loan purpose", data.get("loanPurpose")], ["Required amount", data.get("loanAmount")], ["Monthly income", data.get("monthlyIncome")], ["Employment", data.get("employmentType")], ["Location", data.get("cityState")]];
    review.innerHTML = fields.map(([label, value]) => `<div><span>${safe(label)}</span><b>${safe(value || "Not provided")}</b></div>`).join("");
  }

  render();
  mount();
  if (slug) fetch("/api/lenders", { headers: { accept: "application/json" } }).then((response) => response.ok ? response.json() : []).then((items) => { const lender = Array.isArray(items) && items.find((item) => String(item.slug || item._id) === slug); if (!lender?.name) return; lenderName = lender.name; const badge = document.getElementById("selectedLender"); if (badge) badge.textContent = lenderName; }).catch(() => {});
})();
