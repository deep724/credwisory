import type { Metadata } from "next";
import { LenderApplicationPage } from "@/components/lender-application-page";
import { findAvailableLender } from "@/lib/available-lenders";

type Props = { searchParams: Promise<{ lender?: string | string[] }> };
export const metadata: Metadata = { title: "Apply for an education loan", alternates: { canonical: "/apply" } };

export default async function ApplyPage({ searchParams }: Props) {
  const value = (await searchParams).lender;
  return <LenderApplicationPage lender={await findAvailableLender(typeof value === "string" ? value : "")} />;
}
