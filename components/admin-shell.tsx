"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const links = [
  ["Overview", "/admin"], ["Student leads", "/admin/leads"], ["Applications", "/admin/applications"],
  ["Lenders", "/admin/lenders"], ["Users", "/admin/users"], ["Audit trail", "/admin/audit"],
] as const;

export function AdminShell({ children, name, role }: { children: ReactNode; name: string; role: string }) {
  const pathname = usePathname(); const router = useRouter();
  useEffect(() => { links.filter(([, href]) => href !== pathname && (href !== "/admin/users" || role.toLowerCase().includes("super"))).forEach(([, href]) => router.prefetch(href)); }, [pathname, role, router]);
  async function logout() { await fetch("/api/admin/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }
  const visibleLinks = links.filter(([, href]) => href !== "/admin/users" || role.toLowerCase().includes("super"));
  return <div className="cw-admin"><aside className="cw-admin-sidebar"><Link className="cw-admin-brand" href="/admin" prefetch><Image src="/logo-new.png" alt="Credwisory" width={156} height={40} priority/><small>ADMIN CONSOLE</small></Link><nav aria-label="Admin navigation">{visibleLinks.map(([label, href]) => <Link key={href} prefetch className={pathname === href ? "active" : ""} href={href}>{label}</Link>)}</nav><div className="cw-admin-profile"><strong>{name}</strong><span>{role}</span><button type="button" onClick={logout}>Sign out</button></div></aside><div className="cw-admin-mobilebar"><Link className="cw-admin-brand" href="/admin" prefetch><Image src="/logo-new.png" alt="Credwisory" width={126} height={32}/></Link><button type="button" onClick={logout}>Sign out</button></div><main className="cw-admin-main">{children}</main></div>;
}
