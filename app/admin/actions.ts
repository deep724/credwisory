"use server";

import sanitizeHtml from "sanitize-html";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/admin-auth";
import { isValidBlogImageValue, validBlogImageMessage } from "@/lib/blog-images";
import { isValidLenderLogo, lenderLogoMessage } from "@/lib/lender-images";
import { adminUserInput, persistAdminUser } from "@/lib/admin-user-service";
import { connectToDatabase } from "@/lib/mongodb";
import {
  AdminUser,
  Application,
  AuditLog,
  BlogPost,
  Lead,
  LeadActivity,
  LeadLenderAssignment,
  LeadFollowUp,
  LeadNote,
  Lender,
  Role,
  StudentProfile,
} from "@/lib/models";

const id = z.string().regex(/^[a-f\d]{24}$/i);
const status = z.enum([
  "NEW",
  "CONTACTED",
  "IN_PROGRESS",
  "DOCUMENTS_PENDING",
  "APPLIED",
  "APPROVED",
  "REJECTED",
  "CLOSED",
]);
const applicationStatus = z.enum([
  "SUBMITTED",
  "IN_REVIEW",
  "DOCUMENTS_PENDING",
  "APPROVED",
  "REJECTED",
  "DISBURSED",
]);
async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
) {
  await AuditLog.create({ actorId, action, entityType, entityId });
}
async function requireCrmAccess() { return requireAdmin(); }
const assignmentInput=z.object({leadId:id,lenderId:id,notes:z.string().max(4000).optional()});
export async function assignLeadLender(formData:FormData){const admin=await requireCrmAccess();const value=assignmentInput.safeParse(Object.fromEntries(formData));if(!value.success)return{error:"Invalid lender assignment."};await connectToDatabase();const exists=await LeadLenderAssignment.exists({leadId:value.data.leadId,lenderId:value.data.lenderId,archivedAt:null});if(exists)return{error:"This lender is already assigned."};const assignment=await LeadLenderAssignment.create({...value.data,assignedById:admin.id});await Lead.updateOne({_id:value.data.leadId,status:"NEW"},{$set:{status:"IN_PROGRESS",lenderId:value.data.lenderId}});await LeadActivity.create({leadId:value.data.leadId,actorId:admin.id,action:"Lender assigned",metadata:{assignmentId:String(assignment._id),lenderId:value.data.lenderId}});await audit(admin.id,"lead_lender.assigned","LeadLenderAssignment",String(assignment._id));revalidatePath(`/admin/leads/${value.data.leadId}`);return{ok:true,id:String(assignment._id)}}
export async function archiveLeadLenderAssignment(formData:FormData){const admin=await requireCrmAccess();const value=z.object({id}).safeParse(Object.fromEntries(formData));if(!value.success)return{error:"Invalid assignment."};await connectToDatabase();const assignment=await LeadLenderAssignment.findOneAndUpdate({_id:value.data.id,archivedAt:null},{$set:{archivedAt:new Date(),archivedById:admin.id}},{new:true});if(!assignment)return{error:"Assignment is unavailable."};await LeadActivity.create({leadId:assignment.leadId,actorId:admin.id,action:"Lender assignment archived",metadata:{assignmentId:value.data.id}});await audit(admin.id,"lead_lender.archived","LeadLenderAssignment",value.data.id);return{ok:true}}
const followUpInput=z.object({leadId:id,assignedToId:id,dueAt:z.string().min(1),reminderAt:z.string().optional(),priority:z.enum(["LOW","NORMAL","HIGH"]).optional(),description:z.string().max(4000).optional()});
export async function createLeadFollowUp(formData:FormData){const admin=await requireCrmAccess();const value=followUpInput.safeParse(Object.fromEntries(formData));if(!value.success)return{error:"Enter a valid follow-up."};const dueAt=new Date(value.data.dueAt);if(Number.isNaN(+dueAt))return{error:"Enter a valid due time."};await connectToDatabase();const item=await LeadFollowUp.create({...value.data,dueAt,reminderAt:value.data.reminderAt?new Date(value.data.reminderAt):undefined});await LeadActivity.create({leadId:value.data.leadId,actorId:admin.id,action:"Follow-up created",metadata:{followUpId:String(item._id)}});await audit(admin.id,"lead_follow_up.created","LeadFollowUp",String(item._id));return{ok:true,id:String(item._id)}}
export async function completeLeadFollowUp(formData:FormData){const admin=await requireCrmAccess();const value=z.object({id}).safeParse(Object.fromEntries(formData));if(!value.success)return{error:"Invalid follow-up."};await connectToDatabase();const item=await LeadFollowUp.findOneAndUpdate({_id:value.data.id,status:"OPEN"},{$set:{status:"COMPLETED",completedById:admin.id,completedAt:new Date()}},{new:true});if(!item)return{error:"Follow-up is unavailable."};await LeadActivity.create({leadId:item.leadId,actorId:admin.id,action:"Follow-up completed",metadata:{followUpId:value.data.id}});await audit(admin.id,"lead_follow_up.completed","LeadFollowUp",value.data.id);return{ok:true}}
export async function listLeadCrmRecords(leadId:string){await requireCrmAccess();if(!id.safeParse(leadId).success)return{error:"Invalid lead."};await connectToDatabase();const [assignments,followUps]=await Promise.all([LeadLenderAssignment.find({leadId,archivedAt:null}).populate("lenderId","name logoUrl lenderType").populate("assignedById","name").lean(),LeadFollowUp.find({leadId}).populate("assignedToId","name").sort({dueAt:1}).lean()]);return{ok:true,assignments,followUps}}
export async function updateLeadFollowUp(formData:FormData){const admin=await requireCrmAccess();const value=z.object({id,assignedToId:id,dueAt:z.string().min(1),priority:z.enum(["LOW","NORMAL","HIGH"]),description:z.string().max(4000).optional(),status:z.enum(["OPEN","COMPLETED","CANCELLED"])}).safeParse(Object.fromEntries(formData));if(!value.success)return{error:"Invalid follow-up update."};await connectToDatabase();const item=await LeadFollowUp.findByIdAndUpdate(value.data.id,{$set:{...value.data,dueAt:new Date(value.data.dueAt)}},{new:true});if(!item)return{error:"Follow-up is unavailable."};await LeadActivity.create({leadId:item.leadId,actorId:admin.id,action:`Follow-up ${value.data.status.toLowerCase()}`,metadata:{followUpId:value.data.id}});await audit(admin.id,"lead_follow_up.updated","LeadFollowUp",value.data.id);return{ok:true}}

