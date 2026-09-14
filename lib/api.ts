import { NextResponse } from "next/server";
import { z } from "zod";

const visitors = new Map<string, { count: number; expires: number }>();
export function allowRequest(request: Request, limit = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 8)): boolean {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || request.headers.get("x-real-ip") || "unknown";
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const now = Date.now(); const current = visitors.get(key);
  if (!current || current.expires < now) { visitors.set(key, { count: 1, expires: now + windowMs }); return true; }
  if (current.count >= limit) return false;
  current.count += 1; return true;
}

export const leadSchema = z.object({
  kind: z.enum(["ELIGIBILITY", "SCHOLARSHIP_ELIGIBILITY", "LENDER_ENQUIRY", "LOAN_WITH_COLLATERAL", "LOAN_WITHOUT_COLLATERAL", "CONTACT", "REFERRAL"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).optional(),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/).optional(),
  sourcePage: z.string().startsWith("/").max(500).optional(),
  anonymousId: z.string().uuid().optional(),
  website: z.string().max(0).optional(), // honeypot
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function parseLead(request: Request) {
  if (!allowRequest(request)) return { error: NextResponse.json({ error: "Please try again later." }, { status: 429 }) };
  const body: unknown = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return { error: NextResponse.json({ error: "Please check the submitted details." }, { status: 400 }) };
  if (parsed.data.website) return { error: NextResponse.json({ ok: true }, { status: 202 }) };
  return { data: parsed.data };
}
