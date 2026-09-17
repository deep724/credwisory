import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { connectToDatabase } from "@/lib/mongodb";
import { BlogPost } from "@/lib/models";
import sanitizeHtml from "sanitize-html";

export const dynamic = "force-dynamic";

const date = (value: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
const words = (content: string) =>
  Math.max(
    1,
    Math.ceil(
      content
        .replace(/<[^>]*>/g, " ")
        .trim()
        .split(/\s+/).length / 200,
    ),
  );
const safePublicContent = (content: string) => sanitizeHtml(content, { allowedTags: ["p", "br", "strong", "em", "u", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img"], allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] }, allowedSchemes: ["http", "https"] });
async function publishedPost(slug: string): Promise<any> {
  await connectToDatabase();
  return (await BlogPost.findOne({
    slug,
    status: "PUBLISHED",
    deletedAt: null,
    publishedAt: { $lte: new Date() },
  }).lean()) as any;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = await publishedPost((await params).slug);
  return post
    ? {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        alternates: { canonical: `/blogs/${post.slug}` },
      }
    : {};
}
export default async function BlogArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await publishedPost((await params).slug);
  if (!post) notFound();
  const related = await BlogPost.find({
    _id: { $ne: post._id },
    status: "PUBLISHED",
    deletedAt: null,
    publishedAt: { $lte: new Date() },
    ...(post.category ? { category: post.category } : {}),
  })
    .sort({ publishedAt: -1, _id: -1 })
    .limit(3)
    .lean();
  return (
    <>
      <SiteHeader />
      <main className="cw-blog-page cw-blog-article">
        <nav className="cw-blog-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link> / <Link href="/blogs">Blogs</Link> /{" "}
          {post.category || "Article"}
        </nav>
        <span className="cw-blog-meta">{post.category || "Guidance"}</span>
        {post.tags?.length ? <p className="cw-blog-tags">{post.tags.join(" · ")}</p> : null}
        <h1>{post.title}</h1>
        <p className="cw-blog-byline">
          By {post.author || "Credwisory team"} ·{" "}
          {date(post.publishedAt || post.createdAt)} · {words(post.content)} min
          read
        </p>
        <div
          className="cw-blog-image cw-blog-cover"
          style={
            post.coverImageUrl
              ? { backgroundImage: `url("${post.coverImageUrl}")` }
              : undefined
          }
        />
        <article
          className="cw-blog-content"
          dangerouslySetInnerHTML={{ __html: safePublicContent(post.content) }}
        />
        <section className="cw-blog-article-cta">
          <div>
            <h2>Ready to explore your options?</h2>
            <p>Start with a clear view of your education-loan eligibility.</p>
          </div>
          <Link className="cw-blog-cta" href="/eligibility">
            Check eligibility
          </Link>
        </section>
        {related.length ? (
          <section className="cw-blog-related">
            <h2>Related articles</h2>
            <div className="cw-blog-grid">
              {related.map((item) => (
                <article className="cw-blog-card" key={String(item._id)}>
                  <div className="cw-blog-card-body">
                    <span className="cw-blog-meta">
                      {item.category || "Guidance"}
                    </span>
                    <h2>{item.title}</h2>
                    <p>{item.excerpt}</p>
                    <Link className="cw-blog-link" href={`/blogs/${item.slug}`}>
                      Read article
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
