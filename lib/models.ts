import "server-only";
import { Schema, model, models, type Model } from "mongoose";

const schemaOptions = { timestamps: true, versionKey: false as const };
const json = Schema.Types.Mixed;

const roleSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
  },
  schemaOptions,
);
const adminUserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, minlength: 20 },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    active: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: Date,
    lastLoginAt: Date,
  },
  schemaOptions,
);
const visitorSessionSchema = new Schema(
  {
    anonymousId: { type: String, required: true, unique: true },
    analyticsOk: { type: Boolean, default: false },
    consentedAt: Date,
    firstSeenAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    durationSecs: { type: Number, default: 0 },
    entryPage: String,
    exitPage: String,
    referrer: String,
    deviceType: String,
    browser: String,
    countryCode: String,
    convertedAt: Date,
  },
  schemaOptions,
);
visitorSessionSchema.index({ lastActiveAt: 1 });
const consentRecordSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "VisitorSession",
      required: true,
    },
    analyticsOk: { type: Boolean, required: true },
    policyVersion: { type: String, required: true },
  },
  schemaOptions,
);
consentRecordSchema.index({ sessionId: 1, createdAt: -1 });
const pageViewSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "VisitorSession",
      required: true,
    },
    path: { type: String, required: true },
    title: String,
    enteredAt: { type: Date, default: Date.now },
    durationSecs: { type: Number, default: 0 },
  },
  schemaOptions,
);
pageViewSchema.index({ path: 1, enteredAt: -1 });
pageViewSchema.index({ sessionId: 1, enteredAt: -1 });
const studentProfileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    emails: [{ type: String, lowercase: true, trim: true }],
    phones: [{ type: String, trim: true }],
    enquiryCount: { type: Number, default: 0 },
    reviewRequired: { type: Boolean, default: false },
    possibleDuplicateProfileIds: [
      { type: Schema.Types.ObjectId, ref: "StudentProfile" },
    ],
    mergedIntoId: { type: Schema.Types.ObjectId, ref: "StudentProfile" },
    mergedAt: Date,
  },
  schemaOptions,
);
studentProfileSchema.index({ emails: 1 });
studentProfileSchema.index({ phones: 1 });
studentProfileSchema.index({ enquiryCount: -1, updatedAt: -1 });
const leadSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "ELIGIBILITY",
        "SCHOLARSHIP_ELIGIBILITY",
        "LENDER_ENQUIRY",
        "LOAN_WITH_COLLATERAL",
        "LOAN_WITHOUT_COLLATERAL",
        "CONTACT",
        "EXPERT",
        "REFERRAL",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "NEW",
        "CONTACTED",
        "IN_PROGRESS",
        "DOCUMENTS_PENDING",
        "APPLIED",
        "APPROVED",
        "REJECTED",
        "CLOSED",
      ],
      default: "NEW",
    },
    name: { type: String, required: true },
    email: String,
    phone: String,
    sourcePage: String,
    formData: { type: json, required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "VisitorSession" },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      index: true,
    },
    lenderId: { type: Schema.Types.ObjectId, ref: "Lender" },
    assignedToId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    followUpAt: Date,
    deletedAt: Date,
  },
  schemaOptions,
);
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ type: 1, createdAt: -1 });
leadSchema.index({ sessionId: 1, createdAt: -1 });
leadSchema.index({ lenderId: 1, createdAt: -1 });
leadSchema.index({ assignedToId: 1, createdAt: -1 });
leadSchema.index({ email: 1, sourcePage: 1, createdAt: -1 });
leadSchema.index({ phone: 1, sourcePage: 1, createdAt: -1 });
const leadNoteSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    body: { type: String, required: true },
  },
  schemaOptions,
);
const leadActivitySchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    action: { type: String, required: true },
    metadata: json,
  },
  schemaOptions,
);
leadNoteSchema.index({ leadId: 1, createdAt: -1 });
leadActivitySchema.index({ leadId: 1, createdAt: -1 });
const applicationSchema = new Schema(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    lenderId: {
      type: Schema.Types.ObjectId,
      ref: "Lender",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "IN_REVIEW",
        "DOCUMENTS_PENDING",
        "APPROVED",
        "REJECTED",
        "DISBURSED",
      ],
      default: "SUBMITTED",
    },
    history: [
      {
        status: { type: String, required: true },
        changedById: { type: Schema.Types.ObjectId, ref: "AdminUser" },
        note: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  schemaOptions,
);
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ lenderId: 1, createdAt: -1 });
const lenderSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    displayOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    archivedAt: Date,
    logoUrl: String,
    description: { type: String, maxlength: 500 },
    collateralAvailable: { type: Boolean, default: false },
    nonCollateralAvailable: { type: Boolean, default: false },
    loanType: String,
    lenderType: { type: String, enum: ["BANK", "NBFC", "INTERNATIONAL"] },
    collateral: String,
    country: String,
    securedRate: String,
    unsecuredRate: String,
    processingFee: String,
    maxLoan: String,
    tenure: String,
    eligibility: String,
    documents: String,
    applicationUrl: String,
    contactDetails: json,
    comparison: json,
    seoTitle: String,
    seoDescription: String,
  },
  schemaOptions,
);
lenderSchema.index({ published: 1, displayOrder: 1 });
const blogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: String,
    content: { type: String, required: true },
    author: String,
    category: { type: String, trim: true, maxlength: 80 },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    authorId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedById: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    categoryId: { type: Schema.Types.ObjectId, ref: "BlogCategory" },
    tagIds: [{ type: Schema.Types.ObjectId, ref: "BlogTag" }],
    coverImageUrl: String,
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"],
      default: "DRAFT",
    },
    featured: { type: Boolean, default: false },
    scheduledFor: Date,
    publishedAt: Date,
    seoTitle: String,
    seoDescription: String,
    canonicalUrl: String,
    deletedAt: Date,
  },
  schemaOptions,
);
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, publishedAt: -1 });
const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: String,
    metadata: json,
  },
  schemaOptions,
);
auditLogSchema.index({ entityType: 1, entityId: 1 });

function registeredModel(name: string, schema: Schema): Model<any> {
  const existing = models[name] as Model<any> | undefined;
  // During Fast Refresh Mongoose retains compiled models. Recompile a stale
  // model when schema fields change so strict populate remains safe.
  if (existing) {
    if (process.env.NODE_ENV === "development") {
      delete models[name];
      return model<any>(name, schema);
    }
    if (
      Object.keys(schema.paths).some(
        (path) => path !== "_id" && !existing.schema.path(path),
      )
    ) {
      delete models[name];
      return model<any>(name, schema);
    }
    return existing;
  }
  return model<any>(name, schema);
}

export const Role = registeredModel("Role", roleSchema);
export const AdminUser = registeredModel("AdminUser", adminUserSchema);
export const VisitorSession = registeredModel(
  "VisitorSession",
  visitorSessionSchema,
);
export const ConsentRecord = registeredModel(
  "ConsentRecord",
  consentRecordSchema,
);
export const PageView = registeredModel("PageView", pageViewSchema);
export const StudentProfile = registeredModel(
  "StudentProfile",
  studentProfileSchema,
);
export const Lead = registeredModel("Lead", leadSchema);
export const LeadNote = registeredModel("LeadNote", leadNoteSchema);
export const LeadActivity = registeredModel("LeadActivity", leadActivitySchema);
export const Application = registeredModel("Application", applicationSchema);
export const Lender = registeredModel("Lender", lenderSchema);
export const BlogPost = registeredModel("BlogPost", blogPostSchema);
export const AuditLog = registeredModel("AuditLog", auditLogSchema);
