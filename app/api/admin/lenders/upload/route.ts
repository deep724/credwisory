import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function POST(request: Request) {
  await requireAdmin();
  const file = (await request.formData()).get("image");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Upload a JPG, PNG, or WebP logo up to 5 MB." }, { status: 400 });
  const folder = path.join(process.cwd(), "public", "uploads", "lenders");
  await mkdir(folder, { recursive: true });
  const filename = `${randomUUID()}.${allowed.get(file.type)}`;
  await writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/lenders/${filename}` }, { status: 201 });
}
