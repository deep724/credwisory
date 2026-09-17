import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Application, Lead } from "@/lib/models";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  await connectToDatabase();
  const [totalLeads, newLeads, activeApplications, closedLeads, recent] =
    await Promise.all([
      Lead.countDocuments({ deletedAt: null }),
      Lead.countDocuments({ deletedAt: null, status: "NEW" }),
      Application.countDocuments({
        status: { $in: ["SUBMITTED", "IN_REVIEW", "DOCUMENTS_PENDING"] },
      }),
      Lead.countDocuments({ deletedAt: null, status: "CLOSED" }),
      Lead.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("lenderId", "name")
        .lean(),
    ]);
  const role = admin.roleId as unknown as {
    name?: string;
    key?: string;
  } | null;
  return (
    <AdminShell name={admin.name} role={role?.name || role?.key || "Admin"}>
      <h1>Good day, {admin.name.split(" ")[0]}</h1>
      <p className="cw-admin-kicker">
        Your Credwisory admissions pipeline at a glance.
      </p>
      <section className="cw-admin-grid cw-admin-grid--overview">
        <Stat label="Total leads" value={totalLeads} icon="leads" />
        <Stat label="New leads" value={newLeads} icon="new" />
        <Stat
          label="Active applications"
          value={activeApplications}
          icon="applications"
        />
        <Stat label="Closed leads" value={closedLeads} icon="closed" />
      </section>
      <section className="cw-admin-panel">
        <div className="cw-admin-panel-head">
          <h2>Recent student enquiries</h2>
          <div className="cw-admin-actions">
            <Link href="/admin/leads?sourcePage=source%3Dpopup">
              Popup leads
            </Link>
            <Link href="/admin/leads">View all leads</Link>
          </div>
        </div>
        <div className="cw-admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Source</th>
                <th>Lender</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {recent.length ? (
                recent.map((lead) => {
                  const lender = lead.lenderId as unknown as {
                    name?: string;
                  } | null;
                  return (
                    <tr key={String(lead._id)}>
                      <td>
                        <Link href={`/admin/leads/${lead._id}`}>
                          {lead.name}
                        </Link>
                        <br />
                        <small>
                          {lead.email || lead.phone || "No contact detail"}
                        </small>
                      </td>
                      <td>{formatTechnicalValue(lead.type)}</td>
                      <td>{lender?.name || "—"}</td>
                      <td>
                        <span
                          className={`cw-admin-badge cw-status-${lead.status.toLowerCase()}`}
                        >
                          {lead.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>{lead.createdAt.toLocaleDateString()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="cw-admin-empty">
                    No student enquiries yet.
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
function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: "leads" | "new" | "applications" | "closed";
}) {
  const iconContent = {
    leads: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c.7-3.4 3-5 7-5s6.3 1.6 7 5" />
      </>
    ),
    new: (
      <>
        <path d="M12 4v16M4 12h16" />
      </>
    ),
    applications: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M10 13h4M10 17h4" />
      </>
    ),
    closed: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
  }[icon];
  return (
    <article className="cw-admin-stat">
      <span className="cw-admin-stat-icon-area" aria-hidden="true">
        <span className="cw-admin-stat-icon">
          <svg viewBox="0 0 24 24">{iconContent}</svg>
        </span>
      </span>
      <div className="cw-admin-stat-copy">
        <span>{label}</span>
        <b>{value}</b>
      </div>
    </article>
  );
}
function formatTechnicalValue(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
