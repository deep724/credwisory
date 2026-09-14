import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Application, Lead, Lender } from "@/lib/models";

export default async function AdminDashboard() {
  const admin = await requireAdmin(); await connectToDatabase(); const today = new Date(); today.setHours(0, 0, 0, 0);
  const [total, newLeads, contacted, applications, lenders, recent] = await Promise.all([Lead.countDocuments({ deletedAt: null }), Lead.countDocuments({ deletedAt: null, createdAt: { $gte: today } }), Lead.countDocuments({ deletedAt: null, status: "CONTACTED" }), Application.countDocuments(), Lender.countDocuments({ archivedAt: null }), Lead.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(8).populate("lenderId", "name").lean()]);
  const role = admin.roleId as unknown as { name?: string; key?: string } | null;
  return <AdminShell name={admin.name} role={role?.name || role?.key || "Admin"}><h1>Good day, {admin.name.split(" ")[0]}</h1><p className="cw-admin-kicker">Your Credwisory admissions pipeline at a glance.</p><section className="cw-admin-grid"><Stat label="Total leads" value={total}/><Stat label="New today" value={newLeads}/><Stat label="Contacted" value={contacted}/><Stat label="Applications" value={applications}/><Stat label="Active lenders" value={lenders}/></section><section className="cw-admin-panel"><div className="cw-admin-panel-head"><h2>Recent student enquiries</h2><Link href="/admin/leads">View all leads</Link></div><div className="cw-admin-table-wrap"><table><thead><tr><th>Student</th><th>Source</th><th>Lender</th><th>Status</th><th>Received</th></tr></thead><tbody>{recent.length ? recent.map((lead) => { const lender = lead.lenderId as unknown as { name?: string } | null; return <tr key={String(lead._id)}><td><Link href={`/admin/leads/${lead._id}`}>{lead.name}</Link><br/><small>{lead.email || lead.phone || "No contact detail"}</small></td><td>{lead.type}</td><td>{lender?.name || "—"}</td><td><span className="cw-admin-badge">{lead.status.replaceAll("_", " ")}</span></td><td>{lead.createdAt.toLocaleDateString()}</td></tr>; }) : <tr><td colSpan={5} className="cw-admin-empty">No student enquiries yet.</td></tr>}</tbody></table></div></section></AdminShell>;
}
function Stat({ label, value }: { label: string; value: number }) { return <article className="cw-admin-stat"><b>{value}</b><span>{label}</span></article>; }
