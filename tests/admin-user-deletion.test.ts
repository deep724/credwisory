import assert from "node:assert/strict";
import test from "node:test";
import { authorizeAdminDeletion } from "../lib/admin-user-deletion";

test("Super Admin can delete a staff admin", () => {
  assert.deepEqual(authorizeAdminDeletion({ actorId: "super-1", actorRole: "SUPER_ADMIN", targetId: "staff-1", targetRole: "STAFF" }), { ok: true });
});

test("normal or staff admins cannot delete anyone", () => {
  for (const actorRole of [undefined, "STAFF"] as const) {
    assert.equal(authorizeAdminDeletion({ actorId: "user-1", actorRole, targetId: "staff-1", targetRole: "STAFF" }).status, 403);
  }
});

test("Super Admin cannot delete self or another Super Admin", () => {
  assert.equal(authorizeAdminDeletion({ actorId: "super-1", actorRole: "SUPER_ADMIN", targetId: "super-1", targetRole: "SUPER_ADMIN" }).status, 400);
  assert.equal(authorizeAdminDeletion({ actorId: "super-1", actorRole: "SUPER_ADMIN", targetId: "super-2", targetRole: "SUPER_ADMIN" }).status, 403);
});
