"use client";

import { useEffect, useRef } from "react";
import { SiteHeader } from "@/components/site-header";

type Props = { body: string; scripts: string[] };

const requiredElementsByScript = [
  {
    marker: "CredwisoryLenderRates",
    ids: [
      "cw-lender", "loanAmount-range", "loanAmount-input",
      "interestRate-range", "interestRate-input", "loanTenure-range",
      "loanTenure-input", "courseDuration-range", "courseDuration-input",
      "course-interest", "loan-emi", "loan-interest", "loan-total",
      "cw-moratorium-note", "cw-rate-updated", "inr-amount", "usd-rate",
      "usd-result", "take-balance", "take-years", "take-current", "take-new",
      "take-current-emi", "take-savings", "tax-income", "tax-result",
    ],
  },
] as const;

function hasRequiredElements(source: string) {
  const requirement = requiredElementsByScript.find(({ marker }) => source.includes(marker));
  return !requirement || requirement.ids.every((id) => document.getElementById(id) !== null);
}

/** Runs the original browser scripts after the preserved legacy markup has mounted. */
export function LegacyRuntime({ body, scripts }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const executedScripts = useRef<string | null>(null);
  const submittedForms = useRef(new WeakSet<HTMLFormElement>());
  useEffect(() => {
    const scriptKey = scripts.join("\u0000");
    let disposed = false;
    const isActive = () => !disposed && root.current?.isConnected === true;
    const run = async () => {
      for (const source of scripts) {
        if (!isActive()) return;
        // Legacy documents contain page-specific scripts. A script only runs
        // when the controls it binds are in the mounted page.
        if (!hasRequiredElements(source)) continue;
        const template = document.createElement("template");
        template.innerHTML = source;
        const original = template.content.querySelector("script");
        if (!original || original.type === "text/plain") continue;
        const script = document.createElement("script");
        for (const attribute of original.attributes) script.setAttribute(attribute.name, attribute.value);
        script.async = false;
        if (original.src) {
          await new Promise<void>((resolve) => { script.onload = () => resolve(); script.onerror = () => resolve(); document.body.append(script); });
          if (!isActive()) return;
        } else {
          script.text = original.textContent ?? "";
          document.body.append(script);
        }
      }
      if (!isActive()) return;
      // A few original documents subscribe to `load`. Their scripts mount after
      // hydration here, so replay it once to preserve the original initialization.
      window.dispatchEvent(new Event("load"));
    };
    const persistLead = (event: SubmitEvent) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      if (form.dataset.leadSubmit === "managed") return;
      const path = window.location.pathname;
      const kind = path.includes("loan-with-collateral") ? "LOAN_WITH_COLLATERAL"
        : path.includes("loan-without-collateral") ? "LOAN_WITHOUT_COLLATERAL"
        : form.id === "enquiryForm" ? "LENDER_ENQUIRY"
        : form.id === "referralForm" ? "REFERRAL"
          : form.id === "expert-form" ? "CONTACT"
            : form.id === "form" ? "ELIGIBILITY" : null;
      if (!kind) return;
      if (submittedForms.current.has(form) || !form.checkValidity()) return;
      const controls = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
      const labelFor = (control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => control.labels?.[0]?.textContent || control.closest(".field")?.querySelector("label")?.textContent || "";
      const keyFor = (control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, index: number) => control.name || control.id || labelFor(control).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || `field_${index + 1}`;
      const values = Object.fromEntries(controls.map((control, index) => [keyFor(control, index), control instanceof HTMLInputElement && control.type === "file" ? Array.from(control.files || []).map((file) => file.name).join(", ") : control.value]));
      const byLabel = (expression: RegExp) => controls.find((control) => expression.test(labelFor(control)))?.value?.trim() || "";
      const name = String(values.fullName || values.student_name || values.name || byLabel(/student\s+full\s+name/i));
      const mobile = String(values.phone || values.mobile || values.mobile_number || byLabel(/(mobile|phone)\s+number/i)).replace(/\D/g, "");
      const email = String(values.email || values.email_address || byLabel(/email\s+address/i));
      if (name.length < 2 || (mobile && !/^[6-9]\d{9}$/.test(mobile))) return;
      submittedForms.current.add(form);
      const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const status = form.parentElement?.querySelector<HTMLElement>('[role="status"]');
      if (submit) submit.disabled = true;
      void fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, name, sourcePage: window.location.pathname, ...(email ? { email } : {}), ...(mobile ? { mobile } : {}), payload: values }) })
        .then((response) => { if (!response.ok) throw new Error("Lead request failed"); if (status) { status.hidden = false; status.textContent = "Thank you — your enquiry has been received. A Credwisory expert will contact you shortly."; } })
        .catch(() => { submittedForms.current.delete(form); if (status) { status.hidden = false; status.textContent = "We could not send your enquiry. Please try again."; } })
        .finally(() => { if (submit) submit.disabled = false; });
    };
    document.addEventListener("submit", persistLead, true);
    // React Strict Mode intentionally reruns effects in development. Keep script
    // execution idempotent while still attaching the current submit listener.
    // Queue work after the effect commits: Strict Mode cleans up its probe effect
    // before this microtask, leaving only the active effect to run legacy code.
    if (executedScripts.current !== scriptKey) {
      void Promise.resolve().then(async () => {
        if (!isActive()) return;
        await run();
        if (isActive()) executedScripts.current = scriptKey;
      });
    }
    return () => {
      disposed = true;
      document.removeEventListener("submit", persistLead, true);
    };
  }, [scripts]);
  return <>
    <SiteHeader />
    <div ref={root} dangerouslySetInnerHTML={{ __html: body }} />
  </>;
}
