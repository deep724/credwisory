import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { BlogEditor } from "@/components/blog-editor";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { BlogPost } from "@/lib/models";
export default async function EditBlog({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  await connectToDatabase();
  const post = (await BlogPost.findOne({
    _id: (await params).id,
    deletedAt: null,
  }).lean()) as any;
  if (!post) notFound();
  const role = admin.roleId as unknown as { name?: string } | null;
  return (
    <AdminShell name={admin.name} role={role?.name || "Admin"}>
      <BlogEditor
        post={{
          _id: String(post._id),
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          tags: post.tags,
          coverImageUrl: post.coverImageUrl,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          status: post.status,
          featured: post.featured,
          publishedAt: post.publishedAt?.toISOString(),
        }}
      />
    </AdminShell>
  );
}
