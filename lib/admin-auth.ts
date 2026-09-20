import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser } from "@/lib/models";
import { adminJwtSecretStatus } from "@/lib/runtime-config";

const cookieName = "cw_admin";
function secret() {
  const value = process.env.ADMIN_JWT_SECRET;
  const status = adminJwtSecretStatus();
  if (process.env.NODE_ENV === "production" && status !== "configured") {
    throw new Error(`ADMIN_JWT_SECRET is ${status} in production.`);
  }
  return new TextEncoder().encode(value || "local-development-secret-not-for-production");
}

export async function createAdminToken(user: { id: string; roleKey: string }) {
  return new SignJWT({ role: user.roleKey }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("8h").sign(secret());
}
export const currentAdmin = cache(async function currentAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    await connectToDatabase();
    return AdminUser.findOne({ _id: payload.sub, active: true }).populate("roleId").exec();
  } catch { return null; }
});
export async function requireAdmin(options?: { allowPasswordChange?: boolean }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !options?.allowPasswordChange) redirect("/admin/change-password");
  return admin;
}
export async function requireRole(...allowed: string[]) {
  const admin = await requireAdmin();
  const role = admin.roleId as unknown as { key?: string } | null;
  if (!role?.key || !allowed.includes(role.key)) redirect("/admin");
  return admin;
}
/** API routes use explicit HTTP authorization responses instead of redirects. */
export async function apiAdminRole(...allowed: string[]) {
  const admin = await currentAdmin();
  if (!admin) return { error: "Authentication is required.", status: 401 } as const;
  const role = admin.roleId as unknown as { key?: string } | null;
  if (!role?.key || !allowed.includes(role.key)) return { error: "You do not have permission to access this resource.", status: 403 } as const;
  return { admin } as const;
}
export const adminCookie = { name: cookieName, options: { httpOnly: true, sameSite: "lax" as const, secure: false, path: "/", maxAge: 60 * 60 * 8 } };

/**
 * Production deployments must always use HTTPS. Vercel terminates TLS before
 * invoking the function, so trusting only a proxy header could accidentally
 * issue a non-Secure authentication cookie when that header is unavailable.
 * Local HTTP development keeps working because NODE_ENV is development.
 */
export function adminCookieOptions(request: Request) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isHttps = forwardedProtocol === "https" || new URL(request.url).protocol === "https:";
  return {
    ...adminCookie.options,
    secure: process.env.NODE_ENV === "production" || process.env.ADMIN_COOKIE_SECURE === "true" || isHttps,
  };
}
