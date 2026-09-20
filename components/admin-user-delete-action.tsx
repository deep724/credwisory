"use client";

import { useRouter } from "next/navigation";
import { AdminDeleteConfirmation } from "@/components/admin-delete-confirmation";

export function AdminUserDeleteAction({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return <AdminDeleteConfirmation title="Delete staff admin?" description={<>This permanently removes the Staff Admin account for <b>{name}</b>. Their current password is never shown or retained.</>} triggerLabel={`Delete Staff Admin ${name}`} successMessage="Staff Admin account deleted successfully." confirmationValues={["DELETE", name]} confirmationHint={<>Type <b>DELETE</b> or the account name to continue.</>} triggerClassName="cw-admin-user-delete cw-admin-icon-action is-delete" onSuccess={() => router.refresh()} onConfirm={async () => {
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation: "DELETE" }) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) return { error: typeof result?.error === "string" ? result.error : "We couldn't delete this admin account." };
    return { ok: true };
  }} />;
}
