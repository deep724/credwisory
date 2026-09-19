export type AdminRole = "SUPER_ADMIN" | "STAFF" | undefined;

/** Authorization policy shared by the API route and its focused tests. */
export function authorizeAdminDeletion(input: {
  actorId?: string;
  actorRole: AdminRole;
  targetId: string;
  targetRole: AdminRole;
}) {
  if (!input.actorId || input.actorRole !== "SUPER_ADMIN") {
    return { error: "Only Super Admins can delete admin accounts.", status: 403 } as const;
  }
  if (input.actorId === input.targetId) {
    return { error: "You cannot delete your own admin account.", status: 400 } as const;
  }
  if (input.targetRole !== "STAFF") {
    return { error: "Only Staff Admin accounts can be deleted.", status: 403 } as const;
  }
  return { ok: true as const };
}
