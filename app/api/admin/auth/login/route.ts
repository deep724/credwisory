import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase, logDatabaseError } from "@/lib/mongodb";
import { AdminUser, AuditLog } from "@/lib/models";
import { adminCookie, createAdminToken } from "@/lib/admin-auth";
import { allowRequest } from "@/lib/api";

const schema = z.object({ email: z.string().email(), password: z.string().min(12).max(128) });
export async function POST(request: Request) {
  if (!allowRequest(request, 5)) return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  const data = schema.safeParse(await request.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  let user;
  try {
    await connectToDatabase();
    user = await AdminUser.findOne({ email: data.data.email.toLowerCase() }).populate("roleId").exec();
  } catch (error) {
    logDatabaseError("admin login lookup failed", error);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
  if (!user || !user.active || (user.lockedUntil && user.lockedUntil > new Date()) || !await bcrypt.compare(data.data.password, user.passwordHash)) {
    if (user) {
      const failedLogins = user.failedLogins + 1;
      await AdminUser.updateOne({ _id: user._id }, { $set: { failedLogins, lockedUntil: failedLogins >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null } });
    }
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const role = user.roleId as unknown as { key?: string } | null;
  if (!role?.key) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  const token = await createAdminToken({ id: user.id, roleKey: role.key });
  await AdminUser.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lastLoginAt: new Date(), lockedUntil: null } });
  await AuditLog.create({ actorId: user._id, action: "admin.login", entityType: "AdminUser", entityId: String(user._id) });
  const response = NextResponse.json({ ok: true, passwordChangeRequired: Boolean(user.mustChangePassword) }); response.cookies.set(adminCookie.name, token, adminCookie.options); return response;
}
