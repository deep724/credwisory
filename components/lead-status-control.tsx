"use client";
import { useState } from "react";
import { updateLeadStatus } from "@/app/admin/actions";
const label = (value: string) => value === "CLOSED" ? "Resolved / Closed" : value.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
export function LeadStatusControl({ id, name, status, statuses }: { id: string; name: string; status: string; statuses: string[] }) {
  const [next, setNext] = useState(status); const [message, setMessage] = useState(""); const [pending, setPending] = useState(false);
  async function save() { setPending(true); setMessage(""); const data = new FormData(); data.set("id", id); data.set("status", next); const result = await updateLeadStatus(data); setPending(false); setMessage(result?.ok ? "Saved" : result?.error || "Could not save"); }
  return <div className="cw-status-control"><span className={`cw-admin-badge cw-status-${status.toLowerCase()}`}>{label(status)}</span><select value={next} onChange={(event) => { setNext(event.target.value); setMessage(""); }} aria-label={`Update ${name}'s status`}>{statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select><button type="button" onClick={save} disabled={pending || next === status}>{pending ? "Saving…" : "Save status"}</button>{message && <small role={message === "Saved" ? "status" : "alert"}>{message}</small>}</div>;
}
