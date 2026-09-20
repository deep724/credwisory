"use client";

import { useRouter } from "next/navigation";
import { deleteApplication } from "@/app/admin/actions";
import { AdminDeleteConfirmation } from "@/components/admin-delete-confirmation";

type Props = { id: string; name: string; lender: string };

export function ApplicationDeleteAction({ id, name, lender }: Props) {
  const router = useRouter();
  return <AdminDeleteConfirmation title="Delete application?" description={<>This permanently deletes the application for <b>{name}</b> with <b>{lender}</b>. The original lead will remain.</>} triggerLabel="Delete application" successMessage="Application deleted successfully." onSuccess={() => router.refresh()} onConfirm={async () => {
    const data = new FormData(); data.set("id", id); data.set("confirm", "DELETE");
    return deleteApplication(data);
  }} />;
}
