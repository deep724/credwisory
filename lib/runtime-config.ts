/**
 * Server-only configuration validation. Values are never returned or logged;
 * callers receive only variable names and non-sensitive status labels.
 */
export type AdminJwtSecretStatus = "configured" | "missing" | "too_short";

export function adminJwtSecretStatus(): AdminJwtSecretStatus {
  const value = process.env.ADMIN_JWT_SECRET;
  if (!value) return "missing";
  return new TextEncoder().encode(value).byteLength >= 32 ? "configured" : "too_short";
}

export function runtimeConfigIssues(): string[] {
  if (process.env.NODE_ENV !== "production") return [];

  const issues: string[] = [];
  if (!process.env.MONGODB_URI) issues.push("MONGODB_URI:missing");

  const jwtStatus = adminJwtSecretStatus();
  if (jwtStatus !== "configured") issues.push(`ADMIN_JWT_SECRET:${jwtStatus}`);

  // vercel.json enables this route. Keep its authorization secret independent
  // from admin authentication even though it does not affect sign-in.
  if (!process.env.CRON_SECRET) issues.push("CRON_SECRET:missing");
  return issues;
}

