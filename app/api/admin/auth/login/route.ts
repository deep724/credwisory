import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase, logDatabaseError } from "@/lib/mongodb";
import { AdminUser, AuditLog } from "@/lib/models";
import { adminCookie, adminCookieOptions, createAdminToken } from "@/lib/admin-auth";
import { allowRequest } from "@/lib/api";
import { adminJwtSecretStatus } from "@/lib/runtime-config";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), password: z.string().min(12).max(128) });

/**
 * Authentication diagnostics deliberately contain only branch names and
 * deployment metadata. Do not add request bodies, emails, hashes, tokens, or
 * environment-variable values here.
 */
function logAuth(event: string, details: Record<string, string | boolean | number> = {}) {
  console.info("[admin-auth]", event, details);
}

export async function POST(request: Request) {
  if (!allowRequest(request, 5)) {
    logAuth("login_rejected", { reason: "rate_limited" });
    return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }
  const data = schema.safeParse(await request.json().catch(() => null));
  if (!data.success) {
    logAuth("login_rejected", { reason: "invalid_request" });
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }
  let user;
  try {
    await connectToDatabase();
    user = await AdminUser.findOne({ email: data.data.email.toLowerCase() }).populate("roleId").exec();
  } catch (error) {
    logDatabaseError("admin login lookup failed", error);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
  if (!user) {
    logAuth("login_rejected", { reason: "user_not_found" });
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  if (!user.active) {
    logAuth("login_rejected", { reason: "inactive_user" });
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    logAuth("login_rejected", { reason: "locked_user" });
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  let passwordMatches: boolean;
  try {
    passwordMatches = await bcrypt.compare(data.data.password, user.passwordHash);
  } catch {
    logAuth("login_failed", { reason: "password_compare_error", bcrypt: "bcryptjs" });
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
  if (!passwordMatches) {
    logAuth("login_rejected", { reason: "password_mismatch" });
    if (user) {
      const failedLogins = user.failedLogins + 1;
      await AdminUser.updateOne({ _id: user._id }, { $set: { failedLogins, lockedUntil: failedLogins >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null } });
    }
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const role = user.roleId as unknown as { key?: string } | null;
  if (!role?.key) {
    logAuth("login_rejected", { reason: "missing_role" });
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  let token: string;
  try {
    token = await createAdminToken({ id: user.id, roleKey: role.key });
  } catch {
    logAuth("login_failed", {
      reason: "token_creation_error",
      nodeEnv: process.env.NODE_ENV ?? "unset",
      adminJwtSecretStatus: adminJwtSecretStatus(),
    });
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
  await AdminUser.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lastLoginAt: new Date(), lockedUntil: null } });
  await AuditLog.create({ actorId: user._id, action: "admin.login", entityType: "AdminUser", entityId: String(user._id) });
  const cookieOptions = adminCookieOptions(request);
  logAuth("login_succeeded", {
    cookieSecure: cookieOptions.secure,
    cookieSameSite: cookieOptions.sameSite,
    forwardedProto: request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "absent",
  });
  const response = NextResponse.json({ ok: true, passwordChangeRequired: Boolean(user.mustChangePassword) }); response.cookies.set(adminCookie.name, token, cookieOptions); return response;
}
