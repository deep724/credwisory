import mongoose from "mongoose";
import { createDatabaseHeartbeatHandler } from "@/lib/database-heartbeat";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export const GET = createDatabaseHeartbeatHandler({
  ping: async () => {
    await connectToDatabase();
    const database = mongoose.connection.db;
    if (!database) throw new Error("Database connection is unavailable.");
    await database.admin().command({ ping: 1, maxTimeMS: 5_000 });
  },
});
