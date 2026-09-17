(() => {
  const title = document.getElementById("journey-title");
  const section = title?.closest("section");
  if (!section) return;
  const steps = [
    ["01", "Check eligibility", "Share a few essentials so you can understand suitable education-loan routes.", "⌁"],
    ["02", "Talk to an expert", "Discuss your study plans, funding needs, and questions with an education-loan expert.", "◌"],
    ["03", "Compare lender options", "Review relevant lender routes, terms, and collateral considerations with clarity.", "⇄"],
    ["04", "Prepare your application", "Organise your application with guided support when you are ready to proceed.", "▤"],
    ["05", "Move toward sanction", "Stay informed as the lender reviews your application and communicates next steps.", "✓"],
  ];
  section.className = "cw-home-journey";
  section.id = "how-it-works";
  document.querySelectorAll('a[href="#journey-title"]').forEach((link) => { link.setAttribute("href", "#how-it-works"); });
  section.innerHTML = `<div class="cw-home-journey__heading"><p>EDUCATION LOAN GUIDANCE</p><h2 id="journey-title">A clearer loan journey, step by step.</h2><span>From your first questions to lender review, each step helps you make a more informed choice.</span></div><ol>${steps.map(([number, heading, copy, icon]) => `<li><article tabindex="0"><span class="cw-home-journey__number">${number}</span><i aria-hidden="true">${icon}</i><h3>${heading}</h3><p>${copy}</p></article></li>`).join("")}</ol><a class="cw-home-journey__cta" href="eligibility.html">Check your eligibility <span aria-hidden="true">→</span></a>`;
})();
