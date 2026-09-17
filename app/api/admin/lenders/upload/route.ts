import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin-auth";
import { LENDER_LOGO_MAX_BYTES, LENDER_LOGO_MAX_LABEL } from "@/lib/lender-images";

const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
function matchesImageSignature(bytes: Uint8Array, type: string) { if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff; if (type === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]); return type === "image/webp" && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"; }

export async function POST(request: Request) {
  await requireAdmin();
  const file = (await request.formData()).get("image");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > LENDER_LOGO_MAX_BYTES)
    return NextResponse.json({ error: `Upload a JPG, PNG, or WebP logo up to ${LENDER_LOGO_MAX_LABEL}. SVG files are not accepted because they require separate sanitization.` }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type)) return NextResponse.json({ error: "The uploaded file does not match its image type." }, { status: 400 });
  const filename = `${randomUUID()}.${allowed.get(file.type)}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) { const blob = await put(`lenders/${filename}`, Buffer.from(bytes), { access: "public", contentType: file.type, addRandomSuffix: false }); return NextResponse.json({ url: blob.url }, { status: 201 }); }
  if (process.env.VERCEL) return NextResponse.json({ error: "Logo storage is not configured. Connect Vercel Blob and add BLOB_READ_WRITE_TOKEN." }, { status: 503 });
  const folder = path.join(process.cwd(), "public", "uploads", "lenders");
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, filename), bytes);
  return NextResponse.json({ url: `/uploads/lenders/${filename}` }, { status: 201 });
}
