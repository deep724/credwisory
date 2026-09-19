import { AdminShell } from "@/components/admin-shell";
import { AdminIconSubmitButton } from "@/components/admin-icon-submit-button";
import { AdminUserCreateDialog } from "@/components/admin-user-create-dialog";
import { AdminUserDeleteAction } from "@/components/admin-user-delete-action";
import { updateAdminUser } from "@/app/admin/actions";
import { requireRole } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser } from "@/lib/models";

export default async function Users({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const admin = await requireRole("SUPER_ADMIN");
  const query = await searchParams;
  await connectToDatabase();
  const users = await AdminUser.find().select("name email roleId active mustChangePassword lastLoginAt createdAt").populate("roleId", "name key").lean();
  const role = admin.roleId as unknown as { name?: string } | null;
  const total = users.length;
  const superAdmins = users.filter((user) => (user.roleId as unknown as { key?: string } | null)?.key === "SUPER_ADMIN").length;
  const staffAdmins = total - superAdmins;
  const activeUsers = users.filter((user) => user.active).length;
  return <AdminShell name={admin.name} role={role?.name || "Super Admin"}>
    <div className="cw-admin-page-heading cw-admin-users-heading"><div><h1>Admin users</h1><p className="cw-admin-kicker">Manage trusted team access without exposing passwords or private account details.</p></div><AdminUserCreateDialog /></div>
    {query.notice === "admin-deleted" ? <p className="cw-admin-success" role="status">Admin account deleted successfully.</p> : null}
    <section className="cw-admin-grid cw-admin-users-stats" aria-label="Admin user summary"><Metric icon="users" label="Total admins" value={total} tone="teal" /><Metric icon="shield" label="Super admins" value={superAdmins} tone="navy" /><Metric icon="briefcase" label="Staff admins" value={staffAdmins} tone="amber" /><Metric icon="check" label="Active users" value={activeUsers} tone="green" /></section>
    <section className="cw-admin-panel cw-admin-users-panel"><div className="cw-admin-panel-head"><div><p className="cw-admin-eyebrow">Team access</p><h2>People with admin access</h2><p>Change a teammate’s access level or account status here. Your own Super Admin account is protected.</p></div></div><div className="cw-admin-table-wrap"><table className="cw-admin-users-table"><thead><tr><th>Account</th><th>Role / access</th><th>Status</th><th>Last active</th><th>Actions</th></tr></thead><tbody>
      {users.map((user) => {
        const assignedRole = user.roleId as unknown as { name?: string; key?: string } | null;
        const isSelf = String(user._id) === admin.id;
        const formId = `user-access-${String(user._id)}`;
        const status = !user.active ? "Suspended" : user.mustChangePassword ? "Invited" : "Active";
        return <tr key={String(user._id)} className={isSelf ? "cw-admin-user-row--protected" : undefined}>
          <td data-label="Account"><div className="cw-admin-user-account"><span className="cw-admin-avatar" aria-hidden="true">{initials(user.name)}</span><div className="cw-admin-user-identity"><div><strong>{user.name}</strong>{isSelf ? <span className="cw-admin-current-user">You</span> : null}</div><small>{user.email}</small></div></div></td>
          <td data-label="Role / access"><div className="cw-admin-access-field"><span className={`cw-admin-role-badge ${assignedRole?.key === "SUPER_ADMIN" ? "is-super" : "is-staff"}`}>{assignedRole?.name || "Staff Admin"}</span>{!isSelf ? <select name="role" form={formId} defaultValue={assignedRole?.key || "STAFF"} aria-label={`Role for ${user.name}`}><option value="STAFF">Staff Admin</option><option value="SUPER_ADMIN">Super Admin</option></select> : null}</div></td>
          <td data-label="Status"><div className="cw-admin-access-field"><span className={`cw-admin-user-status is-${status.toLowerCase()}`}>{status}</span>{!isSelf ? <select name="active" form={formId} defaultValue={user.active ? "true" : "false"} aria-label={`Account status for ${user.name}`}><option value="true">Active</option><option value="false">Suspended</option></select> : <small className="cw-admin-protected"><LockIcon />Protected account</small>}</div></td>
          <td data-label="Last active"><div className="cw-admin-last-active"><span className="cw-admin-date">{formatDate(user.lastLoginAt)}</span>{!user.lastLoginAt ? <small>Not yet signed in</small> : null}</div></td>
          <td data-label="Actions" className="cw-admin-icon-actions cw-admin-user-actions">{!isSelf ? <><form id={formId} action={updateAdminUser}><input type="hidden" name="id" value={String(user._id)} /><AdminIconSubmitButton className="cw-admin-icon-action is-edit" label={`Update access for ${user.name}`} tooltip="Update access" pendingLabel="Updating"><UpdateIcon /></AdminIconSubmitButton></form>{assignedRole?.key === "STAFF" ? <AdminUserDeleteAction id={String(user._id)} name={user.name} /> : null}</> : <span className="cw-admin-no-action" aria-label="Protected account" data-tooltip="Protected account"><LockIcon /></span>}</td>
        </tr>;
      })}
    </tbody></table></div></section>
  </AdminShell>;
}
function Metric({ icon, label, value, tone }: { icon: "users" | "shield" | "briefcase" | "check"; label: string; value: number; tone: string }) { return <article className={`cw-admin-stat cw-admin-user-stat is-${tone}`}><span className="cw-admin-stat-icon cw-admin-user-stat-icon"><MetricIcon name={icon} /></span><div><b>{value}</b><span>{label}</span></div></article>; }
function MetricIcon({ name }: { name: "users" | "shield" | "briefcase" | "check" }) { const paths = { users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 10 0v1M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5v1"/></>, shield: <><path d="M12 3 5 6v5c0 4.4 2.9 8.2 7 10 4.1-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m9.5 12 1.7 1.7 3.5-3.7"/></>, briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>, check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/></> }; return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>; }
function UpdateIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v6h-6"/><path d="m8 12 2.3 2.3L16 8.6"/></svg>; }
function LockIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AD"; }
function formatDate(value: Date | null | undefined) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Never"; }
