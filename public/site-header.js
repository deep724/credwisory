window.CredwisoryLenders = (() => {
  const key = "credwisorySelectedLenders",
    data = {
      "union-bank-india": {
        name: "Union Bank of India",
        secured: "Up to INR 1.5 crore",
        unsecured: "Up to INR 40 lakh",
        securedRate: "8.1%-9.75%",
        unsecuredRate: "6.95%-10.2%",
      },
      "axis-bank": {
        name: "Axis Bank",
        secured: "Up to INR 2 crore",
        unsecured: "Up to INR 2 crore",
        securedRate: "8%-11.75%",
        unsecuredRate: "9.75%-12.5%",
      },
      "icici-bank": {
        name: "ICICI Bank",
        secured: "Up to INR 3 crore",
        unsecured: "Up to INR 3 crore",
        securedRate: "9%-12.5%",
        unsecuredRate: "9%-12.75%",
      },
      "idfc-bank": {
        name: "IDFC Bank",
        secured: "Up to INR 1 crore",
        unsecured: "Up to INR 1 crore",
        securedRate: "9.5%-11.5%",
        unsecuredRate: "10.25%-13.25%",
      },
      "punjab-national-bank": {
        name: "Punjab National Bank",
        secured: "Up to INR 2 crore",
        unsecured: "Up to INR 8 lakh",
        securedRate: "6.9%-10.45%",
        unsecuredRate: "6.95%-10.2%",
      },
      "bank-of-baroda": {
        name: "Bank of Baroda",
        secured: "Up to INR 4 crore",
        unsecured: "Not available",
        securedRate: "6.9%-10.45%",
        unsecuredRate: "Not available",
      },
      "state-bank-india": {
        name: "State Bank of India",
        secured: "Up to INR 4 crore",
        unsecured: "Up to INR 50 lakh",
        securedRate: "8.9%-9.4%",
        unsecuredRate: "9.4%",
      },
      credila: {
        name: "HDFC Credila",
        secured: "Up to INR 4 crore",
        unsecured: "Up to INR 4 crore",
        securedRate: "9.5%-11.5%",
        unsecuredRate: "8.95%-13%",
      },
      avanse: {
        name: "Avanse",
        secured: "Up to INR 1 crore",
        unsecured: "Up to INR 2 crore",
        securedRate: "10.5%-14%",
        unsecuredRate: "10%-14%",
      },
      incred: {
        name: "InCred",
        secured: "Not available",
        unsecured: "Up to INR 1 crore",
        securedRate: "Not available",
        unsecuredRate: "10.5%-14%",
      },
      auxilo: {
        name: "Auxilo",
        secured: "Up to INR 50 lakh",
        unsecured: "Up to INR 1.2 crore",
        securedRate: "11.5%-12%",
        unsecuredRate: "10.25%-13.5%",
      },
      edgro: {
        name: "Edgro",
        secured: "Not available",
        unsecured: "Up to INR 1 crore",
        securedRate: "Not available",
        unsecuredRate: "11.5%-16%",
      },
      poonawalla: {
        name: "Poonawalla",
        secured: "Up to INR 3 crore",
        unsecured: "Up to INR 1 crore",
        securedRate: "10.5%-12.5%",
        unsecuredRate: "11%-14%",
      },
      "jp-morgan": {
        name: "J.P. Morgan",
        secured: "Not available",
        unsecured: "Not available",
        securedRate: "Not available",
        unsecuredRate: "Not available",
      },
    };
  const get = () => {
      try {
        return JSON.parse(localStorage.getItem(key) || "[]")
          .filter((id) => data[id])
          .slice(0, 4);
      } catch {
        return [];
      }
    },
    set = (ids) =>
      localStorage.setItem(
        key,
        JSON.stringify([...new Set(ids)].filter((id) => data[id]).slice(0, 4)),
      ),
    toggle = (id) => {
      const ids = get();
      set(
        ids.includes(id)
          ? ids.filter((x) => x !== id)
          : ids.length < 4
            ? [...ids, id]
            : ids,
      );
      return get();
    };
  return { key, data, get, set, toggle };
})();
(() => {
  const cleanupKey = "__credwisoryHeaderCleanup";
  const groups = [
    [
      "Education Loans",
      [
        ["Check eligibility", "eligibility.html"],
        ["How education loans work", "how-education-loans-work.html"],
        ["Loan without collateral", "loan-without-collateral.html"],
        ["Loan with collateral", "loan-with-collateral.html"],
      ],
    ],
    [
      "Lenders",
      [
        ["Compare all lenders", "compare-all-lenders.html"],
        ["Bank lenders", "bank-lenders.html"],
        ["NBFC lenders", "nbfc-lenders.html"],
        ["International lenders", "international-lenders.html"],
      ],
    ],
    [
      "Scholarships",
      [
        ["Explore Scholarships", "scholarships.html"],
        ["Scholarship Eligibility", "scholarship-eligibility.html"],
        ["SOP Guidance", "sop-guidance.html"],
        ["Application Guidance", "application-guidance.html"],
      ],
    ],
    [
      "Tools",
      [
        ["EMI Calculator", "emi-calculator.html"],
        ["Car Loan Calculator", "car-loan-calculator.html"],
        ["Loan Takeover Calculator", "loan-takeover-calculator.html"],
        ["Interest Rate Comparison", "interest-rate-comparison.html"],
      ],
    ],
    [
      "Resources",
      [
        ["Blogs", "blogs.html"],
        ["FAQ", "faq.html"],
      ],
    ],
    [
      "Contact",
      [
        ["Talk to an Expert", "talk-to-an-expert.html"],
        ["Refer a Friend", "refer-a-friend.html"],
      ],
    ],
  ];
  const icon =
    '<svg class="cw-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 6 5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const id = (n) => "cw-" + n.toLowerCase().replace(/[^a-z]+/g, "-");
  const group = ([name, links], mobile = false) =>
    `<div class="cw-group"><button class="cw-toggle" type="button" aria-expanded="false" aria-controls="${id(name)}${mobile ? "-mobile" : ""}">${name}${icon}</button><div class="cw-panel" id="${id(name)}${mobile ? "-mobile" : ""}">${links.map(([label, href]) => `<a href="${href}"${name === "Tools" ? " data-tool" : ""}>${label}</a>`).join("")}</div></div>`;
  const markup = () =>
    `<header class="cw-header" data-cw-header="true"><nav class="cw-nav" aria-label="Main navigation"><a class="cw-logo" href="index.html" aria-label="Credwisory home"><i aria-hidden="true"></i><span>Credwisory<small>SOLUTIONS LLP</small></span></a><div class="cw-desktop">${groups.map((g) => group(g)).join("")}</div><a class="cw-cta" href="eligibility.html">Check eligibility</a><button class="cw-burger" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="cw-mobile"><span></span><span></span><span></span></button><div class="cw-mobile" id="cw-mobile">${groups.map((g) => group(g, true)).join("")}</div></nav></header>`;
  const css = `.cw-header{position:sticky!important;top:0;z-index:5000!important;padding:20px max(16px,calc((100% - 1280px)/2));background:#faf9f4;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.cw-nav{position:relative;display:flex;min-height:70px;align-items:center;justify-content:space-between;gap:20px;border:1px solid #fff;border-radius:22px;background:#fff;padding:12px 22px;box-shadow:0 16px 35px #102a5214}.cw-logo{display:flex;align-items:center;gap:10px;color:#f5b91d!important;font-size:21px;font-weight:850;line-height:1;text-decoration:none!important}.cw-logo i{width:40px;height:40px;border-radius:50%;background:#102a52;box-shadow:inset 0 0 0 9px #102a52;outline:3px solid #f5b91d;outline-offset:-13px}.cw-logo small{display:block;margin-top:5px;color:#102a52;font-size:7px;font-weight:800;letter-spacing:.2em}.cw-desktop{display:flex;align-items:center;gap:19px}.cw-group{position:relative}.cw-toggle{display:flex;align-items:center;gap:5px;border:0;background:transparent;color:#102a52;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}.cw-toggle:hover,.cw-toggle:focus-visible{color:#08786e;outline:none}.cw-chevron{width:14px;height:14px;transition:transform .2s}.cw-toggle[aria-expanded=true] .cw-chevron{transform:rotate(180deg)}.cw-panel{position:absolute;top:calc(100% + 11px);left:0;z-index:5100;display:none;width:250px;padding:8px;border:1px solid #dce5e8;border-radius:16px;background:#fff;box-shadow:0 16px 35px #102a5222}.cw-panel.open{display:block}.cw-panel a{display:block;border-radius:10px;padding:10px 12px;color:#102a52;text-decoration:none;font:600 14px Inter,system-ui,sans-serif}.cw-panel a:hover,.cw-panel a:focus-visible{background:#e7f6f1;color:#08786e;outline:none}.cw-cta{border-radius:13px;background:#f5b91d;padding:13px 18px;color:#102a52;text-decoration:none;font:800 14px Inter,system-ui,sans-serif}.cw-burger,.cw-mobile{display:none}@media(max-width:1023px){.cw-header{padding:14px}.cw-desktop,.cw-cta{display:none}.cw-burger{display:grid;width:42px;height:42px;place-content:center;gap:4px;border:1px solid #dce5e8;border-radius:12px;background:#fff}.cw-burger span{width:17px;height:2px;background:#102a52}.cw-mobile{position:absolute;top:calc(100% + 10px);right:0;left:0;display:none;border:1px solid #dce5e8;border-radius:16px;background:#fff;padding:10px;box-shadow:0 16px 35px #102a5222}.cw-mobile.open{display:block}.cw-mobile .cw-group{border-bottom:1px solid #eef2f3}.cw-mobile .cw-toggle{width:100%;justify-content:space-between;padding:11px}.cw-mobile .cw-panel{position:static;width:auto;margin:0 0 8px 10px;border:0;border-left:1px solid #08786e33;border-radius:0;box-shadow:none;padding:0 0 0 8px}.cw-mobile .cw-panel a{padding:9px 10px;color:#5e738f;font-size:13px}}`;
  const mount = () => {
    window[cleanupKey]?.();
    const oldStyle = document.querySelector("style[data-cw-header-style]");
    if (!oldStyle) {
      const style = document.createElement("style");
      style.dataset.cwHeaderStyle = "true";
      style.textContent = css;
      document.head.append(style);
    }
    const controller = new AbortController();
    const { signal } = controller;
    const old = document.querySelector("header[data-cw-header]");
    const wrap = document.createElement("div");
    wrap.innerHTML = markup();
    const header = wrap.firstElementChild;
    if (old) old.replaceWith(header);
    else document.body.prepend(header);
    const mobile = header.querySelector(".cw-mobile");
    const burger = header.querySelector(".cw-burger");
    // The generated navigation owns both controls. Do not bind listeners if a
    // future markup edit omits either one.
    if (!mobile || !burger) return;
    const close = () => {
      header
        .querySelectorAll(".cw-panel.open")
        .forEach((p) => p.classList.remove("open"));
      header
        .querySelectorAll(".cw-toggle")
        .forEach((b) => b.setAttribute("aria-expanded", "false"));
      mobile.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    };
    header.querySelectorAll(".cw-toggle").forEach((button) =>
      button.addEventListener("click", (e) => {
        e.stopPropagation();
          const panelId = button.getAttribute("aria-controls");
          const panel = panelId ? header.querySelector(`#${panelId}`) : null;
          if (!panel) return;
          const open = !panel.classList.contains("open");
        close();
        if (open) {
          panel.classList.add("open");
          button.setAttribute("aria-expanded", "true");
        }
      }),
    );
    burger.addEventListener("click", () => {
      const open = !mobile.classList.contains("open");
      close();
      mobile.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    header.querySelectorAll("[data-tool]").forEach((link) =>
      link.addEventListener("click", (e) => {
        const hash = new URL(link.href, location.href).hash.slice(1),
          [target, q] = hash.split("?"),
          section = document.getElementById(target);
        if (section) {
          e.preventDefault();
          close();
          const tab = q?.includes("takeover")
            ? "takeover-tab"
            : q?.includes("emi")
              ? "emi-tab"
              : null;
          if (tab) document.getElementById(tab)?.click();
          history.pushState({}, "", `#${hash}`);
          const offset = header.getBoundingClientRect().height + 16;
          scrollTo({
            top: section.getBoundingClientRect().top + scrollY - offset,
            behavior: "smooth",
          });
        }
      }),
    );
    header
      .querySelectorAll(".cw-panel a")
      .forEach((a) => a.addEventListener("click", close));
    document.addEventListener("click", (e) => {
      if (!header.contains(e.target)) close();
    }, { signal });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    }, { signal });
    matchMedia("(min-width:1024px)").addEventListener("change", close, { signal });
    window[cleanupKey] = () => controller.abort();
  };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", mount)
    : mount();
})();
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-apply]");
  if (!trigger) return;
  const raw = trigger.dataset.apply || "",
    data = window.CredwisoryLenders?.data || {};
  let id = data[raw]
    ? raw
    : Object.entries(data).find(([, item]) => item.name === raw)?.[0];
  if (!id) return;
  if (id === "idfc-bank") id = "idfc-first-bank";
  event.preventDefault();
  location.href = `lender-enquiry.html?lender=${encodeURIComponent(id)}`;
});
(() => {
  const load = () => {
    if (document.querySelector('script[src="site-motion.js"]')) return;
    const script = document.createElement("script");
    script.src = "/site-motion.js";
    script.defer = true;
    document.head.append(script);
  };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", load)
    : load();
})();
