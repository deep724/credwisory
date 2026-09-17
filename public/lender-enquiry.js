/* Keep historical lender-enquiry links working without retaining a second form. */
(() => {
  const lender = new URLSearchParams(location.search).get("lender");
  location.replace(`/apply${lender ? `?lender=${encodeURIComponent(lender)}` : ""}`);
})();
