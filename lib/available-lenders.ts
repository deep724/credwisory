import "server-only";
import { connectToDatabase } from "@/lib/mongodb";
import { Lender } from "@/lib/models";

export type AvailableLender = {
  name: string;
  slug: string;
  logoUrl?: string;
  lenderType?: "BANK" | "NBFC" | "INTERNATIONAL" | "OTHER";
  collateralAvailable?: boolean;
  nonCollateralAvailable?: boolean;
  securedRate?: string;
  unsecuredRate?: string;
  processingFee?: string;
  maxLoan?: string;
  tenure?: string;
  collateral?: string;
  description?: string;
  eligibility?: string;
  documents?: string;
  infoSections?: Record<string, string>;
  sectionTitles?: Record<string, string>;
  contentStatus?: "DRAFT" | "UNDER_REVIEW" | "VERIFIED" | "PUBLISHED";
  contentSources?: { title: string; url: string }[];
  contentVerifiedAt?: string;
  comparison?: Record<string, string>;
};

/** Only lenders a visitor can apply with are returned from this data boundary. */
export async function findAvailableLender(slug: string) {
  if (!slug || slug.length > 120) return null;
  await connectToDatabase();
  return (await Lender.findOne({ slug, published: true, archivedAt: null })
    .select("name slug logoUrl lenderType collateralAvailable nonCollateralAvailable securedRate unsecuredRate processingFee maxLoan tenure collateral description eligibility documents infoSections sectionTitles contentStatus contentSources contentVerifiedAt comparison")
    .lean()) as AvailableLender | null;
}
