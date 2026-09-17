import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { BlogPost } from "@/lib/models";

export default async function BlogPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  await connectToDatabase();
  const post = (await BlogPost.findOne({
    _id: (await params).id,
    deletedAt: null,
  }).lean()) as any;
  if (!post) notFound();
  return (
    <main className="cw-blog-page cw-blog-article">
      <p className="cw-blog-eyebrow">Admin preview · not public</p>
      <span className="cw-blog-meta">{post.category || "Guidance"}</span>
      <h1>{post.title}</h1>
      <p className="cw-blog-byline">By {post.author || "Credwisory team"}</p>
      {post.coverImageUrl ? (
        <div
          className="cw-blog-image cw-blog-cover"
          style={{ backgroundImage: `url("${post.coverImageUrl}")` }}
        />
      ) : null}
      <article
        className="cw-blog-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </main>
  );
}
