import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSetting } from "@/lib/models";
import { safeGoogleReviewLink } from "@/lib/google-review-embed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const [profileSetting, linkSetting] = await Promise.all([
      SiteSetting.findOne({ key: "googleBusinessProfileUrl" }).select("value").lean(),
      SiteSetting.findOne({ key: "googleReviewLink" }).select("value").lean(),
    ]) as [{ value?: string } | null, { value?: string } | null];
    return NextResponse.json(
      { googleBusinessProfileUrl: safeGoogleReviewLink(profileSetting?.value), googleReviewLink: safeGoogleReviewLink(linkSetting?.value) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ googleBusinessProfileUrl: null, googleReviewLink: null }, { status: 503 });
  }
}
