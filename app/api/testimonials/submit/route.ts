import sanitizeHtml from "sanitize-html";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { Testimonial } from "@/lib/models";

const submission = z.object({
  displayName: z.string().trim().min(2).max(120), contact: z.string().trim().min(5).max(254), university: z.string().trim().min(2).max(180), studyCountry: z.string().trim().min(2).max(100), course: z.string().trim().max(180).optional(), rating: z.coerce.number().int().min(1).max(5), text: z.string().trim().min(12).max(3000), photoUrl: z.string().trim().max(1000).optional(), videoUrl: z.string().trim().max(1000).optional(), consent: z.literal(true), website: z.string().max(0).optional(),
});
function safeHttps(value?: string) { if (!value) return ""; if (/^\/uploads\/testimonials\/[a-f\d-]+\.(?:jpg|png|webp)$/i.test(value)) return value; try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }
export async function POST(request: Request) {
  if (!allowRequest(request, 4)) return NextResponse.json({ error: "Please try again later." }, { status: 429 });
  const parsed = submission.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 202 });
  const photoUrl = safeHttps(parsed.data.photoUrl), videoUrl = safeHttps(parsed.data.videoUrl);
  if (photoUrl === null || videoUrl === null) return NextResponse.json({ error: "Photo and video links must use HTTPS." }, { status: 400 });
  await connectToDatabase();
  await Testimonial.create({ ...parsed.data, contact: parsed.data.contact, text: sanitizeHtml(parsed.data.text, { allowedTags: [], allowedAttributes: {} }).trim(), photoUrl: photoUrl || undefined, videoUrl: videoUrl || undefined, consentConfirmed: true, status: "PENDING_REVIEW" });
  return NextResponse.json({ ok: true }, { status: 201 });
}
