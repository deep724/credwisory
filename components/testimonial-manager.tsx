"use client";
/* eslint-disable @next/next/no-img-element -- uploaded testimonial photos may be local or approved external HTTPS URLs. */

import { useState, type FormEvent } from "react";
import { deleteTestimonial, saveTestimonial, setTestimonialPublication } from "@/app/admin/actions";
import { AdminDeleteConfirmation } from "@/components/admin-delete-confirmation";
import styles from "./testimonial-manager.module.css";

type Item = { id: string; displayName: string; university?: string; studyCountry?: string; course?: string; rating: number; text: string; photoUrl?: string; videoUrl?: string; consentConfirmed: boolean; status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" };
const empty = { displayName: "", university: "", studyCountry: "", course: "", rating: 5, text: "", photoUrl: "", videoUrl: "", consentConfirmed: false, status: "DRAFT" as const };

export function TestimonialManager({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Item | typeof empty | null>(null);
  const [preview, setPreview] = useState<Item | typeof empty | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const current = editing || empty;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.dataset.publish === "true" && !publishNow) return setFeedback("Turn on Publish now before publishing this testimonial.");
    if (submitter?.dataset.publish === "true" || (submitter?.dataset.publish === "default" && publishNow)) formData.set("status", "PUBLISHED");
    formData.set("photoUrl", photoUrl);
    const result = await saveTestimonial(formData);
    if (result.error) return setFeedback(result.error);
    location.reload();
  }
  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true); setFeedback(null);
    const formData = new FormData(); formData.set("image", file);
    const response = await fetch("/api/admin/testimonials/upload", { method: "POST", body: formData });
    const result = await response.json().catch(() => null);
    setUploading(false);
    if (!response.ok || !result?.url) return setFeedback(result?.error || "The photo could not be uploaded.");
    setPhotoUrl(result.url); setFeedback("Photo uploaded successfully.");
  }
  async function changePublication(item: Item, published: boolean) {
    const result = await setTestimonialPublication(item.id, published);
    if (result.error) return setFeedback(result.error);
    setItems((records) => records.map((record) => record.id === item.id ? { ...record, status: published ? "PUBLISHED" : "DRAFT" } : record));
    setFeedback(published ? "Testimonial published." : "Testimonial saved as a draft.");
  }
  function begin(item: Item | typeof empty) { setFeedback(null); setPreview(null); setPhotoUrl(item.photoUrl || ""); setPublishNow(item.status === "PUBLISHED"); setConsent(item.consentConfirmed); setEditing(item); }

  return <>
    <div className="cw-admin-page-heading"><div><h1>Student Testimonials</h1><p className="cw-admin-kicker">Manage the student stories displayed on the website.</p></div><button type="button" className="cw-admin-primary" onClick={() => begin(empty)}><PlusIcon />Add Testimonial</button></div>
    {feedback ? <p className="cw-admin-success" role="status">{feedback}</p> : null}
    {editing ? <form className={styles.form} onSubmit={save}>
      <input type="hidden" name="id" value={"id" in current ? current.id : ""} />
      <fieldset><legend>Student Details</legend><div className={styles.grid}><label>Student display name<input name="displayName" defaultValue={current.displayName} required /></label><label>University<input name="university" defaultValue={current.university} /></label><label>Study country<input name="studyCountry" defaultValue={current.studyCountry} /></label><label>Course / program <small>Optional</small><input name="course" defaultValue={current.course} /></label></div></fieldset>
      <fieldset><legend>Testimonial Content</legend><div className={styles.grid}><label>Star rating<span className={styles.rating}>{[1,2,3,4,5].map((rating)=><label key={rating}><input type="radio" name="rating" value={rating} defaultChecked={current.rating===rating}/><span aria-label={`${rating} star${rating===1?"":"s"}`}>★</span></label>)}</span></label><label>Optional video link<input name="videoUrl" type="url" defaultValue={current.videoUrl} placeholder="https://..." /></label><label className={styles.wide}>Testimonial text<textarea name="text" defaultValue={current.text} required minLength={12} /></label><label className={`${styles.wide} ${styles.upload}`}>Optional photo upload<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => void uploadPhoto(event.target.files?.[0])} /><span>{uploading ? "Uploading photo…" : photoUrl ? "Photo attached — choose another to replace" : "Choose a photo or drop one here"}</span><small>JPG, PNG, or WebP · maximum 3 MB</small>{photoUrl ? <span className={styles.photo}><img src={photoUrl} alt="" /><button type="button" onClick={() => setPhotoUrl("")}>Remove photo</button></span> : null}</label></div></fieldset>
      <input type="hidden" name="photoUrl" value={photoUrl} />
      <fieldset><legend>Publishing &amp; Consent</legend><div className={styles.settings}><input type="hidden" name="consentConfirmed" value="false" /><label className={styles.toggle}><input name="consentConfirmed" type="checkbox" value="true" checked={consent} onChange={(event)=>setConsent(event.target.checked)}/><span/><b>Consent confirmed<small>Required before this testimonial can be published.</small></b></label><label className={styles.toggle}><input type="checkbox" checked={publishNow} disabled={!consent} onChange={(event) => setPublishNow(event.target.checked)} /><span/><b>Publish now<small>Make this testimonial visible on the public website.</small></b></label><label>Status<select name="status" defaultValue={current.status}><option value="DRAFT">Draft</option><option value="PENDING_REVIEW">Pending Review</option><option value="PUBLISHED">Published</option><option value="REJECTED">Rejected</option></select></label></div></fieldset>
      <footer className={styles.footer}><button className="cw-admin-secondary" data-publish="false"><SaveIcon />Save Draft</button><button type="button" className="cw-admin-secondary" onClick={() => setPreview({ ...current, photoUrl })}><EyeIcon />Preview</button><button className="cw-admin-primary" data-publish="true" disabled={!consent}><CheckIcon />Publish</button><button type="button" className="cw-admin-reset" onClick={() => setEditing(null)}><CloseIcon />Cancel</button></footer>
    </form> : null}
    {preview ? <section className={styles.preview} aria-live="polite"><div><p className="cw-admin-eyebrow">Preview</p><h2>{preview.displayName || "Student testimonial"}</h2><p aria-label={`${preview.rating} out of 5 stars`}>{"★".repeat(preview.rating)}</p><blockquote>{preview.text || "Your testimonial preview will appear here."}</blockquote><small>{[preview.course, preview.university, preview.studyCountry].filter(Boolean).join(" · ")}</small></div>{preview.photoUrl ? <img src={preview.photoUrl} alt="" /> : null}</section> : null}
    <section className="cw-admin-panel"><div className="cw-admin-table-wrap"><table><thead><tr><th>Student</th><th>Rating</th><th>Status</th><th>Consent</th><th>Actions</th></tr></thead><tbody>
      {items.map((item) => <tr key={item.id}><td><strong>{item.displayName}</strong><br /><small>{item.university || item.course || "No study details"}</small></td><td aria-label={`${item.rating} out of 5 stars`}>{"★".repeat(item.rating)}</td><td><div className={styles.statuses}><span className={`cw-admin-badge ${item.status === "PUBLISHED" ? "cw-status-approved" : styles.draft}`}>{item.status.replace("_", " ")}</span>{item.status !== "PUBLISHED" ? <span className={`cw-admin-badge ${item.consentConfirmed ? "cw-status-contacted" : "cw-status-documents_pending"}`}>{item.consentConfirmed ? "Ready to Publish" : "Awaiting Consent"}</span> : null}</div></td><td>{item.consentConfirmed ? "Confirmed" : "Missing"}</td><td><div className={styles.actions}><button type="button" className="cw-admin-icon-action is-edit" aria-label={`Edit testimonial from ${item.displayName}`} data-tooltip="Edit testimonial" onClick={() => begin(item)}><PencilIcon /></button><button type="button" className="cw-admin-icon-action is-preview" aria-label={`Preview testimonial from ${item.displayName}`} data-tooltip="Preview testimonial" onClick={() => setPreview(item)}><EyeIcon /></button>{item.status === "PUBLISHED" ? <button type="button" className="cw-admin-icon-action is-archive" aria-label={`Unpublish testimonial from ${item.displayName}`} data-tooltip="Unpublish testimonial" onClick={() => void changePublication(item, false)}><UnpublishIcon /></button> : <button type="button" className="cw-admin-icon-action is-visibility" aria-label={`Publish testimonial from ${item.displayName}`} data-tooltip="Publish testimonial" onClick={() => void changePublication(item, true)}><CheckIcon /></button>}<AdminDeleteConfirmation title="Delete testimonial?" description={<>This permanently deletes the testimonial from <b>{item.displayName}</b>.</>} triggerLabel={`Delete testimonial from ${item.displayName}`} successMessage="Testimonial deleted." onSuccess={() => setItems((records) => records.filter((record) => record.id !== item.id))} onConfirm={async () => { const formData = new FormData(); formData.set("id", item.id); formData.set("confirm", "DELETE"); return deleteTestimonial(formData); }} /></div></td></tr>)}
      {!items.length ? <tr><td colSpan={5} className="cw-admin-empty">No testimonials yet.</td></tr> : null}
    </tbody></table></div></section>
  </>;
}

function Icon({ children }: { children: React.ReactNode }) { return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{children}</svg>; }
function PlusIcon() { return <Icon><path d="M12 5v14M5 12h14" /></Icon>; }
function PencilIcon() { return <Icon><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m12.5 7.5 4 4" /></Icon>; }
function EyeIcon() { return <Icon><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></Icon>; }
function SaveIcon() { return <Icon><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v6h8V4M8 19v-5h8v5" /></Icon>; }
function CheckIcon() { return <Icon><path d="m5 12 4 4L19 6" /></Icon>; }
function CloseIcon() { return <Icon><path d="m6 6 12 12M18 6 6 18" /></Icon>; }
function UnpublishIcon() { return <Icon><path d="M3 3l18 18" /><path d="M2.5 12S6 6 12 6c1.4 0 2.7.3 3.8.8M21.5 12S18 18 12 18c-1.5 0-2.8-.3-3.9-.9" /></Icon>; }
