(() => {
  if (window.__cwLeadPopupLoaded) return;
  window.__cwLeadPopupLoaded = true;

  const storageKey = "cw-guidance-popup-dismissed-at";
  const cooldown = 7 * 24 * 60 * 60 * 1000;
  let prompt;

  const recentlyDismissed = () => {
    try {
      const dismissedAt = Number(localStorage.getItem(storageKey));
      return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < cooldown;
    } catch {
      return false;
    }
  };

  const dismiss = () => {
    if (!prompt?.isConnected) return;
    try { localStorage.setItem(storageKey, String(Date.now())); } catch {}
    prompt.classList.add("is-closing");
    const remove = () => { prompt?.remove(); prompt = undefined; };
    prompt.addEventListener("animationend", remove, { once: true });
    window.setTimeout(remove, 220);
  };

  const show = () => {
    if (prompt?.isConnected || recentlyDismissed()) return;
    prompt = document.createElement("aside");
    prompt.className = "cw-lead-prompt";
    prompt.setAttribute("role", "region");
    prompt.setAttribute("aria-label", "Education loan guidance");
    prompt.innerHTML = `
      <button class="cw-lead-prompt__close" type="button" aria-label="Close guidance popup">&times;</button>
      <p class="cw-lead-prompt__eyebrow">EDUCATION LOAN GUIDANCE</p>
      <h2>Planning your education journey?</h2>
      <p>Get clear, practical guidance for your study-finance plans.</p>
      <a class="cw-lead-prompt__cta" href="/talk-to-an-expert">Get expert guidance <span aria-hidden="true">→</span></a>`;
    prompt.querySelector(".cw-lead-prompt__close")?.addEventListener("click", dismiss);
    prompt.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && prompt?.contains(document.activeElement)) dismiss();
    });
    document.body.append(prompt);
  };

  window.setTimeout(show, 8000);
})();
