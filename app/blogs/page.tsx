import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { connectToDatabase } from "@/lib/mongodb";
import { BlogPost } from "@/lib/models";

export const dynamic = "force-dynamic";

type Search = { q?: string; category?: string; page?: string };
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const date = (value: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
const paramsFor = (params: Search) =>
  new URLSearchParams(
    Object.entries(params).filter(([, value]) => Boolean(value)) as [
      string,
      string,
    ][],
  ).toString();

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const page = Math.max(1, Number(search.page) || 1);
  const limit = 9;
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    status: "PUBLISHED",
    deletedAt: null,
    publishedAt: { $lte: new Date() },
  };
  if (search.category) filter.category = search.category;
  if (search.q?.trim())
    filter.$or = [
      { title: { $regex: escape(search.q.trim()), $options: "i" } },
      { excerpt: { $regex: escape(search.q.trim()), $options: "i" } },
    ];
  const [posts, total, categoryRows] = await Promise.all([
    BlogPost.find(filter)
      .sort({ featured: -1, publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(filter),
    BlogPost.distinct("category", {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { $lte: new Date() },
    }),
  ]);
  const featured =
    page === 1 && !search.q && !search.category
      ? posts.find((post) => post.featured) || posts[0]
      : null;
  const cards = featured
    ? posts.filter((post) => String(post._id) !== String(featured._id))
    : posts;
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <>
      <SiteHeader />
      <main className="cw-blog-page">
        <section className="cw-blog-hero">
          <p className="cw-blog-eyebrow">Credwisory resources</p>
          <h1>Clear guides for your education-loan journey.</h1>
          <p>
            Practical perspectives on lenders, applications, scholarships, and
            preparing for your next step.
          </p>
        </section>
        <form className="cw-blog-toolbar">
          <div className="cw-blog-search">
            <input
              name="q"
              defaultValue={search.q}
              placeholder="Search articles"
              aria-label="Search articles"
            />
            <button>Search</button>
          </div>
          <nav className="cw-blog-categories" aria-label="Blog categories">
            <Link
              href="/blogs"
              aria-current={!search.category ? "page" : undefined}
            >
              All articles
            </Link>
            {categoryRows.filter(Boolean).map((category) => (
              <Link
                key={category}
                href={`/blogs?${paramsFor({ category: String(category) })}`}
                aria-current={search.category === category ? "page" : undefined}
              >
                {String(category)}
              </Link>
            ))}
          </nav>
        </form>
        {featured ? (
          <article className="cw-blog-featured">
            <div
              className="cw-blog-image"
              style={
                featured.coverImageUrl
                  ? { backgroundImage: `url("${featured.coverImageUrl}")` }
                  : undefined
              }
            />
            <div className="cw-blog-featured-copy">
              <span className="cw-blog-meta">
                Featured · {featured.category || "Guidance"}
              </span>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <span className="cw-blog-meta">
                {date(featured.publishedAt || featured.createdAt)}
              </span>
              <p>
                <Link className="cw-blog-link" href={`/blogs/${featured.slug}`}>
                  Read article
                </Link>
              </p>
            </div>
          </article>
        ) : null}
        <section className="cw-blog-grid">
          {cards.map((post) => (
            <article className="cw-blog-card" key={String(post._id)}>
              <div
                className="cw-blog-image"
                style={
                  post.coverImageUrl
                    ? { backgroundImage: `url("${post.coverImageUrl}")` }
                    : undefined
                }
              />
              <div className="cw-blog-card-body">
                <span className="cw-blog-meta">
                  {post.category || "Guidance"}
                </span>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <span className="cw-blog-meta">
                  {date(post.publishedAt || post.createdAt)}
                </span>
                <Link className="cw-blog-link" href={`/blogs/${post.slug}`}>
                  Read article
                </Link>
              </div>
            </article>
          ))}
        </section>
        {!posts.length ? (
          <p className="cw-blog-empty">
            No published articles match your search yet.
          </p>
        ) : null}
        {pages > 1 ? (
          <nav className="cw-blog-pagination" aria-label="Blog pagination">
            {Array.from({ length: pages }, (_, index) => (
              <Link
                key={index}
                href={`/blogs?${paramsFor({ q: search.q, category: search.category, page: String(index + 1) })}`}
                aria-current={page === index + 1 ? "page" : undefined}
              >
                {index + 1}
              </Link>
            ))}
          </nav>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
