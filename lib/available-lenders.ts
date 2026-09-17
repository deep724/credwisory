import "server-only";
import { connectToDatabase } from "@/lib/mongodb";
import { Lender } from "@/lib/models";

export type AvailableLender = { name: string; slug: string; logoUrl?: string };

/** Only lenders a visitor can apply with are returned from this data boundary. */
export async function findAvailableLender(slug: string) {
  if (!slug || slug.length > 120) return null;
  await connectToDatabase();
  return (await Lender.findOne({ slug, published: true, archivedAt: null })
    .select("name slug logoUrl")
    .lean()) as AvailableLender | null;
}
