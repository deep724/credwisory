"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteReferralLead, updateReferralStatus } from "@/app/admin/actions";
import { AdminDeleteConfirmation } from "@/components/admin-delete-confirmation";

const statuses = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "REJECTED"] as const;
type Status = (typeof statuses)[number];
type Referral = { id: string; referrerName: string; referrerPhone: string; referredName: string; referredPhone: string; code: string; status: string; createdAt: string };
type Props = { leads: Referral[]; query: { q: string; status: string }; canDelete: boolean };

const statusLabel = (status: string) => ({ NEW: "New", CONTACTED: "Contacted", IN_PROGRESS: "In Progress", CONVERTED: "Converted", REJECTED: "Rejected" })[status] || status;
const shortCode = (code: string) => code.length > 10 ? `REF-${code.slice(0, 4).toUpperCase()}…${code.slice(-4).toUpperCase()}` : `REF-${code.toUpperCase()}`;
const submittedAt = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export function ReferralLeadsManager({ leads, query, canDelete }: Props) {
  const router = useRouter();
  const statusDialog = useRef<HTMLDialogElement>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);
  const statusTitleId = useId();
  const detailTitleId = useId();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Status>>({});
  const [selected, setSelected] = useState<Referral | null>(null);
  const [detail, setDetail] = useState<Referral | null>(null);
  const [nextStatus, setNextStatus] = useState<Status>("NEW");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const hasFilters = Boolean(query.q || query.status);
  const items = leads.map((lead) => ({ ...lead, status: statusOverrides[lead.id] || lead.status }));

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const openStatus = (referral: Referral) => {
    setMenuFor(null);
    setSelected(referral);
    setNextStatus((statuses.includes(referral.status as Status) ? referral.status : "NEW") as Status);
    setError("");
    statusDialog.current?.showModal();
  };
  const closeStatus = () => {
    if (pending) return;
    statusDialog.current?.close();
    setSelected(null);
    setError("");
  };
  const openDetails = (referral: Referral) => {
    setMenuFor(null);
    setDetail(referral);
    detailsDialog.current?.showModal();
  };
  const closeDetails = () => {
    detailsDialog.current?.close();
    setDetail(null);
  };
  const copyCode = async (referral: Referral) => {
    setMenuFor(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard is unavailable");
      await navigator.clipboard.writeText(referral.code);
      setToast("Referral code copied.");
    } catch {
      setToast("We couldn't copy the code. Select it from View details instead.");
    }
  };
  const saveStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || pending) return;
    setPending(true);
    setError("");
    const form = new FormData();
    form.set("id", selected.id);
    form.set("status", nextStatus);
    try {
      const result = await updateReferralStatus(form);
      if (!result?.ok) { setError(result?.error || "We couldn't update this referral. Please try again."); return; }
      setStatusOverrides((current) => ({ ...current, [selected.id]: nextStatus }));
      statusDialog.current?.close();
      setSelected(null);
      setToast(result.unchanged ? "Referral status is already up to date." : "Referral status updated.");
      router.refresh();
    } catch {
      setError("We couldn't update this referral. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return <section className="cw-referrals" aria-label="Referral leads">
    <header className="cw-referrals__header">
      <div><p className="cw-admin-eyebrow">Lead management</p><h1>Referral Leads</h1><p>Manage and track education-loan referrals.</p></div>
      <span className="cw-referrals__count" aria-label={`${items.length} referral leads shown`}><b>{items.length}</b> {items.length === 1 ? "lead" : "leads"}</span>
    </header>

    <form className="cw-referrals__filters" role="search">
      <label className="cw-referrals__search"><span className="cw-sr-only">Search referrals</span><SearchIcon /><input name="q" type="search" placeholder="Search name or mobile" defaultValue={query.q} /></label>
      <label className="cw-referrals__filter"><span className="cw-sr-only">Filter by status</span><select name="status" defaultValue={query.status}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
      <button className="cw-referrals__filter-button" type="submit"><FilterIcon />Filter</button>
      {hasFilters ? <Link className="cw-referrals__reset" href="/admin/referrals">Clear filters</Link> : null}
    </form>

    <section className="cw-admin-panel cw-referrals__panel" aria-labelledby="referral-results-heading">
      <div className="cw-admin-panel-head"><div><p className="cw-admin-eyebrow">Referral directory</p><h2 id="referral-results-heading">{hasFilters ? "Filtered referrals" : "All referrals"}</h2></div><p className="cw-referrals__hint">Select a status to update a referral.</p></div>
      <div className="cw-admin-table-wrap cw-referrals__table-wrap">
        <table className="cw-referrals__table"><thead><tr><th>Referrer</th><th>Referred Student</th><th>Referral Code</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>
          {items.map((referral) => <tr key={referral.id}>
            <td data-label="Referrer"><Person name={referral.referrerName} phone={referral.referrerPhone} /></td>
            <td data-label="Referred Student"><Person name={referral.referredName} phone={referral.referredPhone} /></td>
            <td data-label="Referral Code"><div className="cw-referrals__code"><code title="Open details to view the full referral code">{shortCode(referral.code)}</code><button type="button" className="cw-referrals__copy" onClick={() => void copyCode(referral)} aria-label={`Copy referral code for ${referral.referredName}`} data-tooltip="Copy referral code" title="Copy referral code"><CopyIcon /></button></div></td>
            <td data-label="Status"><button type="button" className={`cw-referrals__status is-${referral.status.toLowerCase()}`} onClick={() => openStatus(referral)} aria-label={`Update status for ${referral.referredName}: ${statusLabel(referral.status)}`}>{statusLabel(referral.status)}<ChevronIcon /></button></td>
            <td data-label="Submitted"><time dateTime={referral.createdAt}>{submittedAt(referral.createdAt)}</time></td>
            <td data-label="Actions" className="cw-referrals__actions"><div className="cw-referrals__action-menu"><button type="button" className="cw-referrals__more" aria-label={`Actions for ${referral.referredName}`} aria-expanded={menuFor === referral.id} aria-controls={`referral-actions-${referral.id}`} onClick={() => setMenuFor(menuFor === referral.id ? null : referral.id)} data-tooltip="Actions" title="Actions"><MoreIcon /></button>{menuFor === referral.id ? <div id={`referral-actions-${referral.id}`} className="cw-referrals__menu" role="menu"><button type="button" role="menuitem" onClick={() => openDetails(referral)}>View details</button><button type="button" role="menuitem" onClick={() => openStatus(referral)}>Update status</button><button type="button" role="menuitem" onClick={() => void copyCode(referral)}>Copy referral code</button>{canDelete ? <AdminDeleteConfirmation title="Delete referral?" description={<>This permanently deletes the referral for <b>{referral.referredName}</b>.</>} triggerLabel={`Delete referral for ${referral.referredName}`} successMessage="Referral deleted successfully." triggerClassName="cw-referrals__menu-delete" onSuccess={() => router.refresh()} onConfirm={async () => { const form = new FormData(); form.set("id", referral.id); form.set("confirm", "DELETE"); return deleteReferralLead(form); }} /> : null}</div> : null}</div></td>
          </tr>)}
          {!items.length ? <tr><td colSpan={6} className="cw-referrals__empty"><EmptyIcon /><strong>{hasFilters ? "No matching referrals" : "No referral leads yet"}</strong><span>{hasFilters ? "Try clearing or changing your filters." : "New education-loan referrals will appear here."}</span>{hasFilters ? <Link href="/admin/referrals">Clear filters</Link> : null}</td></tr> : null}
        </tbody></table>
      </div>
    </section>

    <dialog ref={statusDialog} className="cw-referrals__dialog" aria-labelledby={statusTitleId} onCancel={(event) => { if (pending) event.preventDefault(); else closeStatus(); }} onClick={(event) => { if (event.target === event.currentTarget) closeStatus(); }}>
      <form method="dialog" onSubmit={(event) => void saveStatus(event)} className="cw-referrals__dialog-body"><div><p className="cw-admin-eyebrow">Referral status</p><h2 id={statusTitleId}>Update referral status</h2><p>Set the current progress for <b>{selected?.referredName}</b>.</p></div><label>Status<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as Status)} disabled={pending}>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>{error ? <p className="cw-referrals__error" role="alert">{error}</p> : null}<div className="cw-referrals__dialog-actions"><button type="button" className="cw-referrals__cancel" onClick={closeStatus} disabled={pending}>Cancel</button><button type="submit" className="cw-admin-primary" disabled={pending}>{pending ? "Updating…" : "Update status"}</button></div></form>
    </dialog>
    <dialog ref={detailsDialog} className="cw-referrals__dialog" aria-labelledby={detailTitleId} onCancel={closeDetails} onClick={(event) => { if (event.target === event.currentTarget) closeDetails(); }}>
      <div className="cw-referrals__dialog-body"><div><p className="cw-admin-eyebrow">Referral details</p><h2 id={detailTitleId}>{detail?.referredName}</h2><p>Submitted {detail ? submittedAt(detail.createdAt) : ""}</p></div><dl className="cw-referrals__details"><div><dt>Referrer</dt><dd>{detail?.referrerName}<small>{detail?.referrerPhone}</small></dd></div><div><dt>Referred student</dt><dd>{detail?.referredName}<small>{detail?.referredPhone}</small></dd></div><div><dt>Referral code</dt><dd><code>{detail?.code}</code></dd></div><div><dt>Status</dt><dd>{detail ? statusLabel(detail.status) : ""}</dd></div></dl><div className="cw-referrals__dialog-actions"><button type="button" className="cw-referrals__cancel" onClick={closeDetails}>Close</button>{detail ? <button type="button" className="cw-admin-primary" onClick={() => void copyCode(detail)}>Copy referral code</button> : null}</div></div>
    </dialog>
    {toast ? <p className="cw-referrals__toast" role="status">{toast}</p> : null}
  </section>;
}

function Person({ name, phone }: { name: string; phone: string }) { return <div className="cw-referrals__person"><strong>{name}</strong><small>{phone}</small></div>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>; }
function FilterIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10m-7 6h4"/></svg>; }
function CopyIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></svg>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>; }
function MoreIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>; }
function EmptyIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19c.7-3.4 3-5 7-5s6.3 1.6 7 5"/><circle cx="11" cy="7" r="3"/><path d="M18 7h3m-1.5-1.5v3"/></svg>; }
