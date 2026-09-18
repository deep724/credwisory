import Link from "next/link";
import { updateApplicationStatus } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminIconSubmitButton } from "@/components/admin-icon-submit-button";
import { ApplicationDeleteAction } from "@/components/application-delete-action";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Application } from "@/lib/models";

const statuses = [
  "SUBMITTED",
  "IN_REVIEW",
  "DOCUMENTS_PENDING",
  "APPROVED",
  "REJECTED",
  "DISBURSED",
];
const readable = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

type LeadRecord = {
  _id?: unknown;
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
  sourcePage?: string;
  formData?: { loanPurpose?: unknown; loanType?: unknown; applicationSource?: unknown };
} | null;
type LenderRecord = { name?: string; logoUrl?: string } | null;

export default async function Applications() {
  const admin = await requireAdmin();
  await connectToDatabase();
  const applications = await Application.find()
    .sort({ createdAt: -1 })
    .populate("leadId", "name email phone type sourcePage formData")
    .populate("lenderId", "name logoUrl")
    .lean();
  const role = admin.roleId as unknown as { name?: string } | null;

  return (
    <AdminShell name={admin.name} role={role?.name || "Admin"}>
      <h1>Applications</h1>
      <p className="cw-admin-kicker">
        Submitted lender applications and their review progress.
      </p>
      <section className="cw-admin-panel">
        <div className="cw-admin-table-wrap cw-applications-wrap">
          <table className="cw-applications-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Selected lender</th>
                <th>Source / loan type</th>
                <th>Application status</th>
                <th><span className="cw-application-activity-head"><CalendarIcon />Activity</span></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length ? (
                applications.map((application) => {
                  const lead = application.leadId as unknown as LeadRecord;
                  const lender =
                    application.lenderId as unknown as LenderRecord;
                  const loanType = lead?.type ? readable(lead.type) : "Education loan";
                  return (
                    <tr key={String(application._id)}>
                      <td data-label="Applicant" className="cw-application-applicant">
                        {lead?._id ? (
                          <Link href={`/admin/leads/${lead._id}`}>
                            {lead.name || "Unnamed applicant"}
                          </Link>
                        ) : (
                          "Deleted lead"
                        )}
                        <span className="cw-application-contact"><PhoneIcon />{lead?.phone || "No phone"}</span>
                        <span className="cw-application-contact cw-application-email" title={lead?.email || "No email"}><MailIcon />{lead?.email || "No email"}</span>
                      </td>
                      <td data-label="Selected lender"><span className="cw-application-lender" title={lender?.name || "Deleted lender"}><b>{lender?.name || "Deleted lender"}</b></span></td>
                      <td data-label="Source / loan type"><span className="cw-application-source" title={loanType}>Lender Enquiry</span></td>
                      <td data-label="Application status">
                        <form
                          action={updateApplicationStatus}
                          className="cw-status-control"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={String(application._id)}
                          />
                          <span
                            className={`cw-admin-badge cw-status-${application.status.toLowerCase()}`}
                          >
                            {readable(application.status)}
                          </span>
                          <select
                            name="status"
                            aria-label={`Status for ${lead?.name || "application"}`}
                            defaultValue={application.status}
                          >
                            {statuses.map((status) => (
                              <option key={status}>{readable(status)}</option>
                            ))}
                          </select>
                          <AdminIconSubmitButton className="cw-application-update" label={`Update status for ${lead?.name || "application"}`} tooltip="Update status" pendingLabel="Updating">Update</AdminIconSubmitButton>
                        </form>
                      </td>
                      <td data-label="Activity"><span className="cw-application-activity" title={new Date(application.createdAt).toLocaleString()}><b>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(application.createdAt))}</b><small>{relativeDate(new Date(application.createdAt))}</small></span></td>
                      <td data-label="Actions" className="cw-admin-row-actions cw-application-actions">
                        {lead?._id ? (
                          <Link href={`/admin/leads/${lead._id}`} className="cw-application-view" aria-label={`View details for ${lead.name || "application"}`} data-tooltip="View details" title="View details">
                            <EyeIcon />
                          </Link>
                        ) : null}
                        {lead?._id ? <Link href={`/admin/leads/${lead._id}`} className="cw-admin-icon-action is-edit" aria-label={`Edit application for ${lead.name || "applicant"}`} data-tooltip="Edit application" title="Edit application"><PencilIcon /></Link> : null}
                        <ApplicationDeleteAction id={String(application._id)} name={lead?.name || "this applicant"} lender={lender?.name || "this lender"}/>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="cw-admin-empty">
                    No lender applications received yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

function EyeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
}
function PencilIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m12.5 7.5 4 4"/></svg>; }
function PhoneIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5 9 6 7.5 8.5a14 14 0 0 0 8 8L18 15l2.5 2.5-2 3a2 2 0 0 1-2.1.9C8.7 19.7 4.3 15.3 2.6 7.6a2 2 0 0 1 .9-2.1l3-2Z"/></svg>; }
function MailIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>; }
function CalendarIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/></svg>; }
function relativeDate(date: Date) { const days=Math.floor((Date.now()-date.getTime())/86400000); return days<=0?"Today":days===1?"Yesterday":`${days} days ago`; }
