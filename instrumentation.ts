import { runtimeConfigIssues } from "./lib/runtime-config";

/** Runs once for each new server instance before it accepts requests. */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const issues = runtimeConfigIssues();
  if (issues.length) {
    console.error("[startup] server configuration invalid", {
      environment: process.env.NODE_ENV ?? "unset",
      issues,
    });
    return;
  }

  console.info("[startup] server configuration validated", {
    environment: process.env.NODE_ENV ?? "unset",
    mongoConfigured: Boolean(process.env.MONGODB_URI),
    adminJwtConfigured: true,
  });
}
