import "server-only";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const MAX_RESUME_LABEL = "5 MB";

const resumeTypes = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
]);

export function validateResumeFile(file: File) {
  if (!resumeTypes.has(file.type) || file.size < 1 || file.size > MAX_RESUME_BYTES)
    return { error: `Upload a PDF, DOC, or DOCX resume up to ${MAX_RESUME_LABEL}.` } as const;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== resumeTypes.get(file.type)) return { error: "The selected file does not match its declared type." } as const;
  return { extension } as const;
}

export function matchesResumeSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (contentType === "application/msword") return bytes.slice(0, 4).every((byte, index) => byte === [0xd0, 0xcf, 0x11, 0xe0][index]);
  return bytes.slice(0, 4).every((byte, index) => byte === [0x50, 0x4b, 0x03, 0x04][index]);
}

export async function storeResume(file: File, bytes: Uint8Array, extension: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Resume storage is not configured.");
  const blob = await put(`resumes/${randomUUID()}.${extension}`, Buffer.from(bytes), {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type,
  });
  return blob.url;
}
