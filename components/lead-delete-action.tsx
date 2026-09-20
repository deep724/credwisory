"use client";

import { useRouter } from "next/navigation";
import { deleteClosedLead } from "@/app/admin/actions";
import { AdminDeleteConfirmation } from "@/components/admin-delete-confirmation";

type Props = { id: string; name: string; identifier: string; type: string };

export function LeadDeleteAction({ id, name, type }: Props) {
  const router = useRouter();
  return <AdminDeleteConfirmation title="Delete lead?" description={<>This permanently deletes the closed <b>{type}</b> lead for <b>{name}</b>. Associated notes and activity will also be removed.</>} triggerLabel={`Delete lead for ${name}`} successMessage="Lead deleted successfully." onSuccess={() => router.refresh()} onConfirm={async () => {
    const data = new FormData(); data.set("id", id); data.set("confirm", "DELETE");
    return deleteClosedLead(data);
  }} />;
}
