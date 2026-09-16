/* Keep the public forms approachable: only name, mobile, and email are required. */
(() => {
  document.querySelectorAll(".top span").forEach((item) => { if (/Mon.{0,3}Sat/i.test(item.textContent || "")) item.remove(); });
  const required = new Set(["name", "fullName", "mobile", "email"]);
  document.querySelectorAll("input, select, textarea").forEach((field) => {
    const key = field.id || field.getAttribute("name") || "";
    if (!required.has(key)) field.removeAttribute("required");
  });
  document.querySelectorAll("label").forEach((label) => {
    const control = label.querySelector("input,select,textarea");
    const key = control?.id || control?.getAttribute("name") || "";
    if (!required.has(key)) label.querySelectorAll(".req").forEach((marker) => marker.remove());
  });
})();
