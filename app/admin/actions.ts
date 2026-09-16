"use server";

import sanitizeHtml from "sanitize-html";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser, Application, AuditLog, BlogPost, Lead, LeadActivity, LeadNote, Lender, Role, StudentProfile } from "@/lib/models";

const id = z.string().regex(/^[a-f\d]{24}$/i);
const status = z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "DOCUMENTS_PENDING", "APPLIED", "APPROVED", "REJECTED", "CLOSED"]);
const applicationStatus = z.enum(["SUBMITTED", "IN_REVIEW", "DOCUMENTS_PENDING", "APPROVED", "REJECTED", "DISBURSED"]);
async function audit(actorId: string, action: string, entityType: string, entityId: string) { await AuditLog.create({ actorId, action, entityType, entityId }); }

export async function updateLeadStatus(formData: FormData) {
  const admin = await requireAdmin(); const value = z.object({ id, status }).safeParse(Object.fromEntries(formData)); if (!value.success) return { error: "Choose a valid status." };
  await connectToDatabase();
  const lead = await Lead.findOne({ _id: value.data.id, deletedAt: null }).select("status").lean() as { status?: string } | null;
  if (!lead) return { error: "This enquiry is no longer available." };
  if (lead.status === value.data.status) return { ok: true, unchanged: true };
  await Lead.updateOne({ _id: value.data.id }, { $set: { status: value.data.status } });
  await LeadActivity.create({ leadId: value.data.id, actorId: admin.id, action: `Status changed to ${value.data.status}` });
  await audit(admin.id, "lead.status_updated", "Lead", value.data.id); revalidatePath("/admin/leads"); revalidatePath("/admin");
  return { ok: true };
}
export async function updateLeadDetails(formData: FormData) {
  const admin = await requireAdmin(); const value = z.object({ id, status, assignedToId: z.union([id, z.literal("")]), followUpAt: z.string().max(40).optional() }).safeParse(Object.fromEntries(formData)); if (!value.success) return;
  await connectToDatabase(); const followUpAt = value.data.followUpAt ? new Date(value.data.followUpAt) : null;
  if (followUpAt && Number.isNaN(followUpAt.getTime())) return;
  const previous = await Lead.findById(value.data.id).select("status assignedToId followUpAt").lean() as unknown as { status?: string; assignedToId?: unknown; followUpAt?: Date } | null; if (!previous) return;
  await Lead.updateOne({ _id: value.data.id }, { $set: { status: value.data.status, assignedToId: value.data.assignedToId || null, followUpAt } });
  const activities = [] as { leadId: string; actorId: string; action: string }[];
  if (previous.status !== value.data.status) activities.push({ leadId: value.data.id, actorId: admin.id, action: `Status changed to ${value.data.status}` });
  if (String(previous.assignedToId || "") !== value.data.assignedToId) activities.push({ leadId: value.data.id, actorId: admin.id, action: "Assigned admin changed" });
  if (!activities.length) activities.push({ leadId: value.data.id, actorId: admin.id, action: "Lead details updated" });
  await LeadActivity.insertMany(activities); await audit(admin.id, "lead.updated", "Lead", value.data.id);
  revalidatePath(`/admin/leads/${value.data.id}`); revalidatePath("/admin/leads"); revalidatePath("/admin");
}
export async function addLeadNote(formData: FormData) {
  const admin = await requireAdmin(); const value = z.object({ id, note: z.string().trim().min(1).max(4000) }).safeParse(Object.fromEntries(formData)); if (!value.success) return;
  await connectToDatabase(); const note = await LeadNote.create({ leadId: value.data.id, authorId: admin.id, body: sanitizeHtml(value.data.note, { allowedTags: [], allowedAttributes: {} }) });
  await LeadActivity.create({ leadId: value.data.id, actorId: admin.id, action: "Note added", metadata: { noteId: String(note._id) } }); await audit(admin.id, "lead.note_added", "Lead", value.data.id); revalidatePath(`/admin/leads/${value.data.id}`);
}
const lenderInput = z.object({ id: z.union([id, z.literal("")]).optional(), name: z.string().trim().min(2).max(120), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), lenderType: z.enum(["BANK", "NBFC", "INTERNATIONAL"]), displayOrder: z.coerce.number().int().min(0).max(9999), published: z.enum(["true", "false"]), securedLoan: z.string().trim().max(120), unsecuredLoan: z.string().trim().max(120), securedRate: z.string().trim().max(120), unsecuredRate: z.string().trim().max(120), moratorium: z.string().trim().max(160), tenure: z.string().trim().max(120), foreclosure: z.string().trim().max(120), processingFee: z.string().trim().max(120), logoUrl: z.string().trim().url().or(z.literal("")), applicationUrl: z.string().trim().url().or(z.literal("")) });
export async function saveLender(formData: FormData) {
  const admin = await requireAdmin(); const value = lenderInput.safeParse(Object.fromEntries(formData)); if (!value.success) return { error: "Please correct the highlighted lender fields and try again." };
  await connectToDatabase(); const { id: lenderId, published, securedLoan, unsecuredLoan, securedRate, unsecuredRate, moratorium, tenure, foreclosure, processingFee, ...data } = value.data;
  const document = { ...data, published: published === "true", logoUrl: data.logoUrl || undefined, applicationUrl: data.applicationUrl || undefined, comparison: { secured: securedLoan, unsecured: unsecuredLoan, securedRate, unsecuredRate, moratorium, tenure, foreclosure, fee: processingFee } };
  const lender = lenderId ? await Lender.findByIdAndUpdate(lenderId, { $set: document }, { new: true, runValidators: true }) : await Lender.create(document);
  if (!lender) return { error: "The lender could not be found." }; await audit(admin.id, lenderId ? "lender.updated" : "lender.created", "Lender", String(lender._id)); revalidatePath("/admin/lenders"); revalidatePath("/"); revalidatePath("/compare-all-lenders.html"); return { ok: true };
}
export async function deleteLender(formData: FormData) {
  const admin = await requireRole("SUPER_ADMIN"); const value = z.object({ id, confirm: z.literal("DELETE") }).safeParse(Object.fromEntries(formData)); if (!value.success) return;
  await connectToDatabase(); await Lender.deleteOne({ _id: value.data.id }); await audit(admin.id, "lender.deleted", "Lender", value.data.id); revalidatePath("/admin/lenders"); revalidatePath("/");
}
export async function createAdminUser(formData: FormData) {
  const admin = await requireRole("SUPER_ADMIN"); const value = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), password: z.string().min(12).max(128), role: z.enum(["SUPER_ADMIN", "STAFF"]) }).safeParse(Object.fromEntries(formData)); if (!value.success) return;
  await connectToDatabase(); const role = await Role.findOne({ key: value.data.role }); if (!role) return;
  const exists = await AdminUser.exists({ email: value.data.email.toLowerCase() }); if (exists) return;
  const user = await AdminUser.create({ name: value.data.name, email: value.data.email.toLowerCase(), passwordHash: await bcrypt.hash(value.data.password, 12), roleId: role._id, active: true, mustChangePassword: true });
  await audit(admin.id, "admin_user.created", "AdminUser", String(user._id)); revalidatePath("/admin/users");
}
export async function changeOwnPassword(formData: FormData) {
  const admin = await requireAdmin({ allowPasswordChange: true }); const value = z.object({ password: z.string().min(12).max(128), confirmation: z.string() }).safeParse(Object.fromEntries(formData)); if (!value.success || value.data.password !== value.data.confirmation) return { error: "Use a matching password of at least 12 characters." };
  await connectToDatabase(); await AdminUser.updateOne({ _id: admin._id }, { $set: { passwordHash: await bcrypt.hash(value.data.password, 12), mustChangePassword: false, failedLogins: 0, lockedUntil: null } }); await audit(admin.id, "admin_user.password_changed", "AdminUser", admin.id); revalidatePath("/admin"); return { ok: true };
}
export async function updateAdminUser(formData: FormData) {
  const admin = await requireRole("SUPER_ADMIN"); const value = z.object({ id, role: z.enum(["SUPER_ADMIN", "STAFF"]), active: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(formData)); if (!value.success) return;
  await connectToDatabase(); const target = await AdminUser.findById(value.data.id).populate("roleId"); if (!target) return; const targetRole = target.roleId as unknown as { key?: string } | null;
  const changingOwnPrivilege = String(target._id) === admin.id && (value.data.active === "false" || value.data.role !== "SUPER_ADMIN"); if (changingOwnPrivilege) return;
  const removesSuper = targetRole?.key === "SUPER_ADMIN" && (value.data.active === "false" || value.data.role !== "SUPER_ADMIN"); if (removesSuper) { const superRole = await Role.findOne({ key: "SUPER_ADMIN" }); const count = superRole ? await AdminUser.countDocuments({ roleId: superRole._id, active: true }) : 0; if (count <= 1) return; }
  const role = await Role.findOne({ key: value.data.role }); if (!role) return; await AdminUser.updateOne({ _id: target._id }, { $set: { roleId: role._id, active: value.data.active === "true" } }); await audit(admin.id, value.data.active === "true" ? "admin_user.updated" : "admin_user.deactivated", "AdminUser", String(target._id)); revalidatePath("/admin/users");
}
export async function createApplication(formData: FormData) {
  const admin = await requireAdmin(); const value = z.object({ leadId: id, lenderId: id, status: applicationStatus }).safeParse(Object.fromEntries(formData)); if (!value.success) return;
  await connectToDatabase(); const [lead, lender] = await Promise.all([Lead.exists({ _id: value.data.leadId, deletedAt: null }), Lender.exists({ _id: value.data.lenderId, archivedAt: null })]); if (!lead || !lender) return;
  const application = await Application.create({ ...value.data, history: [{ status: value.data.status, changedById: admin.id, note: "Application created" }] });
  await Lead.updateOne({ _id: value.data.leadId }, { $set: { status: "APPLIED", lenderId: value.data.lenderId } }); await LeadActivity.create({ leadId: value.data.leadId, actorId: admin.id, action: "Lender application created", metadata: { applicationId: String(application._id) } }); await audit(admin.id, "application.created", "Application", String(application._id)); revalidatePath("/admin/applications"); revalidatePath(`/admin/leads/${value.data.leadId}`);
}
export async function updateApplicationStatus(formData: FormData) {
  const admin = await requireAdmin(); const value = z.object({ id, status: applicationStatus, note: z.string().trim().max(1000).optional() }).safeParse(Object.fromEntries(formData)); if (!value.success) return;
  await connectToDatabase(); const application = await Application.findById(value.data.id); if (!application) return; application.status = value.data.status; application.history.push({ status: value.data.status, changedById: admin._id, note: value.data.note || undefined, changedAt: new Date() }); await application.save(); await audit(admin.id, "application.status_updated", "Application", value.data.id); revalidatePath("/admin/applications");
}
export async function mergeStudentProfiles(formData: FormData) {
  const admin = await requireRole("SUPER_ADMIN"); const value = z.object({ sourceId: id, targetId: id, confirm: z.literal("MERGE") }).safeParse(Object.fromEntries(formData)); if (!value.success || value.data.sourceId === value.data.targetId) return;
  await connectToDatabase(); const [source, target] = await Promise.all([StudentProfile.findOne({ _id: value.data.sourceId, mergedIntoId: null }), StudentProfile.findOne({ _id: value.data.targetId, mergedIntoId: null })]); if (!source || !target) return;
  await Lead.updateMany({ studentProfileId: source._id }, { $set: { studentProfileId: target._id } }); const total = await Lead.countDocuments({ studentProfileId: target._id, deletedAt: null });
  await StudentProfile.updateOne({ _id: target._id }, { $addToSet: { emails: { $each: source.emails || [] }, phones: { $each: source.phones || [] } }, $set: { enquiryCount: total, reviewRequired: false } }); await StudentProfile.updateOne({ _id: source._id }, { $set: { mergedIntoId: target._id, mergedAt: new Date(), enquiryCount: 0 } });
  await audit(admin.id, "student_profile.merged", "StudentProfile", value.data.sourceId); revalidatePath("/admin/leads"); revalidatePath(`/admin/students/${value.data.targetId}`);
}
export async function archiveLender(formData: FormData) {
  const admin = await requireAdmin(); const value = id.safeParse(formData.get("id")); if (!value.success) return;
  await connectToDatabase(); await Lender.updateOne({ _id: value.data }, { $set: { archivedAt: new Date(), published: false } });
  await audit(admin.id, "lender.archived", "Lender", value.data); revalidatePath("/admin/lenders");
}
export async function archiveBlog(formData: FormData) {
  const admin = await requireAdmin(); const value = id.safeParse(formData.get("id")); if (!value.success) return;
  await connectToDatabase(); await BlogPost.updateOne({ _id: value.data }, { $set: { deletedAt: new Date(), status: "ARCHIVED" } });
  await audit(admin.id, "blog.archived", "BlogPost", value.data); revalidatePath("/admin/blogs");
}
export async function createBlog(formData: FormData) {
  const admin = await requireAdmin();
  const input = z.object({ title: z.string().trim().min(5).max(180), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180), excerpt: z.string().trim().max(400).optional(), content: z.string().trim().min(20).max(100_000) }).safeParse(Object.fromEntries(formData)); if (!input.success) return;
  await connectToDatabase();
  const post = await BlogPost.create({ ...input.data, content: sanitizeHtml(input.data.content, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]), allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "width", "height"] } }), author: admin.name });
  await audit(admin.id, "blog.created", "BlogPost", post.id); revalidatePath("/admin/blogs");
}
