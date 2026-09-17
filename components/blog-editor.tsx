"use client";
/* eslint-disable @next/next/no-img-element -- preview supports external and Blob image URLs. */

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBlog } from "@/app/admin/actions";
import { BLOG_IMAGE_ACCEPT, BLOG_IMAGE_MAX_BYTES, BLOG_IMAGE_MAX_LABEL, isValidBlogImageValue, validBlogImageMessage } from "@/lib/blog-images";

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
type FieldErrors = Record<string, string>;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
export function BlogEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
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
  const [imageError, setImageError] = useState("");
  const [imageInfo, setImageInfo] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const fieldErrors = useMemo<FieldErrors>(() => {
    const serverErrors = state && "fields" in state ? (state.fields as FieldErrors | undefined) || {} : {};
    return Object.fromEntries(Object.entries({ ...serverErrors, ...clientErrors }).filter(([, message]) => Boolean(message)));
  }, [state, clientErrors]);
  useEffect(() => {
    if (state?.ok)
      router.push(`/admin/blogs?success=${encodeURIComponent(post?._id ? "Blog post updated." : "Blog post created.")}`);
  }, [router, state, post?._id]);
  useEffect(() => {
    const first = Object.keys(fieldErrors)[0];
    if (!first) return;
    const control = first === "content" ? editor.current : form.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    control?.scrollIntoView({ behavior: "smooth", block: "center" });
    control?.focus();
  }, [fieldErrors]);
  const validateForm = (event: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget);
    const errors: FieldErrors = {};
    const title = String(data.get("title") || "").trim();
    const draftSlug = String(data.get("slug") || "").trim();
    const excerpt = String(data.get("excerpt") || "").trim();
    const textContent = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    if (title.length < 5) errors.title = "Enter a title of at least 5 characters.";
    else if (title.length > 180) errors.title = "Keep the title under 180 characters.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draftSlug)) errors.slug = "Use lowercase letters, numbers, and hyphens only.";
    else if (draftSlug.length > 180) errors.slug = "Keep the slug under 180 characters.";
    if (excerpt.length < 10) errors.excerpt = "Write an excerpt of at least 10 characters.";
    else if (excerpt.length > 400) errors.excerpt = "Keep the excerpt under 400 characters.";
    if (textContent.length < 20) errors.content = "Write blog content of at least 20 characters.";
    if (coverImageUrl && !isValidBlogImageValue(coverImageUrl)) errors.coverImageUrl = validBlogImageMessage();
    if (imageError) errors.coverImageUrl = imageError;
    setClientErrors(errors);
    if (Object.keys(errors).length) event.preventDefault();
  };
  const required = <span className="cw-admin-required" aria-hidden="true"> *</span>;
  const errorFor = (name: string) => fieldErrors[name] ? <p className="cw-admin-field-error" role="alert">{fieldErrors[name]}</p> : null;
  const command = (name: string) => {
    editor.current?.focus();
    document.execCommand(name);
    setContent(editor.current?.innerHTML || "");
  };
  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > BLOG_IMAGE_MAX_BYTES) {
      setUploadMessage(`Choose a JPG, PNG, or WebP image up to ${BLOG_IMAGE_MAX_LABEL}.`);
      return;
    }
    setImageError("");
    setImageInfo(file.name);
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
    setClientErrors((errors) => ({ ...errors, coverImageUrl: "" }));
    setUploadMessage("Image uploaded.");
  };
  return (
    <form ref={form} action={action} onSubmit={validateForm} noValidate className="cw-admin-blog-editor">
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
            disabled={pending || Boolean(imageError)}
          >
            Save draft
          </button>
          <button
            name="intent"
            value="publish"
            className="cw-admin-primary"
            disabled={pending || Boolean(imageError)}
          >
            {pending ? "Saving…" : "Publish"}
          </button>
        </div>
      </header>
      {Object.keys(fieldErrors).length ? (
        <p className="cw-admin-error" role="alert">
          Please complete the highlighted fields before publishing.
        </p>
      ) : state?.error ? (
        <p className="cw-admin-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="cw-admin-blog-editor-grid" aria-busy={pending}>
        <section>
          <label>
            Title{required}
            <input
              name="title"
              required
              aria-invalid={Boolean(fieldErrors.title)}
              defaultValue={post?.title}
              onChange={(event) => {
                if (!manualSlug) setSlug(slugify(event.target.value));
                setClientErrors((errors) => ({ ...errors, title: "" }));
              }}
            />
            {errorFor("title")}
          </label>
          <label>
            Slug{required}
            <input
              name="slug"
              required
              aria-invalid={Boolean(fieldErrors.slug)}
              value={slug}
              onChange={(event) => {
                setManualSlug(true);
                setSlug(slugify(event.target.value));
                setClientErrors((errors) => ({ ...errors, slug: "" }));
              }}
            />
            {errorFor("slug")}
          </label>
          <label>
            Excerpt{required}
            <textarea
              name="excerpt"
              aria-invalid={Boolean(fieldErrors.excerpt)}
              maxLength={400}
              defaultValue={post?.excerpt}
              placeholder="Short summary for article cards"
              onChange={() => setClientErrors((errors) => ({ ...errors, excerpt: "" }))}
            />
            {errorFor("excerpt")}
          </label>
          <label>
            Featured image URL or uploaded image path
            <input
              name="coverImageUrl"
              type="text"
              value={coverImageUrl}
              aria-describedby="featured-image-help"
              aria-invalid={Boolean(coverImageUrl && !isValidBlogImageValue(coverImageUrl))}
              onChange={(event) => { setCoverImageUrl(event.target.value); setImageError(""); setClientErrors((errors) => ({ ...errors, coverImageUrl: "" })); }}
              placeholder="https://…"
            />
          </label>
          <label>
            Upload featured image
            <input
              type="file"
              accept={BLOG_IMAGE_ACCEPT}
              onChange={(event) => void uploadImage(event.target.files?.[0])}
            />
          </label>
          <p className="cw-admin-field-note" id="featured-image-help">
            Upload a JPG, PNG, or WebP image up to 5 MB, or use an approved
            image URL. {uploadMessage}
          </p>
          {coverImageUrl ? <div className="cw-admin-image-preview"><img src={coverImageUrl} alt="Featured image preview" onLoad={(event) => { const image = event.currentTarget; setImageInfo(`${imageInfo || "Image"} · ${image.naturalWidth} × ${image.naturalHeight}`); setImageError(""); }} onError={() => setImageError("This image could not be loaded. Replace it before saving.")} /><div><b>{imageInfo || "Featured image"}</b>{imageError ? <p className="cw-admin-error" role="alert">{imageError}</p> : null}<button type="button" className="cw-admin-reset" onClick={() => { setCoverImageUrl(""); setImageInfo(""); setImageError(""); }}>Remove image</button></div></div> : null}
          {coverImageUrl && !isValidBlogImageValue(coverImageUrl) ? <p className="cw-admin-error" role="alert">{validBlogImageMessage()}</p> : null}
          {errorFor("coverImageUrl")}
          <div className="cw-admin-blog-split">
            <label>
              Category
              <input
                name="category"
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
            Content{required}
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
              aria-invalid={Boolean(fieldErrors.content)}
              data-blog-content
              tabIndex={0}
              onInput={() => { setContent(editor.current?.innerHTML || ""); setClientErrors((errors) => ({ ...errors, content: "" })); }}
              dangerouslySetInnerHTML={{ __html: post?.content || "" }}
            />
            {errorFor("content")}
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
