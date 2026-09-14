import "dotenv/config";
import mongoose from "mongoose";

const normalizeEmail = (value?: string) => value?.trim().toLowerCase() || "";
const normalizePhone = (value?: string) => value?.replace(/\D/g, "").slice(-10) || "";

async function run() {
  const uri = process.env.MONGODB_URI; if (!uri) throw new Error("MONGODB_URI is required."); await mongoose.connect(uri);
  const Lead = mongoose.models.Lead || mongoose.model("Lead", new mongoose.Schema({ name: String, email: String, phone: String, studentProfileId: mongoose.Schema.Types.ObjectId, deletedAt: Date, createdAt: Date }, { strict: false }));
  const StudentProfile = mongoose.models.StudentProfile || mongoose.model("StudentProfile", new mongoose.Schema({ name: String, emails: [String], phones: [String], enquiryCount: Number, reviewRequired: Boolean, possibleDuplicateProfileIds: [mongoose.Schema.Types.ObjectId], mergedIntoId: mongoose.Schema.Types.ObjectId, mergedAt: Date }, { timestamps: true }));
  const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", new mongoose.Schema({ action: String, entityType: String, entityId: String, metadata: mongoose.Schema.Types.Mixed }, { timestamps: true }));
  let processed = 0;
  while (true) {
    const leads = await Lead.find({ studentProfileId: null, deletedAt: null }).sort({ createdAt: 1 }).limit(100); if (!leads.length) break;
    for (const lead of leads) { const email = normalizeEmail(lead.email); const phone = normalizePhone(lead.phone); const identifiers: Array<Record<string, string>> = []; if (email) identifiers.push({ emails: email }); if (phone) identifiers.push({ phones: phone }); const matches = identifiers.length ? await StudentProfile.find({ $or: identifiers, mergedIntoId: null }).limit(3) : []; let profile; if (matches.length === 1) { profile = matches[0]; await StudentProfile.updateOne({ _id: profile._id }, { $addToSet: { ...(email ? { emails: email } : {}), ...(phone ? { phones: phone } : {}) }, $inc: { enquiryCount: 1 } }); } else { profile = await StudentProfile.create({ name: lead.name, emails: email ? [email] : [], phones: phone ? [phone] : [], enquiryCount: 1, reviewRequired: matches.length > 1, possibleDuplicateProfileIds: matches.map((match) => match._id) }); } await Lead.updateOne({ _id: lead._id }, { $set: { studentProfileId: profile._id } }); await AuditLog.create({ action: "student_profile.backfill_linked", entityType: "StudentProfile", entityId: String(profile._id), metadata: { leadId: String(lead._id) } }); processed += 1; }
  }
  console.log(`Student profile backfill completed: ${processed} lead(s) linked.`); await mongoose.disconnect();
}
run().catch((error) => { console.error("Student profile backfill failed", error); process.exitCode = 1; });
