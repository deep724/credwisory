"use client";

import { useState } from "react";
import { updateLeadStatus } from "@/app/admin/actions";

const label = (value: string) => value === "CLOSED" ? "Resolved / Closed" : value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function LeadStatusControl({ id, name, status, statuses }: { id: string; name: string; status: string; statuses: string[] }) {
  const [savedStatus, setSavedStatus] = useState(status);
  const [next, setNext] = useState(status);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [pending, setPending] = useState(false);

  async function save() {
    if (pending || next === savedStatus) return;
    setPending(true);
    setError("");
    const data = new FormData();
    data.set("id", id);
    data.set("status", next);
    try {
      const result = await updateLeadStatus(data);
      if (!result?.ok) {
        setError(result?.error || "Could not save the status. Please try again.");
        return;
      }
      setSavedStatus(next);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2_500);
    } catch {
      setError("Could not save the status. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <div className="cw-lead-status-control-wrap"><div className="cw-status-control">
    <span className={`cw-admin-badge cw-status-${savedStatus.toLowerCase()}`}>{label(savedStatus)}</span>
    <select value={next} onChange={(event) => { setNext(event.target.value); setError(""); }} aria-label={`Select status for ${name}`}>
      {statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}
    </select>
    <button className="cw-lead-status-save" type="button" onClick={save} disabled={pending || next === savedStatus} aria-label={pending ? `Saving status for ${name}` : `Save status for ${name}`} aria-busy={pending || undefined} data-tooltip={pending ? "Saving status" : "Save status"} title={pending ? "Saving status" : "Save status"}>
      <span>{pending ? "Saving…" : "Save status"}</span>
    </button>
    </div>
    {error ? <p className="cw-lead-status-error" role="alert">{error}</p> : null}
    {savedNotice ? <p className="cw-lead-status-toast" role="status">Status updated</p> : null}
  </div>;
}
