import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAdmin } from "@/lib/admin-auth";
import { authorizeAdminDeletion } from "@/lib/admin-user-deletion";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser, AuditLog } from "@/lib/models";

export const runtime = "nodejs";

const id = z.string().regex(/^[a-f\d]{24}$/i);

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin();
  const actorRole = admin?.roleId as unknown as { key?: string } | null;
  const { id: targetId } = await params;
  if (!id.safeParse(targetId).success) {
    return NextResponse.json({ error: "Invalid admin account." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const target = await AdminUser.findById(targetId).populate("roleId", "key").exec();
    if (!target) return NextResponse.json({ error: "This admin account no longer exists." }, { status: 404 });

    const targetRole = target.roleId as unknown as { key?: string } | null;
    const authorization = authorizeAdminDeletion({
      actorId: admin?.id,
      actorRole: actorRole?.key as "SUPER_ADMIN" | "STAFF" | undefined,
      targetId,
      targetRole: targetRole?.key as "SUPER_ADMIN" | "STAFF" | undefined,
    });
    if (!authorization.ok) {
      console.warn("[admin-users] delete rejected", { reason: authorization.error, status: authorization.status });
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    await AdminUser.deleteOne({ _id: target._id });
    try {
      await AuditLog.create({ actorId: admin!._id, action: "admin_user.deleted", entityType: "AdminUser", entityId: targetId });
    } catch {
      console.error("[admin-users] audit log failed after admin deletion");
    }
    return NextResponse.json({ ok: true, id: targetId });
  } catch (error) {
    console.error("[admin-users] delete failed", { reason: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "We couldn't delete this admin account. Please try again." }, { status: 500 });
  }
}
