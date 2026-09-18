"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { LenderLogo } from "@/components/lender-logo";
import { useRouter } from "next/navigation";
import { archiveLender, deleteLender, saveLender } from "@/app/admin/actions";
import {
  isValidLenderLogo,
  LENDER_LOGO_ACCEPT,
  LENDER_LOGO_MAX_BYTES,
  LENDER_LOGO_MAX_LABEL,
  lenderLogoMessage,
} from "@/lib/lender-images";

type Lender = Record<string, unknown> & {
  _id: string;
  name: string;
  slug: string;
  lenderType: string;
  displayOrder: number;
  published: boolean;
  archivedAt?: string | null;
  logoUrl?: string;
  comparison?: Record<string, string>;
  description?: string;
  collateralAvailable?: boolean;
  nonCollateralAvailable?: boolean;
};
type Errors = Record<string, string>;
const fields = [
  ["securedLoan", "Secured loan details", "secured"],
  ["unsecuredLoan", "Unsecured loan details", "unsecured"],
  ["securedRate", "Secured rate", "securedRate"],
  ["unsecuredRate", "Unsecured rate", "unsecuredRate"],
  ["moratorium", "Moratorium", "moratorium"],
  ["tenure", "Tenure", "tenure"],
  ["foreclosure", "Foreclosure charges", "foreclosure"],
  ["processingFee", "Processing fee", "fee"],
] as const;
const requiredLoan = new Set([
  "securedLoan",
  "unsecuredLoan",
  "securedRate",
  "unsecuredRate",
]);
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function LenderManager({ lenders }: { lenders: Lender[] }) {
  const [editor, setEditor] = useState<Lender | null | undefined>(),
    [toast, setToast] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (editor !== undefined) dialog.current?.showModal();
  }, [editor]);
  const close = () => {
    dialog.current?.close();
    setEditor(undefined);
  };
  return (
    <>
      {toast ? (
        <div className="cw-admin-toast" role="status">
          {toast}
        </div>
      ) : null}
      <div className="cw-admin-panel-head">
        <div>
          <h2>Lenders</h2>
          <p className="cw-admin-kicker">
            Published lenders are visible in the public directory.
          </p>
        </div>
        <button
          type="button"
          className="cw-admin-primary"
          onClick={() => setEditor(null)}
        >
          Add lender
        </button>
      </div>
      <section className="cw-admin-panel">
        <div className="cw-admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lender</th>
                <th>Category</th>
                <th>Visibility</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lenders.length ? (
                lenders.map((lender) => (
                  <tr key={lender._id}>
                    <td>
                      <div className="cw-admin-lender-cell">
                        <LenderLogo name={lender.name} slug={lender.slug} logoUrl={lender.logoUrl} />
                        <div>
                          <strong>{lender.name}</strong>
                          {lender.archivedAt ? (
                            <small className="cw-admin-muted">Archived</small>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>{lender.lenderType}</td>
                    <td>
                      <span
                        className={`cw-admin-badge ${lender.published && !lender.archivedAt ? "cw-status-approved" : "cw-status-closed"}`}
                      >
                        {lender.archivedAt
                          ? "Archived"
                          : lender.published
                            ? "Published"
                            : "Draft / Hidden"}
                      </span>
                    </td>
                    <td>{lender.displayOrder}</td>
                    <td>
                      <LenderTableActions
                        lender={lender}
                        onEdit={() => setEditor(lender)}
                        completed={(message) => {
                          setToast(message);
                          router.refresh();
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="cw-admin-empty">
                    No lenders yet. Add a lender to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <dialog
        ref={dialog}
        className="cw-admin-dialog cw-admin-lender-dialog"
        onCancel={close}
        aria-labelledby="lender-editor-title"
      >
        {editor !== undefined ? (
          <Editor
            lender={editor || undefined}
            close={close}
            saved={(name) => {
              close();
              setToast(`${name} saved successfully.`);
              router.refresh();
            }}
          />
        ) : null}
      </dialog>
    </>
  );
}

function ActionIcon({ name }: { name: "edit" | "archive" | "delete" }) {
  const paths = {
    edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m12.5 7.5 4 4" /></>,
    archive: <><path d="M4 8h16v12H4z" /><path d="M3 5h18v3H3zM10 12h4" /></>,
    delete: <><path d="M4 7h16M10 11v6m4-6v6M9 7l1-2h4l1 2m-9 0 1 13h10l1-13" /></>,
  }[name];
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths}</svg>;
}

function LenderTableActions({ lender, onEdit, completed }: { lender: Lender; onEdit: () => void; completed: (message: string) => void }) {
  const [pending, setPending] = useState<"archive" | "delete" | "">("");
  const [error, setError] = useState("");
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const archive = async () => {
    setPending("archive"); setError("");
    const data = new FormData(); data.set("id", lender._id);
    try { await archiveLender(data); completed(`${lender.name} archived successfully.`); } catch { setError("The lender could not be archived. Please try again."); setPending(""); }
  };
  const remove = async () => {
    setPending("delete"); setError("");
    const data = new FormData(); data.set("id", lender._id); data.set("confirm", "DELETE");
    try { await deleteLender(data); deleteDialog.current?.close(); completed(`${lender.name} deleted successfully.`); } catch { setError("The lender could not be deleted. Please try again."); setPending(""); }
  };
  return <><div className="cw-admin-icon-actions" aria-label={`Actions for ${lender.name}`}>
    <button type="button" className="cw-admin-icon-action is-edit" aria-label={`Edit lender ${lender.name}`} data-tooltip="Edit lender" title="Edit lender" onClick={onEdit} disabled={Boolean(pending)}><ActionIcon name="edit" /></button>
    {!lender.archivedAt ? <button type="button" className="cw-admin-icon-action is-archive" aria-label={`Archive lender ${lender.name}`} data-tooltip="Archive lender" title="Archive lender" onClick={() => void archive()} disabled={Boolean(pending)}>{pending === "archive" ? <span className="cw-admin-icon-spinner" aria-label="Archiving" /> : <ActionIcon name="archive" />}</button> : null}
    <button type="button" className="cw-admin-icon-action is-delete" aria-label={`Delete lender ${lender.name}`} data-tooltip="Delete lender" title="Delete lender" onClick={() => { setError(""); deleteDialog.current?.showModal(); }} disabled={Boolean(pending)}><ActionIcon name="delete" /></button>
  </div><dialog ref={deleteDialog} className="cw-admin-dialog cw-admin-delete-dialog" onCancel={(event) => { if (pending) event.preventDefault(); }} aria-labelledby={`delete-lender-${lender._id}`} aria-describedby={`delete-lender-warning-${lender._id}`}><div className="cw-admin-dialog-inner cw-admin-delete-dialog-inner"><div className="cw-admin-delete-title-row"><span className="cw-admin-delete-title-icon" aria-hidden="true"><ActionIcon name="delete" /></span><div><p className="cw-admin-eyebrow">Delete lender</p><h2 id={`delete-lender-${lender._id}`}>Delete “{lender.name}”?</h2></div></div><p id={`delete-lender-warning-${lender._id}`} className="cw-admin-delete-warning">This permanently deletes this lender and its public listing. This cannot be undone.</p>{error ? <p className="cw-admin-error" role="alert">{error}</p> : null}<div className="cw-admin-dialog-actions cw-admin-delete-dialog-actions"><button type="button" className="cw-admin-delete-cancel" onClick={() => deleteDialog.current?.close()} disabled={Boolean(pending)}>Cancel</button><button type="button" className="cw-admin-danger cw-admin-delete-confirm" onClick={() => void remove()} disabled={Boolean(pending)}>{pending === "delete" ? <><span className="cw-admin-icon-spinner" aria-hidden="true" />Deleting…</> : <><ActionIcon name="delete" />Delete permanently</>}</button></div></div></dialog></>;
}

function Editor({
  lender,
  close,
  saved,
}: {
  lender?: Lender;
  close: () => void;
  saved: (name: string) => void;
}) {
  const form = useRef<HTMLFormElement>(null),
    dirty = useRef(false),
    logoInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState(""),
    [slug, setSlug] = useState(lender?.slug || ""),
    [manualSlug, setManualSlug] = useState(Boolean(lender?.slug)),
    [logoUrl, setLogoUrl] = useState(lender?.logoUrl || ""),
    [logoInfo, setLogoInfo] = useState(""),
    [logoError, setLogoError] = useState(""),
    [draggingLogo, setDraggingLogo] = useState(false),
    [published, setPublished] = useState(lender?.published ? "true" : "false"),
    [publishReady, setPublishReady] = useState(false),
    [clientErrors, setClientErrors] = useState<Errors>({}),
    [serverErrors, setServerErrors] = useState<Errors>({});
  const updatePublishReady = () => {
    const data = form.current ? new FormData(form.current) : null;
    if (!data) return;
    setPublishReady(["name", "slug", "displayOrder", ...requiredLoan].every((field) => String(data.get(field) || "").trim().length > 0));
  };
  useEffect(() => { updatePublishReady(); }, []);
  const errors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({
          ...serverErrors,
          ...clientErrors,
          ...(logoError ? { logoUrl: logoError } : {}),
        }).filter(([, value]) => Boolean(value)),
      ) as Errors,
    [clientErrors, logoError, serverErrors],
  );
  useEffect(() => {
    const first = Object.keys(errors)[0];
    if (!first) return;
    const control = form.current?.querySelector<HTMLElement>(
      `[name="${first}"]`,
    );
    control?.scrollIntoView({ behavior: "smooth", block: "center" });
    control?.focus();
  }, [errors]);
  const clear = (field: string) => {
    setClientErrors((value) => ({ ...value, [field]: "" }));
    setServerErrors((value) => ({ ...value, [field]: "" }));
  };
  const validate = (event: React.FormEvent<HTMLFormElement>) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const intent = submitter instanceof HTMLButtonElement ? submitter.value : "publish";
    const data = new FormData(event.currentTarget),
      next: Errors = {};
    const name = String(data.get("name") || "").trim(),
      currentSlug = String(data.get("slug") || "").trim(),
      order = String(data.get("displayOrder") || "");
    if (name.length < 2)
      next.name = "Enter a lender name of at least 2 characters.";
    if (intent !== "save-draft" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(currentSlug))
      next.slug = "Use lowercase letters, numbers, and hyphens only.";
    if (intent !== "save-draft" && !/^\d+$/.test(order))
      next.displayOrder = "Enter a non-negative whole number.";
    if (intent !== "save-draft") fields.forEach(([field, label]) => {
      if (requiredLoan.has(field) && !String(data.get(field) || "").trim())
        next[field] = `Enter ${label.toLowerCase()} or Not available.`;
    });
    if (intent !== "save-draft" && logoUrl && !isValidLenderLogo(logoUrl))
      next.logoUrl = lenderLogoMessage;
    if (logoError) next.logoUrl = logoError;
    setClientErrors(next);
    if (Object.keys(next).length) event.preventDefault();
  };
  async function uploadLogo(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > LENDER_LOGO_MAX_BYTES
    ) {
      setMessage(
        `Choose a JPG, PNG, or WebP logo up to ${LENDER_LOGO_MAX_LABEL}.`,
      );
      return;
    }
    setMessage("Uploading logo…");
    setLogoError("");
    setLogoInfo(file.name);
    const data = new FormData();
    data.set("image", file);
    try {
      const response = await fetch("/api/admin/lenders/upload", {
        method: "POST",
        body: data,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error);
      setLogoUrl(result.url);
      clear("logoUrl");
      setMessage("Logo uploaded.");
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "Logo upload failed.",
      );
    }
  }
  async function submit(data: FormData) {
    setPending(true);
    setMessage("");
    setServerErrors({});
    try {
      const result = await saveLender(data);
      if (result?.ok) {
        dirty.current = false;
        saved(data.get("intent") === "save-draft" ? "Draft saved successfully." : String(data.get("name") || "Lender")); setMessage(data.get("intent") === "save-draft" ? "Draft saved successfully." : "Lender published successfully."); return;
      }
      setServerErrors(
        (result && "fields" in result ? result.fields : {}) || {},
      );
      setMessage(
        result?.error ||
          "Unable to save this lender. Your changes are still here.",
      );
    } catch {
      setMessage("Unable to save this lender. Your changes are still here.");
    } finally {
      setPending(false);
    }
  }
  const requestClose = () => {
      if (!dirty.current || confirm("Discard unsaved lender changes?")) close();
    },
    comparison = lender?.comparison || {};
  const errorFor = (field: string) =>
      errors[field] ? (
        <p className="cw-admin-field-error" role="alert">
          {errors[field]}
        </p>
      ) : null,
    star = (
      <span className="cw-admin-required" aria-hidden="true">
        {" "}
        *
      </span>
    );
  return (
    <div className="cw-admin-dialog-inner cw-lender-editor-inner">
      <header className="cw-admin-panel-head">
        <div>
          <p className="cw-admin-eyebrow">
            {lender ? "Edit lender" : "New lender"}
          </p>
          <h2 id="lender-editor-title">
            {lender ? lender.name : "Add lender"}
          </h2>
        </div>
        <button type="button" className="cw-admin-dialog-close" aria-label="Close lender editor" data-tooltip="Close" title="Close" onClick={requestClose}>×</button>
      </header>
      {Object.keys(errors).length ? (
        <p className="cw-admin-error" role="alert">
          Please complete the highlighted lender fields before publishing.
        </p>
      ) : message ? (
        <p
          className={
            message.includes("uploaded") ? "cw-admin-success" : "cw-admin-error"
          }
          role="alert"
        >
          {message}
        </p>
      ) : null}
      <form
        ref={form}
        action={submit}
        onSubmit={validate}
        onChange={() => {
          dirty.current = true;
          updatePublishReady();
        }}
        noValidate
        className="cw-admin-form cw-lender-editor"
      >
        <input name="id" type="hidden" value={lender?._id || ""} />
        <fieldset>
          <legend>Basic information</legend>
          <label>
            Name{star}
            <input
              name="name"
              required
              aria-invalid={Boolean(errors.name)}
              defaultValue={lender?.name}
              onChange={(event) => {
                if (!manualSlug) setSlug(slugify(event.target.value));
                clear("name");
              }}
            />
            {errorFor("name")}
          </label>
          <label>
            Slug{star}
            <input
              name="slug"
              required
              aria-invalid={Boolean(errors.slug)}
              value={slug}
              onChange={(event) => {
                setManualSlug(true);
                setSlug(slugify(event.target.value));
                clear("slug");
              }}
            />
            {errorFor("slug")}
          </label>
          <label>
            Category{star}
            <select
              name="lenderType"
              defaultValue={lender?.lenderType || "BANK"}
            >
              <option value="BANK">Bank</option>
            <option value="NBFC">NBFC</option>
            <option value="INTERNATIONAL">International</option>
            <option value="OTHER">Other / specialist</option>
            </select>
          </label>
          <label>
            Display order{star}
            <input
              name="displayOrder"
              type="number"
              min="0"
              step="1"
              aria-invalid={Boolean(errors.displayOrder)}
              defaultValue={lender?.displayOrder ?? 0}
              onChange={() => clear("displayOrder")}
            />
            {errorFor("displayOrder")}
          </label>
          <label className="cw-admin-field-wide">
            Short description
            <input
              name="description"
              maxLength={500}
              defaultValue={lender?.description as string}
              placeholder="Optional public-facing description"
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Branding and links</legend>
          <label className="cw-admin-field-wide">
            Logo URL <span className="cw-admin-optional">(optional)</span>
            <input
              name="logoUrl"
              type="text"
              value={logoUrl}
              aria-invalid={Boolean(errors.logoUrl)}
              onChange={(event) => {
                setLogoUrl(event.target.value);
                setLogoError("");
                clear("logoUrl");
              }}
              placeholder="https://example.com/logo.png"
            />
            {errorFor("logoUrl")}
          </label>
          <div className="cw-logo-upload-wrap">
            <span className="cw-admin-field-label">Lender logo</span>
            <input ref={logoInput} className="cw-logo-upload-input" type="file" accept={LENDER_LOGO_ACCEPT} onChange={(event) => void uploadLogo(event.target.files?.[0])} />
            <div className={`cw-logo-dropzone ${draggingLogo ? "is-dragging" : ""}`} role="button" tabIndex={0} aria-label="Upload lender logo" onClick={() => logoInput.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); logoInput.current?.click(); } }} onDragOver={(event) => { event.preventDefault(); setDraggingLogo(true); }} onDragLeave={() => setDraggingLogo(false)} onDrop={(event) => { event.preventDefault(); setDraggingLogo(false); void uploadLogo(event.dataTransfer.files?.[0]); }}>
              <UploadIcon /><span><b>Upload lender logo</b><small>Drag and drop, or click to browse</small></span>
            </div>
            <small>JPG, PNG, or WebP up to {LENDER_LOGO_MAX_LABEL}.</small>
          </div>
          <label>
            Application URL
            <input
              name="applicationUrl"
              type="url"
              defaultValue={String(lender?.applicationUrl || "")}
              placeholder="Optional HTTPS application link"
            />
          </label>
          {logoUrl ? (
            <div className="cw-admin-image-preview cw-admin-field-wide">
              <LenderLogo
                name={lender?.name || "Lender logo preview"}
                logoUrl={logoUrl}
                size="header"
                preview
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setLogoInfo(
                    `${logoInfo || "Logo"} · ${image.naturalWidth} × ${image.naturalHeight}`,
                  );
                  setLogoError("");
                }}
                onError={() =>
                  setLogoError(
                    "This logo could not be loaded. Replace it before saving.",
                  )
                }
              />
              <div>
                <b>{logoInfo || "Uploaded logo"}</b>
                <div className="cw-logo-preview-actions"><button type="button" className="cw-admin-reset" onClick={() => logoInput.current?.click()}>Replace</button><button type="button" className="cw-admin-reset cw-logo-remove" onClick={() => { setLogoUrl(""); setLogoInfo(""); setLogoError(""); clear("logoUrl"); }}>Remove</button></div>
              </div>
            </div>
          ) : null}
        </fieldset>
        <fieldset>
          <legend>Loan information</legend>
          {fields.map(([field, label, key]) => (
            <label key={field}>
              {label}
              {requiredLoan.has(field) ? star : null}
              <input
                name={field}
                aria-invalid={Boolean(errors[field])}
                defaultValue={comparison[key] || ""}
                placeholder={
                  requiredLoan.has(field)
                    ? "Enter details or Not available"
                    : "Optional"
                }
                onChange={() => clear(field)}
              />
              {errorFor(field)}
            </label>
          ))}
          <label>
            Collateral available
            <select
              name="collateralAvailable"
              defaultValue={lender?.collateralAvailable ? "true" : "false"}
            >
              <option value="true">Available</option>
              <option value="false">Not available</option>
            </select>
          </label>
          <label>
            Non-collateral available
            <select
              name="nonCollateralAvailable"
              defaultValue={lender?.nonCollateralAvailable ? "true" : "false"}
            >
              <option value="true">Available</option>
              <option value="false">Not available</option>
            </select>
          </label>
        </fieldset>
        <fieldset className="cw-lender-visibility">
          <legend>Publication settings</legend>
          <label>
            <span className="cw-visibility-label">Visibility{star}<span className={`cw-visibility-state is-${published === "true" ? "published" : "draft"}`}>{published === "true" ? "Published" : "Draft"}</span></span>
            <select
              name="published"
              value={published}
              onChange={(event) => setPublished(event.target.value)}
            >
              <option value="false">Draft / Hidden</option>
              <option value="true">Published</option>
            </select>
            <small>
              Published lenders are visible on the public website. Draft lenders
              are visible only to administrators.
            </small>
          </label>
        </fieldset>
        <footer className="cw-admin-dialog-actions">
          <button
            type="button"
            className="secondary"
            onClick={requestClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            name="intent"
            value="save-draft"
            className="cw-admin-reset"
            disabled={pending}
          >
            {pending ? "Saving draft…" : "Save draft"}
          </button>
          <button
            name="intent"
            value="publish"
            className="cw-admin-primary"
            disabled={pending || Boolean(logoError) || !publishReady}
          >
            {pending ? "Saving…" : lender ? "Update lender" : "Publish lender"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function UploadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>;
}
