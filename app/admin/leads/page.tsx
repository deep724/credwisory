import Link from "next/link";
import { updateLeadStatus } from "@/app/admin/actions";
import { AdminFilterSelect } from "@/components/admin-filter-select";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser, Lead, Lender, StudentProfile } from "@/lib/models";

type Query = { q?: string; status?: string; type?: string; sourcePage?: string; lender?: string; assigned?: string; multiple?: string; page?: string };
const statuses = ["NEW", "IN_PROGRESS", "DOCUMENTS_PENDING", "CONTACTED", "APPLIED", "APPROVED", "CLOSED", "REJECTED"];
const types = ["ELIGIBILITY", "SCHOLARSHIP_ELIGIBILITY", "LENDER_ENQUIRY", "LOAN_WITH_COLLATERAL", "LOAN_WITHOUT_COLLATERAL", "CONTACT", "REFERRAL"];
const label = (value: string) => value === "CLOSED" ? "Resolved / Closed" : value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default async function Leads({ searchParams }: { searchParams: Promise<Query> }) {
  const admin = await requireAdmin();
  await connectToDatabase();
  const p = await searchParams;
  const page = Math.max(1, Number(p.page) || 1);
  const limit = 50;
  const filter: Record<string, unknown> = { deletedAt: null };
  if (p.status && statuses.includes(p.status)) filter.status = p.status;
  if (p.type && types.includes(p.type)) filter.type = p.type;
  if (p.lender && /^[a-f\d]{24}$/i.test(p.lender)) filter.lenderId = p.lender;
  if (p.assigned && /^[a-f\d]{24}$/i.test(p.assigned)) filter.assignedToId = p.assigned;
  const escaped = p.q?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (escaped) filter.$or = [{ name: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }, { phone: { $regex: escaped, $options: "i" } }];
  if (p.sourcePage?.trim()) filter.sourcePage = { $regex: p.sourcePage.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (p.multiple === "true") {
    const profiles = await StudentProfile.find({ enquiryCount: { $gt: 1 }, mergedIntoId: null }).select("_id").lean();
    filter.studentProfileId = { $in: profiles.map((profile) => profile._id) };
  }
  const [leads, total, lenders, staff] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select("name email phone type status sourcePage studentProfileId assignedToId createdAt").populate("studentProfileId", "enquiryCount").populate("assignedToId", "name").lean(),
    Lead.countDocuments(filter),
    Lender.find({ archivedAt: null }).sort({ displayOrder: 1 }).select("name").lean(),
    AdminUser.find({ active: true }).sort({ name: 1 }).select("name").lean(),
  ]);
  const role = admin.roleId as unknown as { name?: string } | null;
  const maxPage = Math.max(1, Math.ceil(total / limit));
  const query = new URLSearchParams(Object.entries(p).filter(([, value]) => value && value !== String(page)) as [string, string][]);
  return <AdminShell name={admin.name} role={role?.name || "Admin"}>
    <h1>Student leads</h1>
    <p className="cw-admin-kicker">{total} enquiry record{total === 1 ? "" : "s"} across public forms and referrals.</p>
    <form className="cw-admin-toolbar">
      <input name="q" defaultValue={p.q} placeholder="Search name, email or phone" aria-label="Search leads" />
      <AdminFilterSelect name="type" value={p.type} placeholder="All enquiry types" ariaLabel="Filter by enquiry type" options={types.map((value) => ({ value, label: label(value) }))} />
      <AdminFilterSelect name="status" value={p.status} placeholder="All statuses" ariaLabel="Filter by status" options={statuses.map((value) => ({ value, label: label(value) }))} />
      <input name="sourcePage" defaultValue={p.sourcePage} placeholder="Source page" aria-label="Filter source page" />
      <AdminFilterSelect name="lender" value={p.lender} placeholder="All lenders" ariaLabel="Filter by lender" options={lenders.map((lender) => ({ value: String(lender._id), label: lender.name }))} />
      <AdminFilterSelect name="assigned" value={p.assigned} placeholder="All assigned admins" ariaLabel="Filter by assigned admin" options={staff.map((user) => ({ value: String(user._id), label: user.name }))} />
      <AdminFilterSelect name="multiple" value={p.multiple} placeholder="All students" ariaLabel="Filter by student grouping" options={[{ value: "true", label: "Multiple enquiries" }]} />
      <button className="cw-admin-primary">Apply filters</button>
    </form>
    <section className="cw-admin-panel">
      <div className="cw-admin-table-wrap"><table><thead><tr><th>Student</th><th>Enquiry type</th><th>Source page</th><th>Assigned</th><th>Current status</th><th>Created</th></tr></thead><tbody>
        {leads.length ? leads.map((lead) => {
          const profile = lead.studentProfileId as unknown as { _id?: unknown; enquiryCount?: number } | null;
          const assigned = lead.assignedToId as unknown as { name?: string } | null;
          return <tr key={String(lead._id)}><td><strong>{lead.name}</strong><br /><small>{lead.email || lead.phone || "No contact detail"}</small><br />{profile?._id ? <Link className="cw-admin-profile-link" href={`/admin/students/${profile._id}`}>View student profile · {profile.enquiryCount || 1} linked {profile.enquiryCount === 1 ? "enquiry" : "enquiries"}</Link> : <small>Profile pending backfill</small>}</td><td><span className="cw-admin-type">{label(lead.type)}</span></td><td>{sourceLabel(lead.sourcePage)}</td><td>{assigned?.name || "Unassigned"}</td><td><div className="cw-status-control"><span className={`cw-admin-badge cw-status-${lead.status.toLowerCase()}`}>{label(lead.status)}</span><form action={updateLeadStatus} className="cw-admin-actions"><input type="hidden" name="id" value={String(lead._id)} /><select name="status" aria-label={`Update ${lead.name}'s status`} defaultValue={lead.status}>{statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select><button type="submit">Save status</button></form></div></td><td>{lead.createdAt.toLocaleDateString()}</td></tr>;
        }) : <tr><td colSpan={6} className="cw-admin-empty">No leads match these filters. Clear a filter or wait for a new enquiry.</td></tr>}
      </tbody></table></div>
      {maxPage > 1 && <nav className="cw-admin-actions" aria-label="Lead pagination" style={{ marginTop: 16 }}><span>Page {page} of {maxPage}</span>{page > 1 && <Link href={`/admin/leads?${new URLSearchParams([...query, ["page", String(page - 1)]])}`}>Previous</Link>}{page < maxPage && <Link href={`/admin/leads?${new URLSearchParams([...query, ["page", String(page + 1)]])}`}>Next</Link>}</nav>}
    </section>
  </AdminShell>;
}

function sourceLabel(value?: string) {
  if (!value) return "—";
  if (value.includes("scholarship-eligibility")) return "Scholarship Eligibility";
  if (value.includes("loan-with-collateral")) return "Loan with Collateral";
  if (value.includes("loan-without-collateral")) return "Loan without Collateral";
  if (value.includes("talk-to-an-expert")) return "Talk to an Expert";
  if (value.includes("refer")) return "Refer a Friend";
  if (value.includes("contact")) return "Contact page";
  if (value.includes("eligibility")) return "Eligibility form";
  return "Website enquiry";
}
