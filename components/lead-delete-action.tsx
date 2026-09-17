"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClosedLead } from "@/app/admin/actions";

type Props = { id: string; name: string; identifier: string; type: string };

export function LeadDeleteAction({ id, name, identifier, type }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const close = () => { if (!pending) { dialog.current?.close(); setError(""); } };
  async function remove() {
    setPending(true); setError("");
    const form = new FormData(); form.set("id", id); form.set("confirm", "DELETE");
    const result = await deleteClosedLead(form);
    setPending(false);
    if (!result?.ok) { setError(result?.error || "The lead could not be deleted. Please try again."); return; }
    dialog.current?.close(); setSuccess(true);
    window.setTimeout(() => router.refresh(), 1200);
  }
  return <>
    <button type="button" className="cw-admin-delete-link" aria-label={`Delete lead for ${name}`} onClick={() => dialog.current?.showModal()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-2h4l1 2m-9 0 1 13h10l1-13" /></svg><span>Delete</span>
    </button>
    <dialog ref={dialog} className="cw-admin-dialog cw-admin-delete-dialog" onCancel={close} aria-labelledby={`delete-lead-${id}`}>
      <div className="cw-admin-dialog-inner"><p className="cw-admin-eyebrow">Delete lead</p><h2 id={`delete-lead-${id}`}>Delete {name}?</h2>
        <dl className="cw-admin-delete-summary"><div><dt>Contact</dt><dd>{identifier}</dd></div><div><dt>Enquiry type</dt><dd>{type}</dd></div></dl>
        <p className="cw-admin-error">This permanently deletes this lead and cannot be undone.</p>
        {error && <p className="cw-admin-error" role="alert">{error}</p>}
        <div className="cw-admin-dialog-actions"><button type="button" className="secondary" onClick={close} disabled={pending}>Cancel</button><button type="button" className="cw-admin-danger" onClick={remove} disabled={pending}>{pending ? "Deleting…" : "Delete permanently"}</button></div>
      </div>
    </dialog>
    {success && <div className="cw-admin-toast" role="status">Lead deleted successfully.</div>}
  </>;
}
