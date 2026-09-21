import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { apiAdminRole } from "@/lib/admin-auth";

const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const maxBytes = 3 * 1024 * 1024;

function matchesImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  return type === "image/webp" && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
}

export async function POST(request: Request) {
  const access = await apiAdminRole("SUPER_ADMIN");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const file = (await request.formData()).get("image");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > maxBytes) return NextResponse.json({ error: "Choose a JPG, PNG, or WebP photo up to 3 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type)) return NextResponse.json({ error: "The photo file could not be verified." }, { status: 400 });
  const filename = `${randomUUID()}.${allowed.get(file.type)}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`testimonials/${filename}`, Buffer.from(bytes), { access: "public", contentType: file.type, addRandomSuffix: false });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  }
  if (process.env.VERCEL) return NextResponse.json({ error: "Photo uploads are not configured for this site." }, { status: 503 });
  const folder = path.join(process.cwd(), "public", "uploads", "testimonials");
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, filename), bytes);
  return NextResponse.json({ url: `/uploads/testimonials/${filename}` }, { status: 201 });
}
