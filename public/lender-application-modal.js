/* Preserve every existing lender CTA while sending applications to one full page. */
(() => {
  const destination = "/apply";
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("a.lc-apply, a.table-apply[href*='lender-enquiry'], [data-apply]");
    if (!trigger) return;
    const href = trigger.getAttribute("href") || "";
    const lender = new URL(href || location.href, location.href).searchParams.get("lender") || trigger.dataset.apply;
    if (!lender) return;
    event.preventDefault();
    event.stopPropagation();
    location.href = `${destination}?lender=${encodeURIComponent(lender)}`;
  }, true);
})();
