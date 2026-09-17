import Link from "next/link";
import { updateApplicationStatus } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
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
  formData?: { loanPurpose?: unknown; loanType?: unknown; applicationSource?: unknown };
} | null;
type LenderRecord = { name?: string } | null;

export default async function Applications() {
  const admin = await requireAdmin();
  await connectToDatabase();
  const applications = await Application.find()
    .sort({ createdAt: -1 })
    .populate("leadId", "name email phone formData")
    .populate("lenderId", "name")
    .lean();
  const role = admin.roleId as unknown as { name?: string } | null;

  return (
    <AdminShell name={admin.name} role={role?.name || "Admin"}>
      <h1>Applications</h1>
      <p className="cw-admin-kicker">
        Submitted lender applications and their review progress.
      </p>
      <section className="cw-admin-panel">
        <div className="cw-admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Selected lender</th>
                <th>Loan type</th>
                <th>Application status</th>
                <th>Submitted</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.length ? (
                applications.map((application) => {
                  const lead = application.leadId as unknown as LeadRecord;
                  const lender =
                    application.lenderId as unknown as LenderRecord;
                  const loanType = "Education loan";
                  return (
                    <tr key={String(application._id)}>
                      <td>
                        {lead?._id ? (
                          <Link href={`/admin/leads/${lead._id}`}>
                            {lead.name || "Unnamed applicant"}
                          </Link>
                        ) : (
                          "Deleted lead"
                        )}
                        <br />
                        <small>
                          {lead?.email || lead?.phone || "No contact detail"}
                        </small>
                      </td>
                      <td>{lender?.name || "Deleted lender"}</td>
                      <td>{loanType}</td>
                      <td>
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
                          <button>Update</button>
                        </form>
                      </td>
                      <td>{application.createdAt.toLocaleDateString()}</td>
                      <td className="cw-admin-row-actions">
                        {lead?._id ? (
                          <Link href={`/admin/leads/${lead._id}`}>
                            View details
                          </Link>
                        ) : null}
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
