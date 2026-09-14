import { NextResponse } from "next/server";
import { adminCookie } from "@/lib/admin-auth";
import { currentAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models";
export async function POST() { const admin = await currentAdmin(); if (admin) { await connectToDatabase(); await AuditLog.create({ actorId: admin._id, action: "admin.logout", entityType: "AdminUser", entityId: String(admin._id) }); } const response = NextResponse.json({ ok: true }); response.cookies.set(adminCookie.name, "", { ...adminCookie.options, maxAge: 0 }); return response; }
