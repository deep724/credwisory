(() => {
  const form = document.querySelector("#referralForm");
  const status = document.querySelector("#formStatus");
  const phone = /^[6-9]\d{9}$/;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const valid = String(data.get("referrerName")).trim().length > 1 && String(data.get("referredName")).trim().length > 1 && phone.test(String(data.get("referrerPhone"))) && phone.test(String(data.get("referredPhone"))) && data.get("consent") === "on";
    if (!valid) { status.textContent = "Complete all fields, valid mobile numbers, and consent."; return; }
    const button = form.querySelector("button"); button.disabled = true; button.textContent = "Submitting…"; data.set("consent", "true"); const referralCode = new URLSearchParams(location.search).get("ref"); if (referralCode) data.set("ref", referralCode);
    try { const response = await fetch("/api/referrals", { method: "POST", body: data }); const body = await response.json(); if (!response.ok) throw new Error(body.error); const url = new URL(location.href); url.search = `?ref=${body.code}`; document.querySelector("#referralLink").value = url.toString(); document.querySelector("#result").hidden = false; status.textContent = "Referral submitted successfully."; }
    catch (error) { status.textContent = error instanceof Error ? error.message : "We could not submit your referral."; }
    finally { button.disabled = false; button.textContent = "Submit Referral"; }
  });
  document.querySelector("#copyLink").addEventListener("click", async () => { await navigator.clipboard.writeText(document.querySelector("#referralLink").value); status.textContent = "Referral link copied."; });
  document.querySelector("#shareLink").addEventListener("click", async () => { const url = document.querySelector("#referralLink").value; if (navigator.share) await navigator.share({ title: "Credwisory referral", url }); else { await navigator.clipboard.writeText(url); status.textContent = "Referral link copied."; } });
})();
