import { NextResponse } from "next/server";
import { allowRequest } from "@/lib/api";
import { matchesResumeSignature, storeResume, validateResumeFile } from "@/lib/contact-submissions";
import { connectToDatabase, logDatabaseError } from "@/lib/mongodb";
import { ResumeLead } from "@/lib/models";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const cleanName = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();

const input = z.object({
  name: z.string().trim().min(2).max(120).transform(cleanName).pipe(z.string().min(2).max(120)),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  if (!allowRequest(request)) return NextResponse.json({ error: "Please try again later." }, { status: 429 });
  const data = await request.formData();
  const parsed = input.safeParse(Object.fromEntries(data));
  const file = data.get("resume");
  if (!parsed.success || !(file instanceof File)) return NextResponse.json({ error: "Please check your details and attach a resume." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 202 });
  const validation = validateResumeFile(file);
  if ("error" in validation) return NextResponse.json({ error: validation.error }, { status: 400 });
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesResumeSignature(bytes, file.type)) return NextResponse.json({ error: "The uploaded file does not match its file type." }, { status: 400 });
    const blobUrl = await storeResume(file, bytes, validation.extension!);
    await connectToDatabase();
    const lead = await ResumeLead.create({ ...parsed.data, resumeFileName: file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180), blobUrl, contentType: file.type, size: file.size });
    return NextResponse.json({ ok: true, id: String(lead._id) }, { status: 201 });
  } catch (error) {
    logDatabaseError("resume lead persistence failed", error);
    return NextResponse.json({ error: "We could not submit your resume right now. Please try again." }, { status: 503 });
  }
}
