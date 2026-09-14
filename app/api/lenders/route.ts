import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Lender } from "@/lib/models";

export async function GET() {
  try { await connectToDatabase(); return NextResponse.json(await Lender.find({ published: true, archivedAt: null }).sort({ displayOrder: 1 }).lean()); }
  catch { return NextResponse.json({ error: "Lenders are temporarily unavailable." }, { status: 503 }); }
}
