import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ResumeLead } from "@/lib/models";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  await connectToDatabase();
  const lead = await ResumeLead.findById(id).lean() as { blobUrl?: string; resumeFileName?: string; contentType?: string } | null;
  if (!lead?.blobUrl || !lead.resumeFileName || !lead.contentType) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  try {
    const result = await get(lead.blobUrl, { access: "private", useCache: false });
    if (!result) return NextResponse.json({ error: "Resume file is unavailable." }, { status: 404 });
    const safeName = lead.resumeFileName.replace(/[\\"\r\n]/g, "_");
    return new Response(result.stream, { headers: { "Content-Type": lead.contentType, "Content-Disposition": `attachment; filename="${safeName}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Resume file is unavailable." }, { status: 404 });
  }
}
