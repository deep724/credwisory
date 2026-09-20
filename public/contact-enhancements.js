(() => {
  const slot = document.querySelector("#contact-form-slot");
  const resumeTab = document.querySelector("#resume-tab");
  const originalTabs = [...document.querySelectorAll("#expert-tab, #credwisory-tab")];
  const maxBytes = 5 * 1024 * 1024;
  const extensions = ["pdf", "doc", "docx"];

  const setError = (field, message = "") => {
    field.setAttribute("aria-invalid", String(Boolean(message)));
    const target = field.closest("label")?.querySelector(".field-error");
    if (target) target.textContent = message;
  };
  const renderResume = () => {
    if (!slot) return;
    originalTabs.forEach((tab) => { tab.setAttribute("aria-selected", "false"); tab.tabIndex = -1; });
    resumeTab.setAttribute("aria-selected", "true");
    resumeTab.tabIndex = 0;
    document.querySelector("#contact-panel")?.setAttribute("aria-labelledby", "resume-tab");
    slot.innerHTML = `<h2>Submit Your Resume</h2><p>Share your details and resume for future opportunities with Credwisory.</p><form id="resume-form" data-lead-submit="managed" novalidate enctype="multipart/form-data"><input class="resume-honeypot" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><label>Full Name<input name="name" autocomplete="name" required><small class="field-error"></small></label><label>Email Address<input name="email" type="email" autocomplete="email" required><small class="field-error"></small></label><label>Phone Number<input name="phone" inputmode="numeric" autocomplete="tel" required><small class="field-error"></small></label><label class="wide">Resume upload<input name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required aria-describedby="resume-file-help"><small id="resume-file-help">PDF, DOC, or DOCX · Maximum 5 MB</small><small class="field-error"></small></label><p class="resume-file-name wide" aria-live="polite">No file selected</p><p class="error resume-status" hidden role="status" tabindex="-1"></p><button class="contact-submit" type="submit"><span class="cta-label">Submit Resume</span><span class="cta-icon" aria-hidden="true">→</span></button></form>`;
    history.replaceState(null, "", "/contact#submit-resume");
    bindResumeForm(slot.querySelector("#resume-form"));
    requestAnimationFrame(() => resumeTab?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
  const validateField = (field) => {
    let message = "";
    if (!field.value.trim()) message = "This field is required.";
    else if (field.type === "email" && !field.validity.valid) message = "Enter a valid email address.";
    else if (field.name === "phone" && !/^[6-9]\d{9}$/.test(field.value.replace(/\D/g, ""))) message = "Enter a valid 10-digit mobile number.";
    setError(field, message);
    return !message;
  };
  function bindResumeForm(form) {
    const fileField = form.elements.resume, status = form.querySelector(".resume-status"), fileName = form.querySelector(".resume-file-name"), button = form.querySelector("button");
    const validateFile = () => {
      const file = fileField.files[0]; let message = "";
      if (!file) message = "Please choose your resume.";
      else if (!extensions.includes(file.name.split(".").pop()?.toLowerCase())) message = "Unsupported file type. Upload a PDF, DOC, or DOCX file.";
      else if (file.size > maxBytes) message = "Your resume must be 5 MB or smaller.";
      setError(fileField, message); fileName.textContent = file ? `Selected: ${file.name}` : "No file selected";
      return !message;
    };
    form.querySelectorAll("input:not([type=file]):not([type=hidden])").forEach((field) => field.addEventListener("input", () => { if (field.name === "phone") field.value = field.value.replace(/\D/g, "").slice(0, 10); validateField(field); }));
    fileField.addEventListener("change", validateFile);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const valid = [...form.querySelectorAll("input:not([type=file]):not([type=hidden])")].map(validateField).every(Boolean) && validateFile();
      if (!valid) { status.hidden = true; form.querySelector("[aria-invalid=true]")?.focus(); return; }
      button.disabled = true; button.classList.add("is-loading"); button.querySelector(".cta-label").textContent = "Submitting resume"; status.hidden = true;
      try {
        const response = await fetch("/api/resume-leads", { method: "POST", body: new FormData(form) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "We could not submit your resume.");
        form.reset(); fileName.textContent = "No file selected"; status.className = "success resume-status"; status.textContent = "Thank you — your resume has been submitted successfully."; status.hidden = false; status.focus();
      } catch (error) {
        status.className = "error resume-status"; status.textContent = error instanceof Error ? error.message : "We could not submit your resume. Please try again."; status.hidden = false; status.focus();
      } finally { button.disabled = false; button.classList.remove("is-loading"); button.querySelector(".cta-label").textContent = "Submit Resume"; }
    });
  }
  resumeTab?.addEventListener("click", renderResume);
  resumeTab?.addEventListener("keydown", (event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); originalTabs[event.key === "ArrowLeft" ? 1 : 0]?.focus(); } });
  originalTabs.forEach((tab) => tab.addEventListener("click", () => { resumeTab.setAttribute("aria-selected", "false"); resumeTab.tabIndex = -1; }));
  const resumeRequested = () => new URLSearchParams(location.search).get("tab") === "resume" || location.hash === "#submit-resume";
  if (resumeRequested()) setTimeout(renderResume, 140);
  addEventListener("hashchange", () => { if (resumeRequested()) renderResume(); });
})();
