"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBlog } from "@/app/admin/actions";

export function BlogDeleteAction({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setPending(true);
    setError("");
    const data = new FormData();
    data.set("id", id);
    data.set("confirm", "DELETE");
    const result = await deleteBlog(data);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setOpen(false);
    router.refresh();
  }
  return (
    <>
      <button type="button" className="cw-admin-icon-action is-delete" aria-label={`Delete ${title}`} data-tooltip="Delete post" title="Delete post" onClick={() => setOpen(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-2h4l1 2m-9 0 1 13h10l1-13" /></svg></button>
      {open ? (
        <div className="cw-admin-confirm-backdrop" role="presentation">
          <section
            className="cw-admin-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-blog-title"
          >
            <h2 id="delete-blog-title">Delete “{title}”?</h2>
            <p>
              This will permanently delete this blog post and cannot be undone.
            </p>
            {error ? (
              <p className="cw-admin-error" role="alert">
                {error}
              </p>
            ) : null}
            <div>
              <button
                type="button"
                className="cw-admin-reset"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cw-admin-delete-primary"
                disabled={pending}
                onClick={remove}
              >
                {pending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
