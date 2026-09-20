(() => {
  const slot = document.querySelector("#contact-form-slot");
  const panel = document.querySelector("#contact-panel");
  const maxBytes = 5 * 1024 * 1024;
  const extensions = ["pdf", "doc", "docx"];
  const modes = {
    expert: { hash: "#talk-to-expert", tab: document.querySelector("#expert-tab") },
    credwisory: { hash: "#work-with-credwisory", tab: document.querySelector("#credwisory-tab") },
    resume: { hash: "#submit-resume", tab: document.querySelector("#resume-tab") },
  };
  let activeMode = null;

  if (!slot || !panel || Object.values(modes).some(({ tab }) => !tab)) return;

  const setError = (field, message = "") => {
    field.setAttribute("aria-invalid", String(Boolean(message)));
    const target = field.closest("label")?.querySelector(".field-error");
    if (target) target.textContent = message;
  };
  const contactForm = (mode) => mode === "expert"
    ? `<h2>Talk to an expert</h2><p>Share a few details and our team will get in touch.</p><form data-mode="expert" novalidate><label>Full Name<input name="fullName" autocomplete="name" required><small class="field-error"></small></label><label>Phone Number<input name="phone" inputmode="numeric" autocomplete="tel" required><small class="field-error"></small></label><label>Email Address<input name="email" type="email" autocomplete="email" required><small class="field-error"></small></label><label>Study Destination<select name="destination"><option value="">Select destination</option><option>United States</option><option>United Kingdom</option><option>Canada</option><option>Germany</option><option>Australia</option><option>Other</option></select><small class="field-error"></small></label><label class="wide">How can we help?<select name="interest" required><option value="">Select an option</option><option>Education loan guidance</option><option>Lender comparison</option><option>Scholarship guidance</option><option>Loan takeover guidance</option><option>Application support</option></select><small class="field-error"></small></label><label class="wide">Message / Requirements<textarea name="message"></textarea><small class="field-error"></small></label><label class="consent wide"><input name="consent" type="checkbox" required>I agree to be contacted by Credwisory regarding my enquiry.</label><p class="error" hidden role="alert"></p><button class="contact-submit" type="submit"><span class="cta-label">Request a callback</span><span class="cta-icon" aria-hidden="true">→</span></button></form>`
    : `<h2>Work with Credwisory</h2><p>Tell us about your business goals and our team will be in touch.</p><form data-mode="credwisory" novalidate><label>Full Name<input name="fullName" autocomplete="name" required><small class="field-error"></small></label><label>Business / Company Name<input name="company" required><small class="field-error"></small></label><label>Email Address<input name="email" type="email" autocomplete="email" required><small class="field-error"></small></label><label>Phone Number<input name="phone" inputmode="numeric" autocomplete="tel" required><small class="field-error"></small></label><label>Service or Partnership Interest<select name="interest" required><option value="">Select an option</option><option>Lender / financial partnership</option><option>Business advisory</option><option>Growth partnership</option><option>Technology or referral partnership</option></select><small class="field-error"></small></label><label>Monthly Revenue / Business Size (optional)<select name="businessSize"><option value="">Select if applicable</option><option>Pre-revenue / early stage</option><option>Up to ₹10 lakh</option><option>₹10 lakh – ₹1 crore</option><option>Above ₹1 crore</option></select><small class="field-error"></small></label><label class="wide">Message / Requirements<textarea name="message" required></textarea><small class="field-error"></small></label><label class="consent wide"><input name="consent" type="checkbox" required>I agree to be contacted by Credwisory regarding this enquiry.</label><p class="error" hidden role="alert"></p><button class="contact-submit" type="submit"><span class="cta-label">Request a consultation</span><span class="cta-icon" aria-hidden="true">→</span></button></form>`;
  const resumeForm = () => `<h2>Submit Your Resume</h2><p>Share your details and resume for future opportunities with Credwisory.</p><form id="resume-form" data-lead-submit="managed" novalidate enctype="multipart/form-data"><input class="resume-honeypot" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><label>Full Name<input name="name" autocomplete="name" required><small class="field-error"></small></label><label>Email Address<input name="email" type="email" autocomplete="email" required><small class="field-error"></small></label><label>Phone Number<input name="phone" inputmode="numeric" autocomplete="tel" required><small class="field-error"></small></label><label class="wide">Resume upload<input name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required aria-describedby="resume-file-help"><small id="resume-file-help">PDF, DOC, or DOCX · Maximum 5 MB</small><small class="field-error"></small></label><p class="resume-file-name wide" aria-live="polite">No file selected</p><p class="error resume-status" hidden role="status" tabindex="-1"></p><button class="contact-submit" type="submit"><span class="cta-label">Submit Resume</span><span class="cta-icon" aria-hidden="true">→</span></button></form>`;
  const validateContact = (form) => {
    let first;
    const valid = [...form.querySelectorAll("input[required],select[required],textarea[required]")].every((field) => {
      let message = "";
      if (field.type === "checkbox") message = field.checked ? "" : "Please provide your consent to continue.";
      else if (field.name === "phone") message = /^\d{10}$/.test(field.value.replace(/\D/g, "")) ? "" : "Enter a valid 10-digit mobile number.";
      else if (field.type === "email") message = field.validity.valid ? "" : "Enter a valid email address.";
      else message = field.value.trim() ? "" : "This field is required.";
      setError(field, message);
      if (message && !first) first = field;
      return !message;
    });
    if (!valid) first?.focus();
    return valid;
  };
  const bindContactForm = (mode) => {
    const form = slot.querySelector("form");
    const alert = form.querySelector(".error");
    const button = form.querySelector(".contact-submit");
    form.querySelectorAll("input,select,textarea").forEach((field) => field.addEventListener("input", () => {
      if (field.name === "phone") field.value = field.value.replace(/\D/g, "").slice(0, 10);
      setError(field);
    }));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      alert.hidden = true;
      if (button.disabled || !validateContact(form)) { alert.textContent = "Please review the highlighted fields."; alert.hidden = false; return; }
      const data = Object.fromEntries(new FormData(form));
      button.disabled = true;
      button.classList.add("is-loading");
      button.querySelector(".cta-label").textContent = "Sending request";
      try {
        const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "CONTACT", name: data.fullName, email: data.email, mobile: String(data.phone).replace(/\D/g, ""), sourcePage: "/contact", payload: { ...data, consent: true, subject: mode === "expert" ? "Talk to an Expert" : "Work with Credwisory" } }) });
        if (!response.ok) throw new Error();
        slot.innerHTML = `<p class="success" role="status" tabindex="-1">Thank you. Your ${mode === "expert" ? "callback" : "consultation"} request has been received. Our team will contact you shortly.</p>`;
        slot.querySelector(".success").focus();
      } catch {
        alert.textContent = "We could not send your request right now. Please try again.";
        alert.hidden = false;
      } finally {
        button.disabled = false;
        button.classList.remove("is-loading");
        button.querySelector(".cta-label").textContent = mode === "expert" ? "Request a callback" : "Request a consultation";
      }
    });
  };
  const bindResumeForm = () => {
    const form = slot.querySelector("#resume-form");
    const fileField = form.elements.resume;
    const status = form.querySelector(".resume-status");
    const fileName = form.querySelector(".resume-file-name");
    const button = form.querySelector("button");
    const validateField = (field) => {
      let message = !field.value.trim() ? "This field is required." : "";
      if (!message && field.type === "email" && !field.validity.valid) message = "Enter a valid email address.";
      if (!message && field.name === "phone" && !/^[6-9]\d{9}$/.test(field.value.replace(/\D/g, ""))) message = "Enter a valid 10-digit mobile number.";
      setError(field, message);
      return !message;
    };
    const validateFile = () => {
      const file = fileField.files[0];
      const message = !file ? "Please choose your resume." : !extensions.includes(file.name.split(".").pop()?.toLowerCase()) ? "Unsupported file type. Upload a PDF, DOC, or DOCX file." : file.size > maxBytes ? "Your resume must be 5 MB or smaller." : "";
      setError(fileField, message);
      fileName.textContent = file ? `Selected: ${file.name}` : "No file selected";
      return !message;
    };
    form.querySelectorAll("input:not([type=file]):not([type=hidden])").forEach((field) => field.addEventListener("input", () => { if (field.name === "phone") field.value = field.value.replace(/\D/g, "").slice(0, 10); validateField(field); }));
    fileField.addEventListener("change", validateFile);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const valid = [...form.querySelectorAll("input:not([type=file]):not([type=hidden])")].map(validateField).every(Boolean) && validateFile();
      if (!valid) { status.hidden = true; form.querySelector("[aria-invalid=true]")?.focus(); return; }
      button.disabled = true;
      button.classList.add("is-loading");
      button.querySelector(".cta-label").textContent = "Submitting resume";
      status.hidden = true;
      try {
        const response = await fetch("/api/resume-leads", { method: "POST", body: new FormData(form) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "We could not submit your resume.");
        form.reset();
        fileName.textContent = "No file selected";
        status.className = "success resume-status";
        status.textContent = "Thank you — your resume has been submitted successfully.";
      } catch (error) {
        status.className = "error resume-status";
        status.textContent = error instanceof Error ? error.message : "We could not submit your resume. Please try again.";
      } finally {
        button.disabled = false;
        button.classList.remove("is-loading");
        button.querySelector(".cta-label").textContent = "Submit Resume";
        status.hidden = false;
        status.focus();
      }
    });
  };
  const resolveMode = () => Object.entries(modes).find(([, config]) => config.hash === location.hash)?.[0] || "expert";
  const render = (mode, scroll = false) => {
    if (!modes[mode]) return;
    activeMode = mode;
    Object.entries(modes).forEach(([name, config]) => {
      const active = name === mode;
      config.tab.setAttribute("aria-selected", String(active));
      config.tab.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", modes[mode].tab.id);
    slot.innerHTML = mode === "resume" ? resumeForm() : contactForm(mode);
    if (mode === "resume") bindResumeForm(); else bindContactForm(mode);
    if (scroll) requestAnimationFrame(() => panel.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const syncFromLocation = (scroll = false) => render(resolveMode(), scroll);
  const navigate = (mode) => {
    if (location.hash === modes[mode].hash) syncFromLocation(true);
    else location.hash = modes[mode].hash;
  };

  Object.entries(modes).forEach(([mode, config]) => config.tab.addEventListener("click", () => navigate(mode)));
  const tabs = Object.values(modes).map(({ tab }) => tab);
  tabs.forEach((tab, index) => tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    navigate(Object.entries(modes).find(([, config]) => config.tab === next)[0]);
  }));
  addEventListener("hashchange", () => syncFromLocation(true));
  addEventListener("popstate", () => syncFromLocation(true));
  if (!location.hash || !Object.values(modes).some(({ hash }) => hash === location.hash)) {
    const legacyMode = new URLSearchParams(location.search).get("tab");
    const fallback = legacyMode === "credwisory" ? "credwisory" : legacyMode === "resume" ? "resume" : "expert";
    history.replaceState(null, "", `/contact${modes[fallback].hash}`);
    dispatchEvent(new Event("hashchange"));
  }
  syncFromLocation(Boolean(location.hash));
})();
