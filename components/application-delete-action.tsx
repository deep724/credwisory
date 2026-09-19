"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteApplication } from "@/app/admin/actions";

type Props = { id: string; name: string; lender: string };

export function ApplicationDeleteAction({ id, name, lender }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function remove() {
    setPending(true);
    const data = new FormData();
    data.set("id", id);
    data.set("confirm", "DELETE");

    const result = await deleteApplication(data);
    if (result?.ok) {
      setOpen(false);
      router.refresh();
      return;
    }
    setPending(false);
  }

  return (
    <>
      <button
        type="button"
        className="cw-admin-icon-action is-delete"
        aria-label="Delete application"
        data-tooltip="Delete application"
        title="Delete application"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon />
      </button>
      {open ? (
        <div className="cw-admin-confirm-backdrop">
          <section
            className="cw-admin-confirm cw-application-delete-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            aria-describedby="delete-application-warning"
          >
            <div className="cw-application-delete-title">
              <span aria-hidden="true"><Trash2Icon /></span>
              <div>
                <p className="cw-admin-eyebrow">Delete application</p>
                <h2 id="delete-application-title">Delete application?</h2>
              </div>
            </div>
            <p id="delete-application-warning" className="cw-application-delete-warning">
              This permanently deletes the application for {name} with {lender}. The original lead will remain.
            </p>
            <div className="cw-application-delete-actions">
              <button type="button" className="cw-application-delete-cancel" disabled={pending} onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="cw-admin-delete-primary cw-application-delete-primary" disabled={pending} onClick={remove}>
                {pending ? "Deleting…" : <><Trash2Icon />Delete permanently</>}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

/** Lucide Trash2-compatible paths, kept local to avoid adding an icon package. */
function Trash2Icon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
