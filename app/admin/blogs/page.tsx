import Link from "next/link";
import { archiveBlog, unpublishBlog } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { BlogDeleteAction } from "@/components/blog-delete-action";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { BlogPost } from "@/lib/models";

type Query = { q?: string; status?: string; category?: string; page?: string; success?: string };
const states = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export default async function Blogs({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const admin = await requireAdmin();
  await connectToDatabase();
  const search = await searchParams;
  const page = Math.max(1, Number(search.page) || 1);
  const limit = 10;
  const filter: Record<string, unknown> = { deletedAt: null };
  if (search.status && states.includes(search.status))
    filter.status = search.status;
  if (search.category) filter.category = search.category;
  if (search.q?.trim())
    filter.$or = [
      {
        title: {
          $regex: search.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      },
      {
        slug: {
          $regex: search.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      },
    ];
  const [posts, total, categories] = await Promise.all([
    BlogPost.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(filter),
    BlogPost.distinct("category", { deletedAt: null }),
  ]);
  const role = admin.roleId as unknown as { name?: string } | null;
  const pages = Math.max(1, Math.ceil(total / limit));
  const make = (next: Query) =>
    new URLSearchParams(
      Object.entries(next).filter(([, value]) => Boolean(value)) as [
        string,
        string,
      ][],
    ).toString();
  return (
    <AdminShell name={admin.name} role={role?.name || "Admin"}>
      <div className="cw-admin-page-heading">
        <div>
          <h1>Blogs</h1>
          <p className="cw-admin-kicker">
            Create, review, and publish Credwisory resources.
          </p>
        </div>
        <Link className="cw-admin-primary" href="/admin/blogs/new">
          Create new post
        </Link>
      </div>
      {search.success ? <div className="cw-admin-toast" role="status">{search.success}</div> : null}
      <form className="cw-admin-toolbar cw-admin-blog-toolbar">
        <label>
          Search
          <input name="q" defaultValue={search.q} placeholder="Title or slug" />
        </label>
        <label>
          Status
          <select name="status" defaultValue={search.status || ""}>
            <option value="">All statuses</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {label(state)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select name="category" defaultValue={search.category || ""}>
            <option value="">All categories</option>
            {categories.filter(Boolean).map((category) => (
              <option key={category} value={category}>
                {String(category)}
              </option>
            ))}
          </select>
        </label>
        <button className="cw-admin-primary">Apply filters</button>
        <Link className="cw-admin-reset" href="/admin/blogs">
          Reset filters
        </Link>
      </form>
      <section className="cw-admin-panel">
        <div className="cw-admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Author</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length ? (
                posts.map((post) => (
                  <tr key={String(post._id)}>
                    <td>
                      <strong>{post.title}</strong>
                      <br />
                      <small>/{post.slug}</small>
                    </td>
                    <td>{post.category || "—"}</td>
                    <td>
                      <span
                        className={`cw-admin-badge cw-status-${post.status.toLowerCase()}`}
                      >
                        {label(post.status)}
                      </span>
                    </td>
                    <td>{post.author || "Unknown"}</td>
                    <td>{post.updatedAt.toLocaleDateString()}</td>
                    <td className="cw-admin-blog-actions">
                      <Link href={`/admin/blogs/${post._id}`}>Edit</Link>
                      {post.status === "PUBLISHED" ? (
                        <>
                          <Link href={`/blogs/${post.slug}`} target="_blank">
                            View
                          </Link>
                          <form action={unpublishBlog}>
                            <input
                              type="hidden"
                              name="id"
                              value={String(post._id)}
                            />
                            <button>Unpublish</button>
                          </form>
                        </>
                      ) : null}
                      <Link
                        href={`/admin/blogs/${post._id}/preview`}
                        target="_blank"
                      >
                        Preview
                      </Link>
                      {post.status !== "ARCHIVED" ? (
                        <form action={archiveBlog}>
                          <input
                            type="hidden"
                            name="id"
                            value={String(post._id)}
                          />
                          <button>Archive</button>
                        </form>
                      ) : null}
                      <BlogDeleteAction
                        id={String(post._id)}
                        title={post.title}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="cw-admin-empty">
                    {search.q || search.status || search.category
                      ? "No blog posts match these filters."
                      : "No blog posts yet. Create your first draft to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {pages > 1 ? (
        <nav className="cw-admin-pagination" aria-label="Blog pagination">
          {Array.from({ length: pages }, (_, index) => (
            <Link
              key={index}
              href={`/admin/blogs?${make({ q: search.q, status: search.status, category: search.category, page: String(index + 1) })}`}
              aria-current={page === index + 1 ? "page" : undefined}
            >
              {index + 1}
            </Link>
          ))}
        </nav>
      ) : null}
    </AdminShell>
  );
}
