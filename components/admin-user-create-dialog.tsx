"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminUser } from "@/app/admin/actions";

export function AdminUserCreateDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    setPending(true); setError("");
    try { const result = await createAdminUser(formData); if (result && "ok" in result && result.ok) { dialogRef.current?.close(); router.refresh(); } else setError(result?.error || "We couldn't create this admin user. Please check the details and try again."); }
    catch { setError("We couldn't create this admin user. Please check the details and try again."); }
    finally { setPending(false); }
  }
  return <>
    <button type="button" className="cw-admin-primary cw-admin-add-user" onClick={() => dialogRef.current?.showModal()}><UserPlusIcon />Add admin user</button>
    <dialog ref={dialogRef} className="cw-admin-dialog" aria-labelledby="add-admin-user-title"><div className="cw-admin-dialog-inner cw-admin-user-dialog">
      <div className="cw-admin-panel-head"><div><p className="cw-admin-eyebrow">Team access</p><h2 id="add-admin-user-title">Add an admin user</h2><p>Set up secure access for a trusted member of your team.</p></div><button type="button" className="cw-admin-dialog-close" aria-label="Close add admin user dialog" onClick={() => dialogRef.current?.close()}>×</button></div>
      <form action={submit} className="cw-admin-form">
        <label>Full name<input name="name" required autoComplete="name" /></label>
        <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
        <label>Temporary password<input name="password" type="password" minLength={12} autoComplete="new-password" required aria-describedby="admin-password-help" /><small id="admin-password-help">At least 12 characters. The user must change it after first sign-in.</small></label>
        {error ? <p className="cw-admin-error" role="alert">{error}</p> : null}
        <div className="cw-admin-dialog-actions"><button type="button" className="cw-admin-reset" disabled={pending} onClick={() => dialogRef.current?.close()}>Cancel</button><button className="cw-admin-primary" disabled={pending}>{pending ? "Creating…" : "Create admin user"}</button></div>
      </form>
    </div></dialog>
  </>;
}
function UserPlusIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M8.5 10.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6m3-3h-6" /></svg>; }
