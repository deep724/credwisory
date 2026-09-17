(() => {
  if (window.__cwLeadPopupLoaded) return;
  window.__cwLeadPopupLoaded = true;

  let prompt, modal, previousFocus, closeTimer, autoPromptShown = false, dismissedForLoad = false;
  const closeModal = () => {
    clearTimeout(closeTimer);
    modal?.querySelector("form")?.reset();
    modal?.remove();
    document.body.classList.remove("cw-modal-open");
    previousFocus?.focus?.();
    modal = undefined;
  };
  const closePrompt = () => {
    dismissedForLoad = true;
    prompt?.remove();
    prompt = undefined;
    document.body.classList.remove("cw-modal-open");
  };
  const openModal = (trigger) => {
    previousFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    prompt?.remove();
    prompt = undefined;
    if (modal?.isConnected) return;

    modal = document.createElement("div");
    modal.className = "cw-lead-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "cw-lead-modal-title");
    modal.innerHTML = `<div class="cw-lead-modal__dialog"><button class="cw-lead-modal__close" type="button" aria-label="Close guidance form">&times;</button><aside class="cw-lead-modal__intro"><div class="cw-lead-logo" aria-label="Credwisory">CREDWISORY<span>EDUCATION FINANCE</span></div><p class="cw-lead-modal__eyebrow">EDUCATION LOAN GUIDANCE</p><h2>Your education journey, made clearer.</h2><ul><li><i aria-hidden="true">~</i><span>Compare trusted lender options</span></li><li><i aria-hidden="true">+</i><span>Get guidance from education-loan experts</span></li><li><i aria-hidden="true">&rarr;</i><span>Find the route that fits your plans</span></li></ul><div class="cw-lead-modal__art" aria-hidden="true"><span></span><b>Clearer choices<br>start here</b></div></aside><section class="cw-lead-modal__form-wrap"><h2 id="cw-lead-modal-title">Start your journey</h2><p>Share a few details and our team will guide you.</p><form novalidate><label>Full Name<input name="name" required autocomplete="name" placeholder="Your full name"></label><label>Email<input name="email" required type="email" autocomplete="email" placeholder="you@example.com"></label><label>Mobile Number<input name="mobile" required inputmode="numeric" pattern="[6-9][0-9]{9}" autocomplete="tel" placeholder="10-digit mobile number"></label><label class="cw-lead-modal__consent"><input name="consent" required type="checkbox"><span>I agree to be contacted by Credwisory regarding my education-loan enquiry.</span></label><button type="submit">Get expert guidance <span aria-hidden="true">&rarr;</span></button><small role="status" aria-live="polite"></small></form></section></div>`;

    const dialog = modal.querySelector(".cw-lead-modal__dialog");
    const form = modal.querySelector("form");
    modal.querySelector(".cw-lead-modal__close").onclick = closeModal;
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") return closeModal();
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled])')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector("small");
      const button = form.querySelector("button");
      const data = Object.fromEntries(new FormData(form));
      const mobile = String(data.mobile || "").replace(/\D/g, "");
      form.elements.mobile.value = mobile;
      if (!form.checkValidity()) {
        status.textContent = "Please complete the required fields and consent to continue.";
        status.className = "is-error";
        return form.reportValidity();
      }
      button.disabled = true;
      status.textContent = "";
      status.className = "";
      try {
        const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "CONTACT", name: data.name, mobile, email: data.email, sourcePage: `${location.pathname}?source=popup`, payload: { consent: true, source: "Homepage guidance modal" } }) });
        if (!response.ok) throw new Error();
        status.textContent = "Thanks - we'll be in touch shortly.";
        status.className = "is-success";
        dismissedForLoad = true;
        closeTimer = setTimeout(() => {
          if (!modal?.isConnected) return;
          modal.classList.add("is-closing");
          closeTimer = setTimeout(closeModal, 220);
        }, 2600);
      } catch {
        status.textContent = "We couldn't send that right now. Please try again.";
        status.className = "is-error";
      } finally { button.disabled = false; }
    });
    form.addEventListener("input", () => {
      const status = form.querySelector("small");
      if (status.classList.contains("is-error")) { status.textContent = ""; status.className = ""; }
    });
    document.body.append(modal);
    document.body.classList.add("cw-modal-open");
    modal.querySelector("input")?.focus();
  };
  const showPrompt = () => {
    if (dismissedForLoad || prompt?.isConnected || modal?.isConnected) return;
    prompt = document.createElement("aside");
    prompt.className = "cw-lead-prompt";
    prompt.setAttribute("role", "dialog");
    prompt.setAttribute("aria-modal", "false");
    prompt.setAttribute("aria-label", "Education loan guidance");
    prompt.innerHTML = `<button class="cw-lead-prompt__close" type="button" aria-label="Dismiss guidance prompt">&times;</button><div class="cw-lead-logo" aria-label="Credwisory">CREDWISORY<span>EDUCATION FINANCE</span></div><h2>Planning your education journey?</h2><p>Get clear guidance for your study-finance plans.</p><button class="cw-lead-prompt__cta" type="button">Get expert guidance <span aria-hidden="true">&rarr;</span></button>`;
    prompt.querySelector(".cw-lead-prompt__close").onclick = closePrompt;
    prompt.querySelector(".cw-lead-prompt__cta").onclick = (event) => openModal(event.currentTarget);
    prompt.addEventListener("keydown", (event) => { if (event.key === "Escape") closePrompt(); });
    document.body.append(prompt);
    document.body.classList.add("cw-modal-open");
  };
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-lead-modal]");
    if (trigger) { event.preventDefault(); openModal(trigger); }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && prompt?.isConnected) closePrompt();
  });
  setTimeout(() => { if (!autoPromptShown) { autoPromptShown = true; showPrompt(); } }, 8000);
})();
