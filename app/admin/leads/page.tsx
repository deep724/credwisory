import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LeadDeleteAction } from "@/components/lead-delete-action";
import { LeadStatusControl } from "@/components/lead-status-control";
import { AdminFilterSelect } from "@/components/admin-filter-select";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser, Lead, Lender, StudentProfile } from "@/lib/models";

type Query = {
  q?: string;
  status?: string;
  type?: string;
  sourcePage?: string;
  lender?: string;
  assigned?: string;
  multiple?: string;
  page?: string;
};
const statuses = [
  "NEW",
  "IN_PROGRESS",
  "DOCUMENTS_PENDING",
  "CONTACTED",
  "APPLIED",
  "APPROVED",
  "CLOSED",
  "REJECTED",
];
const types = [
  "ELIGIBILITY",
  "SCHOLARSHIP_ELIGIBILITY",
  "LENDER_ENQUIRY",
  "LOAN_WITH_COLLATERAL",
  "LOAN_WITHOUT_COLLATERAL",
  "CONTACT",
  "REFERRAL",
];
const label = (value: string) =>
  value === "CLOSED"
    ? "Resolved / Closed"
    : value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const admin = await requireAdmin();
  await connectToDatabase();
  const p = await searchParams;
  const page = Math.max(1, Number(p.page) || 1);
  const limit = 10;
  const filter: Record<string, unknown> = { deletedAt: null };
  if (p.status && statuses.includes(p.status)) filter.status = p.status;
  if (p.type && types.includes(p.type)) filter.type = p.type;
  if (p.lender && /^[a-f\d]{24}$/i.test(p.lender)) filter.lenderId = p.lender;
  if (p.assigned && /^[a-f\d]{24}$/i.test(p.assigned))
    filter.assignedToId = p.assigned;
  const escaped = p.q?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (escaped)
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
    ];
  if (p.sourcePage?.trim())
    filter.sourcePage = {
      $regex: p.sourcePage.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  if (p.multiple === "true") {
    const profiles = await StudentProfile.find({
      enquiryCount: { $gt: 1 },
      mergedIntoId: null,
    })
      .select("_id")
      .lean();
    filter.studentProfileId = { $in: profiles.map((profile) => profile._id) };
  }
  const [leads, total, lenders, staff] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "name email phone type status sourcePage studentProfileId assignedToId lenderId createdAt",
      )
      .populate("studentProfileId", "enquiryCount")
      .populate("assignedToId", "name")
      .populate("lenderId", "name")
      .lean(),
    Lead.countDocuments(filter),
    Lender.find({ archivedAt: null })
      .sort({ displayOrder: 1 })
      .select("name")
      .lean(),
    AdminUser.find({ active: true }).sort({ name: 1 }).select("name").lean(),
  ]);
  const role = admin.roleId as unknown as { name?: string } | null;
  const maxPage = Math.max(1, Math.ceil(total / limit));
  if (page > maxPage) {
    const params = new URLSearchParams(Object.entries({ ...p, page: String(maxPage) }).filter(([, value]) => Boolean(value)) as [string, string][]);
    redirect(`/admin/leads?${params}`);
  }
  const firstRecord = total ? (page - 1) * limit + 1 : 0;
  const lastRecord = Math.min(page * limit, total);
  const pageNumbers = Array.from({ length: maxPage }, (_, index) => index + 1);
  const query = new URLSearchParams(
    Object.entries(p).filter(
      ([, value]) => value && value !== String(page),
    ) as [string, string][],
  );
  return (
    <AdminShell name={admin.name} role={role?.name || "Admin"}>
      <h1>Student leads</h1>
      <p className="cw-admin-kicker">
        {total} enquiry record{total === 1 ? "" : "s"} across public forms and
        referrals.
      </p>
      <form className="cw-admin-toolbar cw-leads-toolbar">
        <label className="cw-leads-filter">
          Search
          <input
            name="q"
            defaultValue={p.q}
            placeholder="Name, email or phone"
          />
        </label>
        <label className="cw-leads-filter">Enquiry type<AdminFilterSelect
          name="type"
          value={p.type}
          placeholder="All enquiry types"
          ariaLabel="Filter by enquiry type"
          options={types.map((value) => ({ value, label: label(value) }))}
        /></label>
        <label className="cw-leads-filter">Status<AdminFilterSelect
          name="status"
          value={p.status}
          placeholder="All statuses"
          ariaLabel="Filter by status"
          options={statuses.map((value) => ({ value, label: label(value) }))}
        /></label>
        <label className="cw-leads-filter cw-leads-source-filter">Source<input
          name="sourcePage"
          defaultValue={p.sourcePage}
          placeholder="Source page"
          aria-label="Filter source page"
        /></label>
        <label className="cw-leads-filter">Lender<AdminFilterSelect
          name="lender"
          value={p.lender}
          placeholder="All lenders"
          ariaLabel="Filter by lender"
          options={lenders.map((lender) => ({
            value: String(lender._id),
            label: lender.name,
          }))}
        /></label>
        <label className="cw-leads-filter">Assigned admin<AdminFilterSelect
          name="assigned"
          value={p.assigned}
          placeholder="All assigned admins"
          ariaLabel="Filter by assigned admin"
          options={staff.map((user) => ({
            value: String(user._id),
            label: user.name,
          }))}
        /></label>
        <label className="cw-leads-filter">Student filter<AdminFilterSelect
          name="multiple"
          value={p.multiple}
          placeholder="All students"
          ariaLabel="Filter by student grouping"
          options={[{ value: "true", label: "Multiple enquiries" }]}
        /></label>
        <div className="cw-leads-filter-actions"><button className="cw-admin-primary">Apply filters</button>
        <Link className="cw-admin-reset" href="/admin/leads">
          Reset filters
        </Link></div>
      </form>
      <section className="cw-admin-panel">
        <div className="cw-admin-table-wrap">
          <table className="cw-leads-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact</th>
                <th>Enquiry type</th>
                <th>Assigned Admin</th>
                <th>Current status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length ? (
                leads.map((lead) => {
                  const profile = lead.studentProfileId as unknown as {
                    _id?: unknown;
                    enquiryCount?: number;
                  } | null;
                  const assigned = lead.assignedToId as unknown as {
                    name?: string;
                  } | null;
                  return (
                    <tr key={String(lead._id)}>
                      <td data-label="Student" className="cw-lead-student">
                        <strong>{lead.name}</strong>
                        <br />
                        {profile?._id ? (
                          <Link
                            className="cw-admin-profile-link"
                            href={`/admin/students/${profile._id}`}
                          >
                            View student profile · {profile.enquiryCount || 1}{" "}
                            linked{" "}
                            {profile.enquiryCount === 1
                              ? "enquiry"
                              : "enquiries"}
                          </Link>
                        ) : (
                          <small>Profile pending backfill</small>
                        )}
                      </td>
                      <td data-label="Contact" className="cw-lead-contact">
                        <span className="cw-lead-contact-item"><PhoneIcon />{lead.phone || "No phone"}</span>
                        <span className="cw-lead-contact-item" title={lead.email || "No email"}><MailIcon />{lead.email || "No email"}</span>
                      </td>
                      <td data-label="Enquiry type">
                        <span className="cw-admin-type">
                          {label(lead.type)}
                        </span>
                      </td>
                      <td data-label="Assigned Admin" className="cw-lead-lender" title={assigned?.name || "Unassigned"}>{assigned?.name || "Unassigned"}</td>
                      <td data-label="Current status">
                        <LeadStatusControl
                          id={String(lead._id)}
                          name={lead.name}
                          status={lead.status}
                          statuses={statuses}
                        />
                      </td>
                      <td data-label="Created" className="cw-lead-created">{lead.createdAt.toLocaleDateString()}</td>
                      <td data-label="Actions" className="cw-admin-row-actions cw-lead-actions"><Link className="cw-lead-open" href={`/admin/leads/${lead._id}`}>Open lead</Link>{lead.status === "CLOSED" && <LeadDeleteAction id={String(lead._id)} name={lead.name} identifier={lead.email || lead.phone || "No contact detail"} type={label(lead.type)} />}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="cw-admin-empty">
                    No leads match these filters. Clear a filter or wait for a
                    new enquiry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <nav className="cw-admin-pagination" aria-label="Lead pagination">
          <span className="cw-admin-pagination__summary">Showing {firstRecord}–{lastRecord} of {total} lead{total === 1 ? "" : "s"}</span>
          <div className="cw-admin-pagination__controls"><PaginationLink disabled={page === 1} href={`/admin/leads?${new URLSearchParams([...query, ["page", String(page - 1)]])}`}>Previous</PaginationLink>{pageNumbers.map((number) => number === page ? <span key={number} className="active" aria-current="page">{number}</span> : <Link key={number} href={`/admin/leads?${new URLSearchParams([...query, ["page", String(number)]])}`}>{number}</Link>)}<PaginationLink disabled={page === maxPage} href={`/admin/leads?${new URLSearchParams([...query, ["page", String(page + 1)]])}`}>Next</PaginationLink></div>
        </nav>
      </section>
    </AdminShell>
  );
}

function PaginationLink({ disabled, href, children }: { disabled: boolean; href: string; children: ReactNode }) {
  return disabled ? <span aria-disabled="true" className="disabled">{children}</span> : <Link href={href}>{children}</Link>;
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5 9 6 7.5 8.5a14 14 0 0 0 8 8L18 15l2.5 2.5-2 3a2 2 0 0 1-2.1.9C8.7 19.7 4.3 15.3 2.6 7.6a2 2 0 0 1 .9-2.1l3-2Z" /></svg>;
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
}

function sourceLabel(value?: string) {
  if (!value) return "—";
  if (value.includes("scholarship-eligibility"))
    return "Scholarship Eligibility";
  if (value.includes("loan-with-collateral")) return "Loan with Collateral";
  if (value.includes("loan-without-collateral"))
    return "Loan without Collateral";
  if (value.includes("talk-to-an-expert")) return "Talk to an Expert";
  if (value.includes("refer")) return "Refer a Friend";
  if (value.includes("contact")) return "Contact page";
  if (value.includes("eligibility")) return "Eligibility form";
  return "Website enquiry";
}