export async function updateLeadStatus(formData: FormData) {
  const admin = await requireAdmin();
  const value = z
    .object({ id, status })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return { error: "Choose a valid status." };
  await connectToDatabase();
  const lead = (await Lead.findOne({ _id: value.data.id, deletedAt: null })
    .select("status")
    .lean()) as { status?: string } | null;
  if (!lead) return { error: "This enquiry is no longer available." };
  if (lead.status === value.data.status) return { ok: true, unchanged: true };
  await Lead.updateOne(
    { _id: value.data.id },
    { $set: { status: value.data.status } },
  );
  await LeadActivity.create({
    leadId: value.data.id,
    actorId: admin.id,
    action: `Status changed to ${value.data.status}`,
  });
  await audit(admin.id, "lead.status_updated", "Lead", value.data.id);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}
export async function deleteClosedLead(formData: FormData) {
  const admin = await requireAdmin();
  const value = z
    .object({ id, confirm: z.literal("DELETE") })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return { error: "Unable to confirm this deletion." };
  await connectToDatabase();
  const lead = (await Lead.findOne({ _id: value.data.id, deletedAt: null })
    .select("status studentProfileId")
    .lean()) as { status?: string; studentProfileId?: unknown } | null;
  if (!lead) return { error: "This lead is no longer available." };
  if (lead.status !== "CLOSED")
    return { error: "Only resolved / closed leads can be deleted." };
  await Promise.all([
    Lead.deleteOne({ _id: value.data.id }),
    LeadActivity.deleteMany({ leadId: value.data.id }),
    LeadNote.deleteMany({ leadId: value.data.id }),
  ]);
  if (lead.studentProfileId) {
    const enquiryCount = await Lead.countDocuments({
      studentProfileId: lead.studentProfileId,
      deletedAt: null,
    });
    await StudentProfile.updateOne(
      { _id: lead.studentProfileId },
      { $set: { enquiryCount } },
    );
  }
  await audit(admin.id, "lead.deleted", "Lead", value.data.id);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}
