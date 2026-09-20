import { NextResponse } from "next/server";
import { apiAdminRole } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models";
export async function GET(){const access=await apiAdminRole("SUPER_ADMIN");if("error" in access)return NextResponse.json({error:access.error},{status:access.status});await connectToDatabase();const logs=await AuditLog.find().sort({createdAt:-1}).limit(200).select("actorId action entityType entityId createdAt").lean();return NextResponse.json({logs});}
