"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
export default function LoginPage() {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [visible, setVisible] = useState(false); const router = useRouter();
  async function login(form: FormData) { setBusy(true); setError(""); try { const response = await fetch("/api/admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) }); const data = await response.json().catch(() => null); if (response.ok) { router.replace(data?.passwordChangeRequired ? "/admin/change-password" : "/admin"); router.refresh(); } else setError(response.status === 401 ? "Invalid credentials." : "Unable to sign in. Please try again."); } catch { setError("Sign-in is temporarily unavailable. Please retry."); } finally { setBusy(false); } }
  return <main className="admin-login"><form action={login}><Image src="/logo-new.png" alt="Credwisory" width={180} height={46} priority/><div><h1>Admin console</h1><p>Secure team access</p></div><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<span className="admin-password"><input name="password" type={visible ? "text" : "password"} autoComplete="current-password" minLength={12} required /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? "Hide" : "Show"}</button></span></label>{error && <p className="admin-login-error" role="alert">{error}</p>}<button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form></main>;
}
