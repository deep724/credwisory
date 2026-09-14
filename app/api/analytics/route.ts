import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase, logDatabaseError } from "@/lib/mongodb";
import { ConsentRecord, PageView, VisitorSession } from "@/lib/models";
import { allowRequest } from "@/lib/api";

const analyticsEvent = z.object({
  event: z.enum(["consent", "pageview", "heartbeat"]),
  anonymousId: z.string().uuid(),
  path: z.string().startsWith("/").max(500),
  seconds: z.number().int().min(0).max(300).optional(),
  referrer: z.string().url().max(2048).optional(),
});

export async function POST(request: Request) {
  if (!allowRequest(request, 30)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = analyticsEvent.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
  const data = parsed.data;
  try {
    await connectToDatabase();
    if (data.event === "consent") {
      const now = new Date();
      const session = await VisitorSession.findOneAndUpdate({ anonymousId: data.anonymousId }, { $set: { analyticsOk: true, consentedAt: now, lastActiveAt: now }, $setOnInsert: { entryPage: data.path, referrer: data.referrer, firstSeenAt: now, durationSecs: 0 } }, { new: true, upsert: true });
      await ConsentRecord.create({ sessionId: session._id, analyticsOk: true, policyVersion: process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION || "current" });
    } else {
      const session = await VisitorSession.findOne({ anonymousId: data.anonymousId }).lean() as { _id: unknown; analyticsOk?: boolean } | null;
      if (!session?.analyticsOk) return NextResponse.json({ ok: true });
      await VisitorSession.updateOne({ _id: session._id }, { $set: { lastActiveAt: new Date(), exitPage: data.path }, $inc: { durationSecs: data.seconds || 0 } });
      if (data.event === "pageview") await PageView.create({ sessionId: session._id, path: data.path });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    logDatabaseError("analytics persistence failed", error);
    return NextResponse.json({ error: "Analytics unavailable" }, { status: 503 });
  }
}
