"use client";

import Link from "next/link";
import { LenderLogo } from "@/components/lender-logo";
import { useMemo, useRef, useState } from "react";
import type { AvailableLender } from "@/lib/available-lenders";

const readable = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const empty = (value: unknown) => !String(value ?? "").trim() || /^(not available|not published|n\/a|null|undefined)$/i.test(String(value).trim());
const detail = (value: unknown) => empty(value) ? "Not available" : String(value).trim();

type Errors = Record<string, string>;
type FormDataMap = Record<string, string>;

export function LenderApplicationForm({ lender }: { lender: AvailableLender }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [reviewData, setReviewData] = useState<FormDataMap>({});
  const lenderType = readable(lender.lenderType || "Lender");
  const summary = useMemo(() => {
    const comparison = lender.comparison || {};
    const securedRate = comparison.securedRate || lender.securedRate;
    const unsecuredRate = comparison.unsecuredRate || lender.unsecuredRate;
    const rate = !empty(securedRate) && !empty(unsecuredRate) && securedRate !== unsecuredRate
      ? `Secured: ${securedRate} · Unsecured: ${unsecuredRate}`
      : securedRate || unsecuredRate;
    return [
      ["Secured loan", comparison.secured || lender.maxLoan, "₹"],
      ["Unsecured loan", comparison.unsecured, "₹"],
      ["Interest rate", rate, "%"],
      ["Loan tenure", comparison.tenure || lender.tenure, "◷"],
      ["Collateral", lender.collateral || (lender.collateralAvailable ? "Available" : lender.nonCollateralAvailable ? "Non-collateral option available" : "Not available"), "◇"],
      ["Processing fee", comparison.fee || lender.processingFee, "▤"],
      ["Moratorium / grace", comparison.moratorium, "◷"],
      ["Foreclosure", comparison.foreclosure, "▤"],
    ];
  }, [lender]);

  function clearError(name: string) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function validate(currentStep: number) {
    const form = formRef.current;
    if (!form) return false;
    const nextErrors: Errors = {};
    const fields = currentStep === 1 ? ["fullName", "email", "mobile"] : currentStep === 3 ? ["contactConsent"] : [];
    fields.forEach((name) => {
      const control = form.elements.namedItem(name) as HTMLInputElement | null;
      if (!control) return;
      if (name === "mobile") control.value = control.value.replace(/\D/g, "").slice(0, 10);
      if (name === "mobile" && control.value && !/^[6-9]\d{9}$/.test(control.value)) nextErrors[name] = "Enter a valid 10-digit mobile number.";
      else if (!control.validity.valid) nextErrors[name] = name === "contactConsent" ? "Please provide consent to continue." : "Please complete this field.";
    });
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus();
    return !first;
  }

  function nextStep() {
    if (!validate(step)) return;
    if (step === 2 && formRef.current) setReviewData(Object.fromEntries(new FormData(formRef.current).entries()) as FormDataMap);
    setStep((current) => Math.min(3, current + 1));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !validate(3)) return;
    setSubmitting(true);
    setFormError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as FormDataMap;
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "LENDER_ENQUIRY",
          name: values.fullName?.trim(),
          email: values.email?.trim(),
          mobile: values.mobile?.replace(/\D/g, ""),
          sourcePage: window.location.pathname,
          payload: { ...values, loanPurpose: "education_loan", loanType: "Education Loan", lender: lender.slug, lenderName: lender.name, applicationSource: "Education loan lender application" },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setFormError("We could not submit your education-loan enquiry right now. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const review = [["Selected lender", lender.name], ["Loan type", "Education loan"], ["Name", reviewData.fullName], ["Email", reviewData.email], ["Mobile", reviewData.mobile], ["Study destination", reviewData.studyDestination], ["University / institution", reviewData.institution], ["Course", reviewData.course], ["Intake", reviewData.intake], ["Required loan amount", reviewData.loanAmount], ["Collateral available", reviewData.collateralAvailable]];

  return (
    <section className="cw-apply-card" aria-labelledby="apply-title">
      <header className="cw-apply-head">
        <div>
          <p className="cw-apply-eyebrow">EDUCATION LOAN APPLICATION</p>
          <h1 id="apply-title">Apply for an education loan</h1>
          <p>Share your details and our team will help you explore suitable education-loan options.</p>
        </div>
        <span className="cw-apply-lender">Applying with {lender.name}</span>
      </header>
      <section className="cw-apply-lender-summary" aria-labelledby="lender-summary-title">
        <header className="cw-apply-lender-summary__head">
          <div className="cw-apply-lender-summary__identity">
            <LenderLogo name={lender.name} slug={lender.slug} lenderType={lender.lenderType} logoUrl={lender.logoUrl} size="header" />
            <div><p className="cw-apply-eyebrow">LENDER DETAILS</p><h2 id="lender-summary-title">{lender.name}</h2><span className="cw-apply-lender-summary__type">{lenderType}</span></div>
          </div>
          <span className="cw-apply-lender-summary__status">Applying with {lender.name}</span>
        </header>
        <div className="cw-apply-lender-summary__grid">
          {summary.map(([label, value, marker]) => <div className="cw-apply-detail" key={label}><span className="cw-apply-detail__icon" aria-hidden="true">{marker}</span><span><small>{label}</small><b className={empty(value) ? "is-unavailable" : undefined}>{detail(value)}</b></span></div>)}
        </div>
      </section>
      <div className="cw-apply-steps" aria-label="Application progress">
        {["Contact details", "Study details", "Review & submit"].map((label, index) => <span className={`cw-apply-step ${step === index + 1 ? "active" : step > index + 1 ? "complete" : ""}`} key={label}><i>{step > index + 1 ? "✓" : index + 1}</i><span>{label}</span></span>)}
      </div>
      <form ref={formRef} className="cw-apply-form" noValidate onSubmit={submit}>
        <input type="hidden" name="lender" value={lender.slug} /><input type="hidden" name="loanPurpose" value="education_loan" /><input type="hidden" name="loanType" value="Education Loan" />
        {submitted ? <section className="cw-apply-success" role="status" aria-live="polite"><i aria-hidden="true">✓</i><h2>Education-loan enquiry received</h2><p>Thank you — our team will help you explore suitable education-loan options.</p><Link className="cw-apply-success__lenders" href="/lenders">Back to lenders</Link></section> : <>
          <section className="cw-apply-pane" hidden={step !== 1}><h2>Contact details</h2><p>Tell us the best way to reach you.</p><div className="cw-apply-fields"><Field name="fullName" label="Full name" required error={errors.fullName} onChange={clearError} wide /><Field name="email" label="Email address" type="email" required error={errors.email} onChange={clearError} /><Field name="mobile" label="Mobile number" type="tel" required error={errors.mobile} onChange={clearError} inputMode="numeric" /></div></section>
          <section className="cw-apply-pane" hidden={step !== 2}><h2>Study details</h2><p>Optional details help us understand your education plans.</p><div className="cw-apply-fields"><Field name="studyDestination" label="Study destination" onChange={clearError} /><Field name="institution" label="University / institution" onChange={clearError} /><Field name="course" label="Course" onChange={clearError} /><Field name="intake" label="Intake" onChange={clearError} placeholder="e.g. Fall 2027" /><Field name="annualTuitionFee" label="Annual tuition fee" type="number" onChange={clearError} currency /><Field name="loanAmount" label="Required loan amount" type="number" onChange={clearError} currency /><SelectField name="coApplicantAvailable" label="Co-applicant available" options={["Yes", "No", "Not sure"]} onChange={clearError} /><Field name="familyIncome" label="Family income" type="number" onChange={clearError} currency /><SelectField name="collateralAvailable" label="Collateral available" options={["Yes", "No", "Not sure"]} onChange={clearError} /><Field name="message" label="Optional message" onChange={clearError} wide /></div></section>
          <section className="cw-apply-pane" hidden={step !== 3}><h2>Review & submit</h2><p>Confirm your details and consent before sending your education-loan enquiry.</p><div className="cw-apply-review">{review.map(([label, value]) => <div key={label}><span>{label}</span><b>{value || "Not provided"}</b></div>)}</div><div className="cw-apply-consent"><label><input name="contactConsent" type="checkbox" required onChange={() => clearError("contactConsent")} /><span>I agree to be contacted regarding my education-loan enquiry. <b className="cw-apply-required" aria-hidden="true">*</b></span></label>{errors.contactConsent ? <span className="cw-apply-error" role="alert">{errors.contactConsent}</span> : null}</div></section>
          {formError ? <p className="cw-apply-message" role="alert">{formError}</p> : null}
          <div className="cw-apply-actions"><button className="cw-apply-secondary" type="button" hidden={step === 1} onClick={() => setStep((current) => current - 1)}>Back</button><span />{step < 3 ? <button className="cw-apply-primary" type="button" onClick={nextStep}>Continue</button> : <button className="cw-apply-primary" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit application"}</button>}</div>
        </>}
      </form>
    </section>
  );
}

function Field({ name, label, type = "text", required = false, error, onChange, wide = false, currency = false, inputMode, placeholder }: { name: string; label: string; type?: string; required?: boolean; error?: string; onChange: (name: string) => void; wide?: boolean; currency?: boolean; inputMode?: "numeric" | "decimal"; placeholder?: string }) {
  const control = <input name={name} type={type} required={required} inputMode={inputMode} min={type === "number" ? "0" : undefined} placeholder={placeholder || (name === "fullName" ? "Your full name" : name === "email" ? "name@example.com" : name === "mobile" ? "10-digit mobile number" : "Optional")} aria-invalid={Boolean(error)} onChange={() => onChange(name)} />;
  return <label className={`cw-apply-field${wide ? " wide" : ""}`}><span>{label}{required ? <b className="cw-apply-required" aria-hidden="true"> *</b> : null}</span>{currency ? <span className="cw-apply-currency"><b aria-hidden="true">₹</b>{control}</span> : control}{error ? <span className="cw-apply-error" role="alert">{error}</span> : <span className="cw-apply-error" />}</label>;
}

function SelectField({ name, label, options, onChange }: { name: string; label: string; options: string[]; onChange: (name: string) => void }) {
  return <label className="cw-apply-field"><span>{label}</span><select name={name} onChange={() => onChange(name)}><option value="">Select an option</option>{options.map((option) => <option key={option}>{option}</option>)}</select><span className="cw-apply-error" /></label>;
}
