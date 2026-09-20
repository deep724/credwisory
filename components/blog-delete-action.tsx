"use client";

import { useRouter } from "next/navigation";
import { deleteBlog } from "@/app/admin/actions";
import { AdminDeleteConfirmation } from "@/components/admin-delete-confirmation";

export function BlogDeleteAction({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  return <AdminDeleteConfirmation title="Delete blog post?" description={<>This permanently deletes <b>{title}</b> and removes it from the public blog.</>} triggerLabel={`Delete ${title}`} successMessage="Blog post deleted successfully." onSuccess={() => router.refresh()} onConfirm={async () => {
    const data = new FormData(); data.set("id", id); data.set("confirm", "DELETE");
    return deleteBlog(data);
  }} />;
}
