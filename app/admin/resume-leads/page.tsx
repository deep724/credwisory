import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ResumeLead } from "@/lib/models";

export default async function ResumeLeadsPage() {
  const admin = await requireAdmin();
  await connectToDatabase();
  const leads = await ResumeLead.find().sort({ createdAt: -1 }).lean() as unknown as Array<{ _id: unknown; name: string; email: string; phone: string; resumeFileName: string; createdAt: Date }>;
  const role = admin.roleId as unknown as { name?: string; key?: string } | null;
  return <AdminShell name={admin.name} role={role?.name || role?.key || "Admin"}><header className="cw-admin-page-heading"><div><p className="cw-admin-eyebrow">Recruitment</p><h1>Resume Leads</h1><p>Submitted resumes are available only to signed-in administrators.</p></div></header><section className="cw-admin-panel cw-submission-panel"><div className="cw-admin-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Submitted</th><th>Resume</th></tr></thead><tbody>{leads.length ? leads.map((lead) => <tr key={String(lead._id)}><td>{lead.name}</td><td><a href={`mailto:${lead.email}`}>{lead.email}</a></td><td><a href={`tel:${lead.phone}`}>{lead.phone}</a></td><td>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(lead.createdAt)}</td><td><Link className="cw-submission-download" href={`/api/admin/resume-leads/${lead._id}/download`}>View / Download Resume<span className="cw-submission-file">{lead.resumeFileName}</span></Link></td></tr>) : <tr><td colSpan={5} className="cw-admin-empty">No resume submissions yet.</td></tr>}</tbody></table></div></section></AdminShell>;
}
