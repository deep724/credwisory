"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserDeleteAction({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function remove() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "same-origin" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        setError(typeof result?.error === "string" ? result.error : "We couldn't delete this admin account. Please try again.");
        return;
      }
      setOpen(false);
      router.push("/admin/users?notice=admin-deleted");
      router.refresh();
    } catch {
      setError("We couldn't delete this admin account. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <button type="button" className="cw-admin-user-delete" onClick={() => setOpen(true)}>Delete</button>
    {open ? <div className="cw-admin-confirm-backdrop"><section className="cw-admin-confirm" role="dialog" aria-modal="true" aria-labelledby={`delete-admin-${id}`} aria-describedby={`delete-admin-warning-${id}`}><h2 id={`delete-admin-${id}`}>Delete {name}?</h2><p id={`delete-admin-warning-${id}`}>Are you sure you want to delete this admin? This action cannot be undone.</p>{error ? <p className="cw-admin-error" role="alert">{error}</p> : null}<div><button type="button" className="cw-admin-reset" disabled={pending} onClick={() => setOpen(false)}>Cancel</button><button type="button" className="cw-admin-danger" disabled={pending} onClick={() => void remove()}>{pending ? "Deleting…" : "Delete"}</button></div></section></div> : null}
  </>;
}
