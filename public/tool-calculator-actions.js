/* Submit affordance for standalone calculators; calculation logic remains in tool-calculators.js. */
(() => {
  document.querySelectorAll("[data-calculator-submit]").forEach((button) => {
    button.addEventListener("click", () => {
      const firstInput = document.querySelector(".calculator-shell input");
      firstInput?.dispatchEvent(new Event("input", { bubbles: true }));
      const error = document.getElementById("calculator-error");
      if (error?.textContent) error.focus?.();
    });
  });
})();
