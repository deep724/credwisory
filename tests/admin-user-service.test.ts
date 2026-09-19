import assert from "node:assert/strict";
import test from "node:test";
import { adminUserInput, persistAdminUser } from "../lib/admin-user-service";

const input = { name: "New Staff", email: "NEW.STAFF@example.com", password: "temporary-password-123", role: "STAFF" as const };

test("persists an active staff admin with a forced first-login password change", async () => {
  let created: Record<string, unknown> | undefined;
  const result = await persistAdminUser(adminUserInput.parse(input), "hashed-password", {
    ensureRole: async (key) => ({ _id: `${key}-role` }),
    emailExists: async () => false,
    create: async (user) => { created = user; return { _id: "admin-1" }; },
  });

  assert.deepEqual(result, { ok: true, id: "admin-1" });
  assert.deepEqual(created, {
    name: "New Staff",
    email: "new.staff@example.com",
    passwordHash: "hashed-password",
    roleId: "STAFF-role",
    active: true,
    mustChangePassword: true,
  });
});

test("rejects duplicate admin email addresses without creating a record", async () => {
  let created = false;
  const result = await persistAdminUser(adminUserInput.parse(input), "hashed-password", {
    ensureRole: async () => ({ _id: "staff-role" }),
    emailExists: async () => true,
    create: async () => { created = true; return { _id: "unexpected" }; },
  });

  assert.deepEqual(result, { error: "An admin user with this email already exists." });
  assert.equal(created, false);
});

test("rejects invalid admin role and too-short passwords before persistence", () => {
  assert.equal(adminUserInput.safeParse({ ...input, role: "OWNER" }).success, false);
  assert.equal(adminUserInput.safeParse({ ...input, password: "too-short" }).success, false);
});
