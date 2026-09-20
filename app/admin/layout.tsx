import "./admin.css";
import "./admin-polish.css";
import "./leads-polish.css";
import "./admin-modern.css";
import "./admin-fixes.css";
import "./dashboard-polish.css";
import "./icon-actions.css";
import "./content-management-polish.css";
import "./users-polish.css";
import "./admin-delete-confirmation.css";
import "./lender-editor-polish.css";
import "./applications-polish.css";
import "./student-profile-polish.css";
import "./leads-crm-polish.css";
import "./lead-status-control-polish.css";
import "./lead-detail-polish.css";
import "./admin-danger-polish.css";
import "./blog-editor-premium.css";
import "./blog-editor-image-manager.css";
import "./blog-editor-buttons.css";
import "./blog-editor-content-polish.css";
import "./submission-leads.css";
import "./referrals-polish.css";
import "./settings-polish.css";
import { AdminActionTooltips } from "@/components/admin-action-tooltips";
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}<AdminActionTooltips /></>;
}
