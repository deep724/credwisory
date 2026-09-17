import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin-auth";
import { BLOG_IMAGE_MAX_BYTES, BLOG_IMAGE_MAX_LABEL } from "@/lib/blog-images";

const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function matchesImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(request: Request) {
  await requireAdmin();
  const data = await request.formData();
  const file = data.get("image");
  if (
    !(file instanceof File) ||
    !allowed.has(file.type) ||
    file.size > BLOG_IMAGE_MAX_BYTES
  )
    return NextResponse.json(
      { error: `Upload a JPG, PNG, or WebP image up to ${BLOG_IMAGE_MAX_LABEL}.` },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type))
    return NextResponse.json({ error: "The uploaded file does not match its image type." }, { status: 400 });
  const filename = `${randomUUID()}.${allowed.get(file.type)}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`blog/${filename}`, Buffer.from(bytes), { access: "public", contentType: file.type, addRandomSuffix: false });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  }
  if (process.env.VERCEL)
    return NextResponse.json({ error: "Blog image storage is not configured. Connect Vercel Blob and add BLOB_READ_WRITE_TOKEN." }, { status: 503 });
  const folder = path.join(process.cwd(), "public", "uploads", "blog");
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, filename), bytes);
  return NextResponse.json(
    { url: `/uploads/blog/${filename}` },
    { status: 201 },
  );
}
