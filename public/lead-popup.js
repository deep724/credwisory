/* Session-scoped, accessible homepage contact prompt. */
(() => {
  document.querySelectorAll("article").forEach((card) => {
    const title = card.querySelector("h3")?.textContent?.trim();
    const slugs = { "Union Bank of India": "union-bank-of-india", "State Bank of India": "state-bank-of-india", InCred: "incred" };
    if (!title || !slugs[title] || card.closest("#lender-explorer")) return;
    card.classList.add("cw-featured-lender"); card.tabIndex = 0; card.setAttribute("role", "link");
    const open = () => { location.href = "compare-all-lenders.html?lender=" + encodeURIComponent(slugs[title]); };
    card.addEventListener("click", open); card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
  });
  if (sessionStorage.getItem("cw-lead-popup-dismissed")) return;
  const close = () => { dialog.remove(); sessionStorage.setItem("cw-lead-popup-dismissed", "1"); };
  const dialog = document.createElement("div");
  dialog.className = "cw-lead-popup"; dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-labelledby", "cw-popup-title");
  dialog.innerHTML = '<div class="cw-lead-popup__card"><button class="cw-lead-popup__close" type="button" aria-label="Close">×</button><p>EDUCATION LOAN GUIDANCE</p><h2 id="cw-popup-title">Plan your next step with clarity.</h2><span>Share your contact details and an expert can help you explore relevant education-loan options.</span><form><label>Full name<input name="name" required autocomplete="name"></label><label>Mobile number<input name="mobile" required inputmode="numeric" pattern="[6-9][0-9]{9}" autocomplete="tel"></label><label>Email address<input name="email" required type="email" autocomplete="email"></label><button>Talk to an expert</button><small role="status" aria-live="polite"></small></form></div>';
  const form = dialog.querySelector("form"), closeButton = dialog.querySelector("button");
  closeButton.addEventListener("click", close); dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && dialog.isConnected) close(); });
  form.addEventListener("submit", async (event) => { event.preventDefault(); if (!form.checkValidity()) return form.reportValidity(); const data = Object.fromEntries(new FormData(form)); const status = form.querySelector("small"), button = form.querySelector("button"); button.disabled = true; status.textContent = ""; try { const response = await fetch("/api/leads", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ kind:"CONTACT", name:data.name, mobile:data.mobile, email:data.email, sourcePage:"/", payload:{ consent:false } }) }); if (!response.ok) throw new Error(); status.textContent = "Thanks — we’ll be in touch shortly."; sessionStorage.setItem("cw-lead-popup-dismissed", "1"); } catch { status.textContent = "We couldn’t send that right now. Please try again."; button.disabled = false; } });
  setTimeout(() => { if (!document.hidden && !sessionStorage.getItem("cw-lead-popup-dismissed")) document.body.append(dialog); }, 12000);
})();
