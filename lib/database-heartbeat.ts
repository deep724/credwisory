import { NextResponse } from "next/server";

type HeartbeatDependencies = {
  ping: () => Promise<void>;
  now?: () => Date;
  log?: Pick<Console, "info" | "error">;
};

const HEARTBEAT_TIMEOUT_MS = 5_000;

function isAuthorized(authorization: string | null, secret: string | undefined) {
  return Boolean(secret) && authorization === `Bearer ${secret}`;
}

function withTimeout(task: Promise<void>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    task,
    new Promise<void>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Database heartbeat timed out.")), timeoutMs);
    }),
  ]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

/** Creates the protected handler so its authorization and ping behavior can be tested without a live database. */
export function createDatabaseHeartbeatHandler({ ping, now = () => new Date(), log = console }: HeartbeatDependencies) {
  return async function GET(request: Request) {
    if (!isAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    try {
      await withTimeout(ping(), HEARTBEAT_TIMEOUT_MS);
      const timestamp = now().toISOString();
      log.info("[database-heartbeat] MongoDB ping succeeded");
      return NextResponse.json({ success: true, timestamp, database: "connected" });
    } catch {
      log.error("[database-heartbeat] MongoDB ping failed");
      return NextResponse.json({ success: false, timestamp: now().toISOString(), database: "unavailable" }, { status: 503 });
    }
  };
}
