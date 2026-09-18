import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });

const lenders = [
  ["Union Bank of India", "BANK", "Up to ₹1.5 crore", "Up to ₹40L", "8.1–9.75%", "6.95–10.2%", "10–15 years", "₹5K"],
  ["Axis Bank", "BANK", "Up to ₹2 crore", "Up to ₹2Cr", "8%–11.75%", "9.75–12.5%", "10–15 years", "0.5% to 1.0%"],
  ["ICICI Bank", "BANK", "Up to ₹3 crore", "Up to ₹3 crore", "9–12.5%", "9–12.75%", "10–15 years", "0.5% to 1.0%"],
  ["IDFC Bank", "BANK", "Up to ₹1 crore", "Up to ₹1 crore", "9.5–11.5%", "10.25–13.25%", "10–15 years", "0.5% to 1.0%"],
  ["Punjab National Bank", "BANK", "Up to ₹2 crore", "Up to ₹8L", "6.9–10.45%", "6.95–10.2%", "10–15 years", "0.5% onwards"],
  ["Bank of Baroda", "BANK", "Up to ₹4 crore", "Not available", "6.9–10.45%", "Not available", "10–15 years", "₹10,000 + GST"],
  ["State Bank of India", "BANK", "Up to ₹4 crore", "Up to ₹50L", "8.9–9.4%", "0.094", "10–15 years", "₹11,800 + GST"],
  ["Credila", "NBFC", "Up to ₹4 crore", "Up to ₹4 crore", "9.5–11.5%", "8.95–13%", "Up to 15 years", "0.5% to 1.0%"],
  ["Avanse", "NBFC", "Up to ₹1 crore", "Up to ₹2 crore", "10.5–14%", "10–14%", "Up to 15 years", "0.5% to 1.0%"],
  ["InCred", "NBFC", "Not available", "Up to ₹1 crore", "Not available", "10.5–14%", "Up to 15 years", "0.6% to 1.0%"],
  ["Auxilo", "NBFC", "Up to ₹50L", "Up to ₹1.2 crore", "11.5–12%", "10.25–13.5%", "Up to 15 years", "0.5% onwards"],
  ["Edgro", "NBFC", "Not available", "Up to ₹1 crore", "Not available", "11.5–16%", "Up to 15 years", "1.0% onwards"],
  ["Poonawalla", "NBFC", "Up to ₹3 crore", "Up to ₹1 crore", "10.5–12.5%", "11–14%", "Up to 15 years", "0.75% onwards"],
] as const;

function mongoUriFromEnvironment() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI must be configured before seeding.");
  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  let parsed: URL;
  try { parsed = new URL(uri); } catch { throw new Error("MONGODB_URI is not a valid MongoDB connection string."); }
  const databaseName = decodeURIComponent(parsed.pathname).replace(/^\/+/, "").split("/")[0];
  if (databaseName !== "crd") throw new Error("MONGODB_URI must include the crd database name after the host.");
  if (parsed.hostname === "cluster.mongodb.net") throw new Error("MONGODB_URI must use your real MongoDB Atlas cluster host.");
  return uri;
}

function redactSecrets(value: string) {
  return value
    .replace(/mongodb(?:\+srv)?:\/\/[^\s'"`]+/gi, "mongodb://[REDACTED]")
    .replace(/(password|pwd|secret|token)=([^&\s]+)/gi, "$1=[REDACTED]");
}

function reportSeedFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown MongoDB seed error.";
  console.error(`MongoDB seed failed: ${redactSecrets(message)}`);
  if (process.env.NODE_ENV !== "production" && error instanceof Error && error.stack) {
    console.error(redactSecrets(error.stack));
  }
}

async function main() {
  let connected = false;
  try {
    const uri = mongoUriFromEnvironment();
  await mongoose.connect(uri);
    connected = true;
  // Standalone schemas keep this CLI independent of Next.js's server-only guard.
  const Role = mongoose.models.Role || mongoose.model("Role", new mongoose.Schema({ key: { type: String, unique: true, required: true }, name: { type: String, required: true } }, { timestamps: true }));
  const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", new mongoose.Schema({ name: String, email: { type: String, unique: true, lowercase: true }, passwordHash: String, roleId: mongoose.Schema.Types.ObjectId, active: Boolean }, { timestamps: true }));
  const Lender = mongoose.models.Lender || mongoose.model("Lender", new mongoose.Schema({ name: String, slug: { type: String, unique: true }, lenderType: { type: String, enum: ["BANK", "NBFC", "INTERNATIONAL", "OTHER"] }, displayOrder: Number, published: Boolean, comparison: mongoose.Schema.Types.Mixed }, { timestamps: true }));
  const role = await Role.findOneAndUpdate({ key: "SUPER_ADMIN" }, { $setOnInsert: { name: "Super Admin" } }, { upsert: true, new: true });
  await Role.findOneAndUpdate({ key: "STAFF" }, { $setOnInsert: { name: "Staff" } }, { upsert: true, new: true });
  const email = process.env.ADMIN_SEED_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (email && password) await AdminUser.findOneAndUpdate({ email }, { $setOnInsert: { name: "Administrator", passwordHash: await bcrypt.hash(password, 12), roleId: role._id, active: true } }, { upsert: true, new: true });
  for (const [displayOrder, [name, lenderType, secured, unsecured, securedRate, unsecuredRate, tenure, fee]] of lenders.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const legacySlugs = slug === "idfc-bank" ? ["idfc-first-bank", slug] : slug === "credila" ? ["hdfc-credila", slug] : [slug];
    const existingSlug = { $in: legacySlugs };
    await Lender.findOneAndUpdate({ slug: existingSlug }, { $set: { name, slug, lenderType, displayOrder, published: true, comparison: { secured, unsecured, securedRate, unsecuredRate, moratorium: "Course duration + 1 year", tenure, foreclosure: "NIL", fee } } }, { upsert: true });
  }
  } catch (error) {
    reportSeedFailure(error);
    process.exitCode = 1;
  } finally {
    if (connected) await mongoose.disconnect();
  }
}

void main();
