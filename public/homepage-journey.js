(() => {
  const title = document.getElementById("journey-title");
  const section = title?.closest("section");
  if (!section) return;

  const icons = {
    eligibility: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 3 5 6v5c0 4.4 2.9 8.2 7 10 4.1-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m9.5 12 1.7 1.7 3.5-3.7"/></svg>',
    call: '<svg viewBox="0 0 24 24" focusable="false"><path d="M6.5 3.5 9 6 7.5 8.5a14 14 0 0 0 8 8L18 15l2.5 2.5-2 3a2 2 0 0 1-2.1.9C8.7 19.7 4.3 15.3 2.6 7.6a2 2 0 0 1 .9-2.1l3-2Z"/></svg>',
    compare: '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 4H4v3M4 7l4-4M17 20h3v-3m0 0-4 4M4 17v3h3m-3 0 4-4M20 7V4h-3m3 0-4 4"/><path d="M9 8h6M9 12h6M9 16h6"/></svg>',
    application: '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M9 13h6M9 17h4"/></svg>',
    sanction: '<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/></svg>',
    disbursement: '<svg viewBox="0 0 24 24" focusable="false"><path d="M3 8h18M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M8 15h3M14 12h3M15.5 10.5v3"/></svg>',
    support: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 12h3v6H5a1 1 0 0 1-1-1v-5ZM20 12h-3v6h2a1 1 0 0 0 1-1v-5ZM17 18a5 5 0 0 1-5 3h-1"/></svg>',
  };

  const steps = [
    ["01", "Check eligibility", "Share a few essentials so you can understand suitable education-loan routes.", icons.eligibility],
    ["02", "Talk to an expert", "Discuss your study plans, funding needs, and questions with an education-loan expert.", icons.call],
    ["03", "Compare lender options", "Review relevant lender routes, terms, and collateral considerations with clarity.", icons.compare],
    ["04", "Prepare your application", "Organise your application with guided support when you are ready to proceed.", icons.application],
    ["05", "Move toward sanction", "Stay informed as the lender reviews your application and communicates next steps.", icons.sanction],
    ["06", "Loan disbursement", "Finalise your disbursement date and plan your university payment. We help you complete the process and get your loan disbursed by the lender.", icons.disbursement],
    ["07", "After-sales service", "Credwisory stays with you even after disbursement, until your loan is repaid. Whether it is visa cancellation, early loan closure, extra EMI payments, or further disbursements, we support you at every stage of your loan journey.", icons.support],
  ];

  section.className = "cw-home-journey";
  section.id = "how-it-works";
  document.querySelectorAll('a[href="#journey-title"]').forEach((link) => link.setAttribute("href", "#how-it-works"));
  section.innerHTML = `<div class="cw-home-journey__heading"><p>EDUCATION LOAN GUIDANCE</p><h2 id="journey-title">A clearer loan journey, step by step.</h2><span>From your first questions to lender review, each step helps you make a more informed choice.</span></div><section class="cw-home-journey__carousel" role="region" aria-roledescription="carousel" aria-labelledby="journey-title" tabindex="0"><div class="cw-home-journey__viewport"><ol id="journey-track">${steps.map(([number, heading, copy, icon], index) => `<li aria-label="Step ${index + 1} of ${steps.length}"><article><span class="cw-home-journey__number">${number}</span><i aria-hidden="true">${icon}</i><h3>${heading}</h3><p>${copy}</p></article></li>`).join("")}</ol></div><div class="cw-home-journey__controls"><button class="cw-home-journey__arrow" type="button" data-direction="previous" aria-controls="journey-track" aria-label="Show previous loan guidance step"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><p class="cw-home-journey__progress" aria-live="polite" aria-atomic="true"></p><button class="cw-home-journey__arrow" type="button" data-direction="next" aria-controls="journey-track" aria-label="Show next loan guidance step"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div></section><a class="cw-home-journey__cta" href="/eligibility">Check your eligibility <span aria-hidden="true">&rarr;</span></a>`;

  const carousel = section.querySelector(".cw-home-journey__carousel");
  const track = section.querySelector("#journey-track");
  const cards = [...track.children];
  const previous = section.querySelector('[data-direction="previous"]');
  const next = section.querySelector('[data-direction="next"]');
  const progress = section.querySelector(".cw-home-journey__progress");
  let current = 0;
  let touchStart = null;

  const cardsPerView = () => window.matchMedia("(max-width: 640px)").matches ? 1 : window.matchMedia("(max-width: 900px)").matches ? 2 : 4;
  const maxStart = () => Math.max(0, cards.length - cardsPerView());
  const stepWidth = () => cards[0].getBoundingClientRect().width + Number.parseFloat(getComputedStyle(track).gap || "0");

  const render = (announce = false) => {
    current = Math.min(Math.max(current, 0), maxStart());
    track.style.transform = `translateX(-${current * stepWidth()}px)`;
    const first = current + 1;
    const last = Math.min(current + cardsPerView(), cards.length);
    progress.textContent = `${first}\u2013${last} of ${cards.length}`;
    previous.disabled = current === 0;
    next.disabled = current === maxStart();
    if (announce) progress.setAttribute("aria-label", `Showing steps ${first} through ${last} of ${cards.length}`);
  };

  previous.addEventListener("click", () => { current -= 1; render(true); });
  next.addEventListener("click", () => { current += 1; render(true); });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); current -= 1; render(true); }
    if (event.key === "ArrowRight") { event.preventDefault(); current += 1; render(true); }
  });
  carousel.addEventListener("pointerdown", (event) => { touchStart = event.clientX; });
  carousel.addEventListener("pointerup", (event) => {
    if (touchStart === null) return;
    const distance = event.clientX - touchStart;
    touchStart = null;
    if (Math.abs(distance) < 40) return;
    current += distance < 0 ? 1 : -1;
    render(true);
  });
  carousel.addEventListener("pointercancel", () => { touchStart = null; });
  window.addEventListener("resize", () => render());
  render();
})();
