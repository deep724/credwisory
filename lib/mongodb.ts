import "server-only";
import mongoose from "mongoose";

type MongoCache = { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongo = globalThis as typeof globalThis & { mongo?: MongoCache };
const cache = globalForMongo.mongo ?? { connection: null, promise: null };
if (process.env.NODE_ENV !== "production") globalForMongo.mongo = cache;

function configuredMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI must be configured on the server.");

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("MONGODB_URI must be a valid MongoDB connection string.");
  }
  if (parsed.protocol !== "mongodb:" && parsed.protocol !== "mongodb+srv:") {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  }
  if (parsed.hostname === "cluster.mongodb.net") {
    throw new Error("MONGODB_URI must use your real MongoDB Atlas cluster host.");
  }
  const databaseName = decodeURIComponent(parsed.pathname).split("/").filter(Boolean)[0];
  if (databaseName !== "crd") {
    throw new Error("MONGODB_URI must select the crd database.");
  }
  return uri;
}

function redactSecrets(value: string) {
  return value
    .replace(/mongodb(?:\+srv)?:\/\/[^\s'"`]+/gi, "mongodb://[REDACTED]")
    .replace(/(password|pwd|secret|token)=([^&\s]+)/gi, "$1=[REDACTED]");
}

/** Logs diagnostics without connection strings, credentials, or other secrets. */
export function logDatabaseError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown database error";
  console.error(`[database] ${context}: ${redactSecrets(message)}`);
}

/** Reuses one Mongoose connection across Next.js route handlers and development reloads. */
export async function connectToDatabase() {
  if (cache.connection) return cache.connection;
  const uri = configuredMongoUri();
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10_000 });
  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    // Permit a later request to retry after a transient Atlas/DNS outage.
    cache.promise = null;
    throw error;
  }
}
