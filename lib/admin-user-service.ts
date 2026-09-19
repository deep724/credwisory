import { z } from "zod";

export const adminUserInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  role: z.enum(["SUPER_ADMIN", "STAFF"]),
});

export type AdminRoleKey = z.infer<typeof adminUserInput>["role"];
type StoredAdmin = { _id: unknown };
type StoredRole = { _id: unknown };

export async function persistAdminUser(
  input: z.infer<typeof adminUserInput>,
  passwordHash: string,
  database: {
    ensureRole: (key: AdminRoleKey) => Promise<StoredRole | null>;
    emailExists: (email: string) => Promise<boolean>;
    create: (user: { name: string; email: string; passwordHash: string; roleId: unknown; active: boolean; mustChangePassword: boolean }) => Promise<StoredAdmin>;
  },
) {
  const role = await database.ensureRole(input.role);
  if (!role) return { error: "The selected admin role is unavailable. Please try again." } as const;
  if (await database.emailExists(input.email)) return { error: "An admin user with this email already exists." } as const;

  const user = await database.create({
    name: input.name,
    email: input.email,
    passwordHash,
    roleId: role._id,
    active: true,
    mustChangePassword: true,
  });
  return { ok: true as const, id: String(user._id) };
}
