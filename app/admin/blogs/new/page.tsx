import { AdminShell } from "@/components/admin-shell";
import { BlogEditor } from "@/components/blog-editor";
import { requireAdmin } from "@/lib/admin-auth";
export default async function NewBlog() {
  const admin = await requireAdmin();
  const role = admin.roleId as unknown as { name?: string } | null;
  return (
    <AdminShell name={admin.name} role={role?.name || "Admin"}>
      <BlogEditor />
    </AdminShell>
  );
}
