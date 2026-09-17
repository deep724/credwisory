import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BlogPost } from "@/lib/models";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  await connectToDatabase();
  const filter = {
    status: "PUBLISHED",
    deletedAt: null,
    publishedAt: { $lte: new Date() },
    ...(slug ? { slug } : {}),
  };
  const posts = await BlogPost.find(filter)
    .sort({ publishedAt: -1, _id: -1 })
    .select(
      "title slug excerpt coverImageUrl category tags author publishedAt createdAt featured",
    )
    .lean();
  return NextResponse.json(posts);
}
