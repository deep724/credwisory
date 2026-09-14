import "server-only";
import { Lead, StudentProfile } from "@/lib/models";

export const normalizeEmail = (value?: string) => value?.trim().toLowerCase() || "";
export const normalizePhone = (value?: string) => value?.replace(/\D/g, "").slice(-10) || "";

export async function attachLeadToStudentProfile(lead: { _id: unknown; name: string; email?: string; phone?: string }) {
  const email = normalizeEmail(lead.email); const phone = normalizePhone(lead.phone); const identifiers: Array<Record<string, string>> = [];
  if (email) identifiers.push({ emails: email }); if (phone) identifiers.push({ phones: phone });
  const matches = identifiers.length ? await StudentProfile.find({ $or: identifiers, mergedIntoId: null }).limit(3) : [];
  let profile;
  if (matches.length === 1) {
    profile = matches[0];
    await StudentProfile.updateOne({ _id: profile._id }, { $addToSet: { ...(email ? { emails: email } : {}), ...(phone ? { phones: phone } : {}) }, $inc: { enquiryCount: 1 } });
  } else {
    profile = await StudentProfile.create({ name: lead.name, emails: email ? [email] : [], phones: phone ? [phone] : [], enquiryCount: 1, reviewRequired: matches.length > 1, possibleDuplicateProfileIds: matches.map((match) => match._id) });
  }
  await Lead.updateOne({ _id: lead._id }, { $set: { studentProfileId: profile._id } });
  return profile;
}
