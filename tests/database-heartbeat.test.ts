import assert from "node:assert/strict";
import test from "node:test";
import { createDatabaseHeartbeatHandler } from "../lib/database-heartbeat";

const originalSecret = process.env.CRON_SECRET;

test.after(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

test("rejects an unauthenticated database heartbeat request", async () => {
  process.env.CRON_SECRET = "test-heartbeat-secret";
  let pinged = false;
  const GET = createDatabaseHeartbeatHandler({ ping: async () => { pinged = true; } });

  const response = await GET(new Request("https://example.test/api/internal/database-heartbeat"));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { success: false });
  assert.equal(pinged, false);
});

test("authorizes a heartbeat request and returns a safe ping result", async () => {
  process.env.CRON_SECRET = "test-heartbeat-secret";
  let pinged = false;
  const GET = createDatabaseHeartbeatHandler({
    ping: async () => { pinged = true; },
    now: () => new Date("2026-09-21T00:00:00.000Z"),
    log: { info: () => undefined, error: () => undefined },
  });

  const response = await GET(new Request("https://example.test/api/internal/database-heartbeat", { headers: { authorization: "Bearer test-heartbeat-secret" } }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, timestamp: "2026-09-21T00:00:00.000Z", database: "connected" });
  assert.equal(pinged, true);
});
