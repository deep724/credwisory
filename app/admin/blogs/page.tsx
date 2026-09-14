/* eslint-disable @next/next/no-html-link-for-pages */
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { BlogPost } from "@/lib/models";

export default async function Blogs() {
  await requireAdmin(); await connectToDatabase();
  const posts = await BlogPost.find({ deletedAt: null }).sort({ updatedAt: -1 }).lean();
  return <main className="admin-shell"><a href="/admin">← Dashboard</a><h1>Blog management</h1><p>Draft, publish, schedule, SEO, category, tag, cover-image, and canonical URL fields are stored in MongoDB.</p><table><thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Updated</th></tr></thead><tbody>{posts.map((post) => <tr key={String(post._id)}><td>{post.title}</td><td>{post.slug}</td><td>{post.status}</td><td>{post.updatedAt.toLocaleString()}</td></tr>)}</tbody></table></main>;
}
