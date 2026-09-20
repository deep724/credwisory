import { AdminShell } from "@/components/admin-shell";
import { GoogleReviewSettingsManager } from "@/components/google-review-settings-manager";
import { requireRole } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSetting } from "@/lib/models";

export default async function SettingsPage() {
  const admin = await requireRole("SUPER_ADMIN");
  await connectToDatabase();
  const [profileSetting, linkSetting] = await Promise.all([
    SiteSetting.findOne({ key: "googleBusinessProfileUrl" }).select("value").lean(),
    SiteSetting.findOne({ key: "googleReviewLink" }).select("value").lean(),
  ]) as [{ value?: string } | null, { value?: string } | null];
  const role = admin.roleId as unknown as { name?: string } | null;
  return <AdminShell name={admin.name} role={role?.name || "Super Admin"}><div className="cw-admin-page-heading"><div><h1>Settings</h1><p className="cw-admin-kicker">Manage secure public-site settings.</p></div></div><GoogleReviewSettingsManager initialProfileUrl={profileSetting?.value || ""} initialReviewLink={linkSetting?.value || ""} /></AdminShell>;
}
