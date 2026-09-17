"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBlog } from "@/app/admin/actions";

type Post = {
  _id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  featured?: boolean;
  publishedAt?: string;
};
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
export function BlogEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const editor = useRef<HTMLDivElement>(null);
  const [slug, setSlug] = useState(post?.slug || "");
  const [manualSlug, setManualSlug] = useState(Boolean(post?.slug));
  const [state, action, pending] = useActionState(
    (
      _previous: Awaited<ReturnType<typeof saveBlog>> | null,
      formData: FormData,
    ) => saveBlog(formData),
    null,
  );
  const [content, setContent] = useState(post?.content || "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl || "");
  const [uploadMessage, setUploadMessage] = useState("");
  useEffect(() => {
    if (state?.ok)
      router.push(`/admin/blogs?success=${encodeURIComponent(post?._id ? "Blog post updated." : "Blog post created.")}`);
  }, [router, state, post?._id]);
  const command = (name: string) => {
    editor.current?.focus();
    document.execCommand(name);
    setContent(editor.current?.innerHTML || "");
  };
  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploadMessage("Uploading image…");
    const data = new FormData();
    data.set("image", file);
    const response = await fetch("/api/admin/blogs/upload", {
      method: "POST",
      body: data,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) {
      setUploadMessage(result.error || "Image upload failed.");
      return;
    }
    setCoverImageUrl(result.url);
    setUploadMessage("Image uploaded.");
  };
  return (
    <form action={action} className="cw-admin-blog-editor">
      <input type="hidden" name="id" value={post?._id || ""} />
      <input type="hidden" name="content" value={content} />
      <header>
        <div>
          {post?._id ? (
            <a
              className="cw-admin-reset"
              href={`/admin/blogs/${post._id}/preview`}
              target="_blank"
            >
              Preview
            </a>
          ) : null}
          <p className="cw-admin-eyebrow">{post ? "Edit post" : "New post"}</p>
          <h1>{post ? post.title : "Create a blog post"}</h1>
        </div>
        <div>
          <button
            name="intent"
            value="save-draft"
            className="cw-admin-reset"
            disabled={pending}
          >
            Save draft
          </button>
          <button
            name="intent"
            value="publish"
            className="cw-admin-primary"
            disabled={pending}
          >
            {pending ? "Saving…" : "Publish"}
          </button>
        </div>
      </header>
      {state?.error ? (
        <p className="cw-admin-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="cw-admin-blog-editor-grid" aria-busy={pending}>
        <section>
          <label>
            Title
            <input
              name="title"
              required
              defaultValue={post?.title}
              onChange={(event) => {
                if (!manualSlug) setSlug(slugify(event.target.value));
              }}
            />
          </label>
          <label>
            Slug
            <input
              name="slug"
              required
              value={slug}
              onChange={(event) => {
                setManualSlug(true);
                setSlug(slugify(event.target.value));
              }}
            />
          </label>
          <label>
            Excerpt
            <textarea
              name="excerpt"
              maxLength={400}
              defaultValue={post?.excerpt}
              placeholder="Short summary for article cards"
            />
          </label>
          <label>
            Featured image URL
            <input
              name="coverImageUrl"
              type="url"
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              placeholder="https://…"
            />
          </label>
          <label>
            Upload featured image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void uploadImage(event.target.files?.[0])}
            />
          </label>
          <p className="cw-admin-field-note">
            Upload a JPG, PNG, or WebP image up to 5 MB, or use an approved
            image URL. {uploadMessage}
          </p>
          <div className="cw-admin-blog-split">
            <label>
              Category
              <input
                name="category"
                required
                defaultValue={post?.category}
                placeholder="Education loans"
              />
            </label>
            <label>
              Tags
              <input
                name="tags"
                defaultValue={post?.tags?.join(", ")}
                placeholder="lenders, eligibility"
              />
            </label>
          </div>
          <label>
            Content
            <div
              className="cw-admin-rich-toolbar"
              role="toolbar"
              aria-label="Text formatting"
            >
              <button type="button" onClick={() => command("bold")}>
                Bold
              </button>
              <button type="button" onClick={() => command("italic")}>
                Italic
              </button>
              <button
                type="button"
                onClick={() => command("insertUnorderedList")}
              >
                List
              </button>
              <button type="button" onClick={() => command("formatBlock")}>
                Heading
              </button>
            </div>
            <div
              ref={editor}
              className="cw-admin-rich-editor"
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              onInput={() => setContent(editor.current?.innerHTML || "")}
              dangerouslySetInnerHTML={{ __html: post?.content || "" }}
            />
          </label>
        </section>
        <aside>
          <label>
            SEO title
            <input
              name="seoTitle"
              maxLength={180}
              defaultValue={post?.seoTitle}
            />
          </label>
          <label>
            Meta description
            <textarea
              name="seoDescription"
              maxLength={320}
              defaultValue={post?.seoDescription}
            />
          </label>
          <label>
            Publish date
            <input
              name="publishDate"
              type="datetime-local"
              defaultValue={post?.publishedAt?.slice(0, 16)}
            />
          </label>
          <label className="cw-admin-checkbox">
            <input
              name="featured"
              type="checkbox"
              value="true"
              defaultChecked={post?.featured}
            />{" "}
            Feature this article
          </label>
          <label>
            Status
            <select name="status" defaultValue={post?.status || "DRAFT"}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
        </aside>
      </div>
    </form>
  );
}
