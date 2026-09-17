"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type NavIconName =
  | "overview"
  | "leads"
  | "applications"
  | "lenders"
  | "blogs"
  | "users"
  | "audit";

const links: ReadonlyArray<{
  label: string;
  href: string;
  icon: NavIconName;
  superAdmin?: boolean;
}> = [
  { label: "Overview", href: "/admin", icon: "overview" },
  { label: "Student leads", href: "/admin/leads", icon: "leads" },
  { label: "Applications", href: "/admin/applications", icon: "applications" },
  { label: "Lenders", href: "/admin/lenders", icon: "lenders" },
  { label: "Blogs", href: "/admin/blogs", icon: "blogs" },
  { label: "Users", href: "/admin/users", icon: "users", superAdmin: true },
  { label: "Audit trail", href: "/admin/audit", icon: "audit" },
];

function NavIcon({ name }: { name: NavIconName }) {
  const paths: Record<NavIconName, ReactNode> = {
    overview: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    leads: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c.7-3.4 3-5 7-5s6.3 1.6 7 5" />
      </>
    ),
    applications: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M10 12h4M10 16h4" />
      </>
    ),
    lenders: (
      <>
        <path d="M4 20h16M6 20V8l6-4 6 4v12M9 20v-5h6v5M9 10h.01M15 10h.01" />
      </>
    ),
    blogs: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M10 12h4M10 16h4" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.5-3.3 2.4-5 5.5-5 1.2 0 2.3.3 3.1.9M15 5.5a3 3 0 1 1 0 5.9M15 15c3.1 0 5 1.7 5.5 5" />
      </>
    ),
    audit: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };
  return (
    <svg className="cw-admin-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function AdminShell({
  children,
  name,
  role,
}: {
  children: ReactNode;
  name: string;
  role: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleLinks = links.filter(
    (link) => !link.superAdmin || role.toLowerCase().includes("super"),
  );

  useEffect(() => {
    links
      .filter(
        (link) =>
          (!link.superAdmin || role.toLowerCase().includes("super")) &&
          link.href !== pathname,
      )
      .forEach(({ href }) => router.prefetch(href));
  }, [pathname, router, role]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const navigation = (onNavigate?: () => void) =>
    visibleLinks.map((link) => (
      <Link
        key={link.href}
        prefetch
        href={link.href}
        onClick={onNavigate}
        className={pathname === link.href ? "active" : ""}
      >
        <NavIcon name={link.icon} />
        <span>{link.label}</span>
      </Link>
    ));

  return (
    <div className="cw-admin">
      <aside className="cw-admin-sidebar">
        <Link className="cw-admin-brand" href="/admin" prefetch>
          <Image
            src="/logo-new.png"
            alt="Credwisory"
            width={156}
            height={40}
            priority
          />
          <small>Admin console</small>
        </Link>
        <nav aria-label="Admin navigation">{navigation()}</nav>
        <div className="cw-admin-profile">
          <span className="cw-admin-avatar" aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
          <div>
            <strong>{name}</strong>
            <span>{role}</span>
          </div>
          <button type="button" className="cw-admin-signout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="cw-admin-mobilebar">
        <Link className="cw-admin-brand" href="/admin" prefetch>
          <Image src="/logo-new.png" alt="Credwisory" width={126} height={32} />
        </Link>
        <button
          type="button"
          className="cw-admin-menu-button"
          aria-label={
            mobileOpen ? "Close admin navigation" : "Open admin navigation"
          }
          aria-expanded={mobileOpen}
          aria-controls="cw-admin-mobile-nav"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d={
                mobileOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"
              }
            />
          </svg>
        </button>
      </div>
      <button
        type="button"
        tabIndex={mobileOpen ? 0 : -1}
        aria-label="Close admin navigation"
        className={`cw-admin-drawer-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`cw-admin-mobile-nav ${mobileOpen ? "open" : ""}`}
        id="cw-admin-mobile-nav"
        aria-hidden={!mobileOpen}
      >
        <nav aria-label="Admin navigation">
          {navigation(() => setMobileOpen(false))}
        </nav>
        <div className="cw-admin-mobile-profile">
          <strong>{name}</strong>
          <span>{role}</span>
          <button type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="cw-admin-main">{children}</main>
    </div>
  );
}