export async function updateLeadDetails(formData: FormData) {
  const admin = await requireAdmin();
  const value = z
    .object({
      id,
      status,
      assignedToId: z.union([id, z.literal("")]),
      followUpAt: z.string().max(40).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return;
  await connectToDatabase();
  const followUpAt = value.data.followUpAt
    ? new Date(value.data.followUpAt)
    : null;
  if (followUpAt && Number.isNaN(followUpAt.getTime())) return;
  const previous = (await Lead.findById(value.data.id)
    .select("status assignedToId followUpAt")
    .lean()) as unknown as {
    status?: string;
    assignedToId?: unknown;
    followUpAt?: Date;
  } | null;
  if (!previous) return;
  await Lead.updateOne(
    { _id: value.data.id },
    {
      $set: {
        status: value.data.status,
        assignedToId: value.data.assignedToId || null,
        followUpAt,
      },
    },
  );
  const activities = [] as {
    leadId: string;
    actorId: string;
    action: string;
  }[];
  if (previous.status !== value.data.status)
    activities.push({
      leadId: value.data.id,
      actorId: admin.id,
      action: `Status changed to ${value.data.status}`,
    });
  if (String(previous.assignedToId || "") !== value.data.assignedToId)
    activities.push({
      leadId: value.data.id,
      actorId: admin.id,
      action: "Assigned admin changed",
    });
  if (!activities.length)
    activities.push({
      leadId: value.data.id,
      actorId: admin.id,
      action: "Lead details updated",
    });
  await LeadActivity.insertMany(activities);
  await audit(admin.id, "lead.updated", "Lead", value.data.id);
  revalidatePath(`/admin/leads/${value.data.id}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
export async function addLeadNote(formData: FormData) {
  const admin = await requireAdmin();
  const value = z
    .object({ id, note: z.string().trim().min(1).max(4000) })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return;
  await connectToDatabase();
  const note = await LeadNote.create({
    leadId: value.data.id,
    authorId: admin.id,
    body: sanitizeHtml(value.data.note, {
      allowedTags: [],
      allowedAttributes: {},
    }),
  });
  await LeadActivity.create({
    leadId: value.data.id,
    actorId: admin.id,
    action: "Note added",
    metadata: { noteId: String(note._id) },
  });
  await audit(admin.id, "lead.note_added", "Lead", value.data.id);
  revalidatePath(`/admin/leads/${value.data.id}`);
}
const lenderInput = z.object({
  id: z.union([id, z.literal("")]).optional(),
  name: z.string().trim().min(2, "Enter a lender name of at least 2 characters.").max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  lenderType: z.enum(["BANK", "NBFC", "INTERNATIONAL", "OTHER"]),
  displayOrder: z.coerce.number().int("Display order must be a whole number.").min(0, "Display order cannot be negative.").max(9999),
  published: z.enum(["true", "false"]),
  securedLoan: z.string().trim().min(1, "Enter secured loan details or Not available.").max(120),
  unsecuredLoan: z.string().trim().min(1, "Enter unsecured loan details or Not available.").max(120),
  securedRate: z.string().trim().min(1, "Enter a secured rate or Not available.").max(120),
  unsecuredRate: z.string().trim().min(1, "Enter an unsecured rate or Not available.").max(120),
  moratorium: z.string().trim().max(160),
  tenure: z.string().trim().max(120),
  foreclosure: z.string().trim().max(120),
  processingFee: z.string().trim().max(120),
  description: z.string().trim().max(500).optional(),
  collateralAvailable: z.enum(["true", "false"]),
  nonCollateralAvailable: z.enum(["true", "false"]),
  logoUrl: z.string().trim().max(1000).optional(),
  applicationUrl: z.string().trim().url().or(z.literal("")),
});
export async function saveLender(formData: FormData) {
  const admin = await requireAdmin();
  const raw = Object.fromEntries(formData);
  if (raw.intent === "save-draft") { raw.published = "false"; raw.slug ||= String(raw.name || "draft-lender").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "draft-lender"; raw.displayOrder ||= "0"; raw.securedLoan ||= "Not available"; raw.unsecuredLoan ||= "Not available"; raw.securedRate ||= "Not available"; raw.unsecuredRate ||= "Not available"; raw.moratorium ||= ""; raw.tenure ||= ""; raw.foreclosure ||= ""; raw.processingFee ||= ""; raw.collateralAvailable ||= "false"; raw.nonCollateralAvailable ||= "false"; raw.applicationUrl ||= ""; }
  if (raw.intent === "publish") raw.published = "true";
  const value = lenderInput.safeParse(raw);
  if (!value.success)
    return { error: "Please complete the highlighted lender fields before publishing.", fields: Object.fromEntries(Object.entries(value.error.flatten().fieldErrors).map(([field, messages]) => [field, messages?.[0] || "Please correct this field."])) };
  if (!isValidLenderLogo(value.data.logoUrl || ""))
    return { error: "Please complete the highlighted lender fields before publishing.", fields: { logoUrl: lenderLogoMessage } };
  await connectToDatabase();
  const {
    id: lenderId,
    published,
    securedLoan,
    unsecuredLoan,
    securedRate,
    unsecuredRate,
    moratorium,
    tenure,
    foreclosure,
    processingFee,
    ...data
  } = value.data;
  const duplicate = await Lender.exists({ slug: data.slug, ...(lenderId ? { _id: { $ne: lenderId } } : {}) });
  if (duplicate)
    return { error: "Please complete the highlighted lender fields before publishing.", fields: { slug: "That lender slug is already in use." } };
  const document = {
    ...data,
    published: published === "true",
    logoUrl: data.logoUrl || undefined,
    applicationUrl: data.applicationUrl || undefined,
    comparison: {
      secured: securedLoan,
      unsecured: unsecuredLoan,
      securedRate,
      unsecuredRate,
      moratorium,
      tenure,
      foreclosure,
      fee: processingFee,
    },
  };
  let lender;
  try {
    lender = lenderId
      ? await Lender.findByIdAndUpdate(
          lenderId,
          { $set: document },
          { new: true, runValidators: true },
        )
      : await Lender.create(document);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000)
      return { error: "Please complete the highlighted lender fields before publishing.", fields: { slug: "That lender slug is already in use." } };
    return { error: "The lender could not be saved. Please try again." };
  }
  if (!lender) return { error: "The lender could not be found." };
  await audit(
    admin.id,
    lenderId ? "lender.updated" : "lender.created",
    "Lender",
    String(lender._id),
  );
  revalidatePath("/admin/lenders");
  revalidatePath("/");
  revalidatePath("/lenders");
  revalidatePath("/compare-all-lenders.html");
  return { ok: true, id: String(lender._id), lender };
}
export async function deleteLender(formData: FormData) {
  const admin = await requireRole("SUPER_ADMIN");
  const value = z
    .object({ id, confirm: z.literal("DELETE") })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return;
  await connectToDatabase();
  await Lender.deleteOne({ _id: value.data.id });
  await audit(admin.id, "lender.deleted", "Lender", value.data.id);
  revalidatePath("/admin/lenders");
  revalidatePath("/");
  revalidatePath("/lenders");
  revalidatePath("/compare-all-lenders.html");
}
export async function createAdminUser(formData: FormData) {
  const admin = await requireRole("SUPER_ADMIN");
  const value = adminUserInput.safeParse(Object.fromEntries(formData));
  if (!value.success) return { error: "Enter a name, valid email, password of at least 12 characters, and role." };

  try {
    await connectToDatabase();
    const result = await persistAdminUser(value.data, await bcrypt.hash(value.data.password, 12), {
      ensureRole: async (key) => (await Role.findOneAndUpdate(
        { key },
        { $setOnInsert: { name: key === "SUPER_ADMIN" ? "Super Admin" : "Staff" } },
        { upsert: true, new: true },
      ).lean()) as { _id: unknown } | null,
      emailExists: async (email) => Boolean(await AdminUser.exists({ email })),
      create: async (user) => AdminUser.create(user),
    });
    if (!result.ok) return result;
    try {
      await audit(admin.id, "admin_user.created", "AdminUser", result.id);
    } catch {
      console.error("[admin-users] audit log failed after admin creation");
    }
    revalidatePath("/admin/users");
    return result;
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 11000;
    if (duplicate) return { error: "An admin user with this email already exists." };
    console.error("[admin-users] create failed", { reason: error instanceof Error ? error.name : "unknown" });
    return { error: "We couldn't create this admin user. Please try again." };
  }
}
export async function changeOwnPassword(formData: FormData) {
  const admin = await requireAdmin({ allowPasswordChange: true });
  const value = z
    .object({ password: z.string().min(12).max(128), confirmation: z.string() })
    .safeParse(Object.fromEntries(formData));
  if (!value.success || value.data.password !== value.data.confirmation)
    return { error: "Use a matching password of at least 12 characters." };
  await connectToDatabase();
  await AdminUser.updateOne(
    { _id: admin._id },
    {
      $set: {
        passwordHash: await bcrypt.hash(value.data.password, 12),
        mustChangePassword: false,
        failedLogins: 0,
        lockedUntil: null,
      },
    },
  );
  await audit(admin.id, "admin_user.password_changed", "AdminUser", admin.id);
  revalidatePath("/admin");
  return { ok: true };
}
export async function updateAdminUser(formData: FormData) {
  const admin = await requireRole("SUPER_ADMIN");
  const value = z
    .object({
      id,
      role: z.enum(["SUPER_ADMIN", "STAFF"]),
      active: z.enum(["true", "false"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return;
  await connectToDatabase();
  const target = await AdminUser.findById(value.data.id).populate("roleId");
  if (!target) return;
  const targetRole = target.roleId as unknown as { key?: string } | null;
  const changingOwnPrivilege =
    String(target._id) === admin.id &&
    (value.data.active === "false" || value.data.role !== "SUPER_ADMIN");
  if (changingOwnPrivilege) return;
  const removesSuper =
    targetRole?.key === "SUPER_ADMIN" &&
    (value.data.active === "false" || value.data.role !== "SUPER_ADMIN");
  if (removesSuper) {
    const superRole = await Role.findOne({ key: "SUPER_ADMIN" });
    const count = superRole
      ? await AdminUser.countDocuments({ roleId: superRole._id, active: true })
      : 0;
    if (count <= 1) return;
  }
  const role = await Role.findOne({ key: value.data.role });
  if (!role) return;
  await AdminUser.updateOne(
    { _id: target._id },
    { $set: { roleId: role._id, active: value.data.active === "true" } },
  );
  await audit(
    admin.id,
    value.data.active === "true"
      ? "admin_user.updated"
      : "admin_user.deactivated",
    "AdminUser",
    String(target._id),
  );
  revalidatePath("/admin/users");
}
export async function createApplication(formData: FormData) {
  const admin = await requireAdmin();
  const value = z
    .object({ leadId: id, lenderId: id, status: applicationStatus })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return;
  await connectToDatabase();
  const [lead, lender] = await Promise.all([
    Lead.exists({ _id: value.data.leadId, deletedAt: null }),
    Lender.exists({ _id: value.data.lenderId, archivedAt: null }),
  ]);
  if (!lead || !lender) return;
  const application = await Application.create({
    ...value.data,
    history: [
      {
        status: value.data.status,
        changedById: admin.id,
        note: "Application created",
      },
    ],
  });
  await Lead.updateOne(
    { _id: value.data.leadId },
    { $set: { status: "APPLIED", lenderId: value.data.lenderId } },
  );
  await LeadActivity.create({
    leadId: value.data.leadId,
    actorId: admin.id,
    action: "Lender application created",
    metadata: { applicationId: String(application._id) },
  });
  await audit(
    admin.id,
    "application.created",
    "Application",
    String(application._id),
  );
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/leads/${value.data.leadId}`);
}
export async function updateApplicationStatus(formData: FormData) {
  const admin = await requireAdmin();
  const value = z
    .object({
      id,
      status: applicationStatus,
      note: z.string().trim().max(1000).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return;
  await connectToDatabase();
  const application = await Application.findById(value.data.id);
  if (!application) return;
  application.status = value.data.status;
  application.history.push({
    status: value.data.status,
    changedById: admin._id,
    note: value.data.note || undefined,
    changedAt: new Date(),
  });
  await application.save();
  await audit(
    admin.id,
    "application.status_updated",
    "Application",
    value.data.id,
  );
  revalidatePath("/admin/applications");
}
export async function deleteApplication(formData: FormData) { const admin=await requireAdmin();const value=z.object({id,confirm:z.literal("DELETE")}).safeParse(Object.fromEntries(formData));if(!value.success)return{error:"Unable to confirm deletion."};await connectToDatabase();const application=await Application.findByIdAndDelete(value.data.id);if(!application)return{error:"Application is unavailable."};await LeadActivity.create({leadId:application.leadId,actorId:admin.id,action:"Application deleted",metadata:{applicationId:value.data.id}});await audit(admin.id,"application.deleted","Application",value.data.id);revalidatePath("/admin/applications");revalidatePath(`/admin/leads/${application.leadId}`);return{ok:true};}
export async function mergeStudentProfiles(formData: FormData) {
  const admin = await requireRole("SUPER_ADMIN");
  const value = z
    .object({ sourceId: id, targetId: id, confirm: z.literal("MERGE") })
    .safeParse(Object.fromEntries(formData));
  if (!value.success || value.data.sourceId === value.data.targetId) return;
  await connectToDatabase();
  const [source, target] = await Promise.all([
    StudentProfile.findOne({ _id: value.data.sourceId, mergedIntoId: null }),
    StudentProfile.findOne({ _id: value.data.targetId, mergedIntoId: null }),
  ]);
  if (!source || !target) return;
  await Lead.updateMany(
    { studentProfileId: source._id },
    { $set: { studentProfileId: target._id } },
  );
  const total = await Lead.countDocuments({
    studentProfileId: target._id,
    deletedAt: null,
  });
  await StudentProfile.updateOne(
    { _id: target._id },
    {
      $addToSet: {
        emails: { $each: source.emails || [] },
        phones: { $each: source.phones || [] },
      },
      $set: { enquiryCount: total, reviewRequired: false },
    },
  );
  await StudentProfile.updateOne(
    { _id: source._id },
    {
      $set: { mergedIntoId: target._id, mergedAt: new Date(), enquiryCount: 0 },
    },
  );
  await audit(
    admin.id,
    "student_profile.merged",
    "StudentProfile",
    value.data.sourceId,
  );
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/students/${value.data.targetId}`);
}
export async function archiveLender(formData: FormData) {
  const admin = await requireAdmin();
  const value = id.safeParse(formData.get("id"));
  if (!value.success) return;
  await connectToDatabase();
  await Lender.updateOne(
    { _id: value.data },
    { $set: { archivedAt: new Date(), published: false } },
  );
  await audit(admin.id, "lender.archived", "Lender", value.data);
  revalidatePath("/admin/lenders");
  revalidatePath("/");
  revalidatePath("/lenders");
  revalidatePath("/compare-all-lenders.html");
}
export async function archiveBlog(formData: FormData) {
  const admin = await requireAdmin();
  const value = id.safeParse(formData.get("id"));
  if (!value.success) return;
  await connectToDatabase();
  await BlogPost.updateOne(
    { _id: value.data, deletedAt: null },
    { $set: { status: "ARCHIVED", updatedById: admin.id } },
  );
  await audit(admin.id, "blog.archived", "BlogPost", value.data);
  revalidateBlogs();
}
export async function unpublishBlog(formData: FormData) {
  const admin = await requireAdmin();
  const value = id.safeParse(formData.get("id"));
  if (!value.success) return;
  await connectToDatabase();
  await BlogPost.updateOne(
    { _id: value.data, deletedAt: null },
    { $set: { status: "DRAFT", updatedById: admin.id } },
  );
  await audit(admin.id, "blog.unpublished", "BlogPost", value.data);
  revalidateBlogs();
}
export async function publishBlog(formData: FormData) {
  const admin = await requireAdmin();
  const value = id.safeParse(formData.get("id"));
  if (!value.success) return;
  await connectToDatabase();
  await BlogPost.updateOne(
    { _id: value.data, deletedAt: null, status: "DRAFT" },
    { $set: { status: "PUBLISHED", publishedAt: new Date(), updatedById: admin.id } },
  );
  await audit(admin.id, "blog.published", "BlogPost", value.data);
  revalidateBlogs();
}
const blogInput = z.object({
  id: z.union([id, z.literal("")]).optional(),
  title: z.string().trim().min(5, "Enter a title of at least 5 characters.").max(180, "Keep the title under 180 characters."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only.")
    .max(180, "Keep the slug under 180 characters."),
  excerpt: z.string().trim().min(10, "Write an excerpt of at least 10 characters.").max(400, "Keep the excerpt under 400 characters."),
  content: z.string().trim().min(20, "Write blog content of at least 20 characters.").max(100_000, "Blog content is too long."),
  category: z.string().trim().max(80).optional(),
  tags: z.string().max(500).optional(),
  coverImageUrl: z.string().trim().max(1000).optional(),
  seoTitle: z.string().trim().max(180).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.enum(["true", "false"]).optional(),
  publishDate: z.string().max(40).optional(),
});
const safeBlogContent = (content: string) =>
  sanitizeHtml(content, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
    ],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] },
    allowedSchemes: ["http", "https"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
function revalidateBlogs() {
  revalidatePath("/admin/blogs");
  revalidatePath("/blogs");
}
export async function saveBlog(formData: FormData) {
  const admin = await requireAdmin();
  const raw = Object.fromEntries(formData);
  if (raw.intent === "save-draft") raw.status = "DRAFT";
  if (raw.intent === "publish") raw.status = "PUBLISHED";
  const input = blogInput.safeParse(raw);
  if (!input.success) {
    const fields = Object.fromEntries(
      Object.entries(input.error.flatten().fieldErrors).map(([field, messages]) => [field, messages?.[0] || "Please correct this field."]),
    );
    return { error: "Please complete the highlighted fields before publishing.", fields };
  }
  if (!isValidBlogImageValue(input.data.coverImageUrl || ""))
    return { error: "Please complete the highlighted fields before publishing.", fields: { coverImageUrl: validBlogImageMessage() } };
  await connectToDatabase();
  const { id: postId, tags, featured, publishDate, ...data } = input.data;
  const duplicate = await BlogPost.exists({
    slug: data.slug,
    ...(postId ? { _id: { $ne: postId } } : {}),
  });
  if (duplicate)
    return { error: "Please complete the highlighted fields before publishing.", fields: { slug: "That slug is already in use. Choose a unique URL." } };
  const publishedAt =
    data.status === "PUBLISHED"
      ? publishDate
        ? new Date(publishDate)
        : new Date()
      : undefined;
  if (publishedAt && Number.isNaN(publishedAt.getTime()))
    return { error: "Please complete the highlighted fields before publishing.", fields: { publishDate: "Choose a valid publish date." } };
  const document = {
    ...data,
    content: safeBlogContent(data.content),
    tags: (tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 12),
    coverImageUrl: data.coverImageUrl || undefined,
    featured: featured === "true",
    publishedAt,
    updatedById: admin.id,
  };
  let post;
  try {
    post = postId
      ? await BlogPost.findByIdAndUpdate(
          postId,
          { $set: document },
          { new: true, runValidators: true },
        )
      : await BlogPost.create({
          ...document,
          author: admin.name,
          authorId: admin.id,
        });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000)
      return { error: "Please complete the highlighted fields before publishing.", fields: { slug: "That slug is already in use. Choose a unique URL." } };
    return { error: "The blog post could not be saved. Please try again." };
  }
  if (!post) return { error: "This blog post no longer exists." };
  await audit(
    admin.id,
    postId ? "blog.updated" : "blog.created",
    "BlogPost",
    String(post._id),
  );
  revalidateBlogs();
  revalidatePath(`/blogs/${post.slug}`);
  return { ok: true, id: String(post._id), slug: post.slug };
}
export async function deleteBlog(formData: FormData) {
  const admin = await requireAdmin();
  const value = z
    .object({ id, confirm: z.literal("DELETE") })
    .safeParse(Object.fromEntries(formData));
  if (!value.success) return { error: "Unable to confirm deletion." };
  await connectToDatabase();
  const post = (await BlogPost.findOneAndDelete({
    _id: value.data.id,
    deletedAt: null,
  })
    .select("slug")
    .lean()) as { slug?: string } | null;
  if (!post) return { error: "This blog post is no longer available." };
  await audit(admin.id, "blog.deleted", "BlogPost", value.data.id);
  revalidateBlogs();
  if (post.slug) revalidatePath(`/blogs/${post.slug}`);
  return { ok: true };
}
