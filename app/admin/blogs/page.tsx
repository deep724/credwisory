import Link from "next/link";
import { archiveBlog, publishBlog, unpublishBlog } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { BlogDeleteAction } from "@/components/blog-delete-action";
import { AdminIconSubmitButton } from "@/components/admin-icon-submit-button";
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
          <ActionIcon name="create" />
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
                    <td className="cw-admin-blog-actions cw-admin-icon-actions">
                      <Link className="cw-admin-icon-action is-edit" href={`/admin/blogs/${post._id}`} aria-label={`Edit ${post.title}`} data-tooltip="Edit post" title="Edit post"><ActionIcon name="edit" /></Link>
                      {post.status === "PUBLISHED" ? (
                        <>
                          <Link className="cw-admin-icon-action is-preview" href={`/blogs/${post.slug}`} target="_blank" aria-label={`View ${post.title}`} data-tooltip="View live post" title="View live post"><ActionIcon name="external" /></Link>
                          <form action={unpublishBlog}>
                            <input
                              type="hidden"
                              name="id"
                              value={String(post._id)}
                            />
                            <AdminIconSubmitButton className="cw-admin-icon-action is-visibility" label={`Unpublish ${post.title}`} tooltip="Unpublish post" pendingLabel="Unpublishing"><ActionIcon name="unpublish" /></AdminIconSubmitButton>
                          </form>
                        </>
                      ) : post.status === "DRAFT" ? <form action={publishBlog}><input type="hidden" name="id" value={String(post._id)} /><AdminIconSubmitButton className="cw-admin-icon-action is-visibility" label={`Publish ${post.title}`} tooltip="Publish post" pendingLabel="Publishing"><ActionIcon name="publish" /></AdminIconSubmitButton></form> : null}
                      <Link
                        className="cw-admin-icon-action is-preview"
                        href={`/admin/blogs/${post._id}/preview`}
                        target="_blank"
                        aria-label={`Preview ${post.title}`}
                        data-tooltip="Preview post"
                        title="Preview post"
                      >
                        <ActionIcon name="preview" />
                      </Link>
                      {post.status !== "ARCHIVED" ? (
                        <form action={archiveBlog}>
                          <input
                            type="hidden"
                            name="id"
                            value={String(post._id)}
                          />
                          <AdminIconSubmitButton className="cw-admin-icon-action is-archive" label={`Archive ${post.title}`} tooltip="Archive post" pendingLabel="Archiving"><ActionIcon name="archive" /></AdminIconSubmitButton>
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

function ActionIcon({ name }: { name: "edit" | "archive" | "preview" | "external" | "unpublish" | "publish" | "create" }) {
  const paths = {
    edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m12.5 7.5 4 4" /></>,
    archive: <><path d="M4 8h16v12H4z" /><path d="M3 5h18v3H3zM10 12h4" /></>,
    preview: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
    unpublish: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a18.1 18.1 0 0 1-3.2 3.9M6.2 6.2A18.4 18.4 0 0 0 2.5 12S6 18 12 18c1.4 0 2.6-.3 3.7-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    publish: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /><path d="m17 5 1.5 1.5L21 3" /></>,
    create: <><path d="M12 5v14M5 12h14" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
