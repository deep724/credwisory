import { NextResponse } from "next/server";
import { parseLead } from "@/lib/api";
import { connectToDatabase, logDatabaseError } from "@/lib/mongodb";
import { Application, Lead, Lender, VisitorSession } from "@/lib/models";
import { attachLeadToStudentProfile } from "@/lib/student-profiles";
import { notifyAdminOfLead } from "@/lib/lead-notification";

export async function POST(request: Request) {
  const result = await parseLead(request);
  if ("error" in result) return result.error;
  try {
    const {
      website: _website,
      payload,
      kind,
      mobile,
      anonymousId,
      ...leadData
    } = result.data;
    const type =
      kind === "LENDER_ENQUIRY" ||
      kind === "SCHOLARSHIP_ELIGIBILITY" ||
      kind === "LOAN_WITH_COLLATERAL" ||
      kind === "LOAN_WITHOUT_COLLATERAL"
        ? kind
        : kind === "ELIGIBILITY"
          ? "ELIGIBILITY"
          : kind === "REFERRAL"
            ? "REFERRAL"
            : "CONTACT";
    await connectToDatabase();
    const session: { _id: unknown } | null = anonymousId
      ? ((await VisitorSession.findOne({ anonymousId, analyticsOk: true })
          .select("_id")
          .lean()) as { _id: unknown } | null)
      : null;
    const educationLoanPayload =
      type === "LENDER_ENQUIRY"
        ? {
            ...payload,
            loanPurpose: "education_loan",
            loanType: "Education Loan",
            employmentType: "not_collected",
          }
        : payload;
    const requestedSlug =
      typeof educationLoanPayload.lender === "string" ? educationLoanPayload.lender : "";
    const lender = requestedSlug
      ? ((await Lender.findOne({
          slug: requestedSlug,
          published: true,
          archivedAt: null,
        })
          .select("_id")
          .lean()) as unknown as { _id: unknown } | null)
      : null;
    // A lender application must be linked to a real, currently available lender.
    // Other lead types intentionally remain enquiries and never create Application records.
    if (type === "LENDER_ENQUIRY" && !lender?._id) {
      return NextResponse.json(
        {
          error:
            "Please select an available lender before submitting your application.",
        },
        { status: 400 },
      );
    }
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const contact = leadData.email
      ? { email: leadData.email.toLowerCase() }
      : mobile
        ? { phone: mobile }
        : null;
    const duplicate = contact
      ? ((await Lead.findOne({
          ...contact,
          type,
          sourcePage: leadData.sourcePage || null,
          createdAt: { $gte: cutoff },
          deletedAt: null,
        })
          .select("_id name email phone studentProfileId")
          .lean()) as unknown as {
          _id: unknown;
          name: string;
          email?: string;
          phone?: string;
          studentProfileId?: unknown;
        } | null)
      : null;
    if (duplicate) {
      if (type === "LENDER_ENQUIRY" && lender?._id) {
        await Application.findOneAndUpdate(
          { leadId: duplicate._id, lenderId: lender._id },
          {
            $setOnInsert: {
              leadId: duplicate._id,
              lenderId: lender._id,
              status: "SUBMITTED",
              history: [
                {
                  status: "SUBMITTED",
                  note: "Submitted from lender application form",
                },
              ],
            },
          },
          { upsert: true, new: true },
        );
      }
      if (!duplicate.studentProfileId) {
        try {
          await attachLeadToStudentProfile(duplicate);
        } catch (error) {
          logDatabaseError("lead profile recovery failed", error);
        }
      }
      return NextResponse.json({
        ok: true,
        id: String(duplicate._id),
        deduplicated: true,
      });
    }
    const lead = await Lead.create({
      ...leadData,
      email: leadData.email?.toLowerCase(),
      phone: mobile,
      type,
      status: "NEW",
      sessionId: session?._id,
      lenderId: lender?._id,
      formData: educationLoanPayload,
    });
    if (type === "LENDER_ENQUIRY" && lender?._id) {
      await Application.create({
        leadId: lead._id,
        lenderId: lender._id,
        status: "SUBMITTED",
        history: [
          {
            status: "SUBMITTED",
            note: "Submitted from lender application form",
          },
        ],
      });
    }
    let profileLinked = true;
    try {
      await attachLeadToStudentProfile(lead);
    } catch (error) {
      profileLinked = false;
      logDatabaseError("lead saved but profile link failed", error);
    }
    if (session)
      await VisitorSession.updateOne(
        { _id: session._id },
        { $set: { convertedAt: new Date() } },
      );
    try {
      await notifyAdminOfLead({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        type: lead.type,
        sourcePage: lead.sourcePage,
      });
    } catch {
      // The lead is already stored; mail delivery is retried by normal admin follow-up.
      console.error("[email] lead notification request failed");
    }
    return NextResponse.json(
      { ok: true, id: lead.id, profileLinked },
      { status: 201 },
    );
  } catch (error) {
    logDatabaseError("lead persistence failed", error);
    return NextResponse.json(
      { error: "We could not save your request. Please try again." },
      { status: 503 },
    );
  }
}
