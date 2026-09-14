import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

/** Daily, authenticated database heartbeat. Never exposes database internals. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    await mongoose.connection.db?.admin().ping();
    console.info("[heartbeat] MongoDB ping succeeded");
    return NextResponse.json({ ok: true, database: "connected" });
  } catch {
    console.error("[heartbeat] MongoDB ping failed");
    return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
