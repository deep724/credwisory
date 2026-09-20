"use client";
/* eslint-disable react-hooks/immutability -- contentEditable button nodes are intentionally edited in place. */
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
  const imageInput = useRef<HTMLInputElement>(null);
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
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageMeta, setImageMeta] = useState<{ name: string; size?: number; width?: number; height?: number }>({ name: post?.coverImageUrl ? "Existing featured image" : "" });
  const [draggingImage, setDraggingImage] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [buttonDialog, setButtonDialog] = useState(false);
  const [buttonError, setButtonError] = useState("");
  const [editingButton, setEditingButton] = useState<HTMLAnchorElement | null>(null);
  const [buttonForm, setButtonForm] = useState({ text: "", url: "", target: "same", style: "primary", align: "left" });
  const [imageError, setImageError] = useState("");
  const [imageInfo, setImageInfo] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [dirty, setDirty] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(post?.tags || []);
  const plainContent = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  const wordCount = plainContent ? plainContent.split(/\s+/).length : 0;
  const charCount = plainContent.length;
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
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
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
  const command = (name: string, value?: string) => {
    editor.current?.focus();
    document.execCommand(name, false, value);
    setContent(editor.current?.innerHTML || "");
  };
  const cleanPastedHtml = (html: string) => {
    const documentFragment = new DOMParser().parseFromString(html, "text/html");
    documentFragment.querySelectorAll("script,style,meta,link,iframe,object").forEach((node) => node.remove());
    documentFragment.querySelectorAll<HTMLElement>("*").forEach((node) => [...node.attributes].forEach((attribute) => {
      if (attribute.name.startsWith("on") || attribute.name === "style" || (attribute.name === "href" && !/^https?:|^mailto:/i.test(attribute.value))) node.removeAttribute(attribute.name);
    }));
    return documentFragment.body.innerHTML;
  };
  const insertLink = () => { const url = window.prompt("Enter the link URL"); if (url && /^https?:\/\//i.test(url)) command("createLink", url); };
  const insertImage = () => { const url = window.prompt("Enter an HTTPS image URL"); if (url && /^https?:\/\//i.test(url)) command("insertImage", url); };
  const isSafeButtonUrl = (value: string) => value.startsWith("/") || /^https?:\/\//i.test(value);
  const openButtonDialog = (button?: HTMLAnchorElement) => {
    setEditingButton(button || null); setButtonError("");
    setButtonForm(button ? { text: button.textContent || "", url: button.getAttribute("href") || "", target: button.target === "_blank" ? "new" : "same", style: [...button.classList].find((item) => item.startsWith("cw-blog-button--"))?.replace("cw-blog-button--", "") || "primary", align: [...button.classList].find((item) => item.startsWith("cw-blog-button-align--"))?.replace("cw-blog-button-align--", "") || "left" } : { text: "", url: "", target: "same", style: "primary", align: "left" });
    setButtonDialog(true);
  };
  const saveButton = () => {
    const text = buttonForm.text.trim(), url = buttonForm.url.trim();
    if (!text) return setButtonError("Enter button text.");
    if (!isSafeButtonUrl(url)) return setButtonError("Use an HTTPS URL or an internal path starting with /.");
    const classes = `cw-blog-button cw-blog-button--${buttonForm.style} cw-blog-button-align--${buttonForm.align}`;
    if (editingButton) { editingButton.textContent = text; editingButton.href = url; editingButton.className = classes; editingButton.target = buttonForm.target === "new" ? "_blank" : ""; if (buttonForm.target === "new") editingButton.rel = "noopener noreferrer"; else editingButton.removeAttribute("rel"); editingButton.setAttribute("aria-label", text); }
    else { editor.current?.focus(); document.execCommand("insertHTML", false, `<a href="${url.replace(/&/g, "&amp;").replace(/\"/g, "&quot;")}" class="${classes}" data-blog-button="true" aria-label="${text.replace(/\"/g, "&quot;")}"${buttonForm.target === "new" ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text.replace(/</g, "&lt;")}</a>`); }
    setContent(editor.current?.innerHTML || ""); setDirty(true); setButtonDialog(false);
  };
  const addTag = () => { const value = tagInput.trim().replace(/,/g, ""); if (value && !tags.some((tag) => tag.toLowerCase() === value.toLowerCase()) && tags.length < 12) { setTags([...tags, value]); setDirty(true); } setTagInput(""); };
  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > BLOG_IMAGE_MAX_BYTES) {
      setUploadMessage(`Choose a JPG, PNG, or WebP image up to ${BLOG_IMAGE_MAX_LABEL}.`);
      return;
    }
    setImageError("");
    setImageMeta({ name: file.name, size: file.size });
    setImageInfo(`${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    setUploading(true);
    setUploadMessage("Uploading image…");
    const data = new FormData();
    data.set("image", file);
    const response = await fetch("/api/admin/blogs/upload", {
      method: "POST",
      body: data,
    });
    const result = await response.json().catch(() => ({}));
    setUploading(false);
    if (!response.ok || !result.url) {
      setUploadMessage(result.error || "Image upload failed.");
      return;
    }
    setCoverImageUrl(result.url);
    setDirty(true);
    setClientErrors((errors) => ({ ...errors, coverImageUrl: "" }));
    setUploadMessage("Image uploaded.");
  };
  return (
    <form ref={form} action={action} onSubmit={validateForm} noValidate className="cw-admin-blog-editor">
      <input type="hidden" name="id" value={post?._id || ""} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="tags" value={tags.join(", ")} />
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
          <span className={`cw-editor-save-state ${pending ? "is-saving" : dirty ? "is-unsaved" : ""}`} role="status">{pending ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}</span>
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
              placeholder="Write a clear, reader-first headline"
              maxLength={180}
              onChange={(event) => {
                if (!manualSlug) setSlug(slugify(event.target.value));
                setDirty(true);
                setClientErrors((errors) => ({ ...errors, title: "" }));
              }}
            />
            <small className="cw-editor-counter">Up to 180 characters</small>
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
                setDirty(true);
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
              onChange={(event) => { setDirty(true); setClientErrors((errors) => ({ ...errors, excerpt: "" })); }}
            />
            <small className="cw-editor-counter">Recommended: 120–160 characters</small>
            {errorFor("excerpt")}
          </label>
          <section className="cw-editor-image-manager" aria-labelledby="featured-image-heading">
          <div className="cw-editor-section-heading"><div><h2 id="featured-image-heading">Featured image</h2><p>Recommended size: 1200 × 630 px.</p></div><div className="cw-editor-image-tabs"><button type="button" className={imageMode === "upload" ? "is-active" : ""} onClick={() => setImageMode("upload")}>Upload from Computer</button><button type="button" className={imageMode === "url" ? "is-active" : ""} onClick={() => setImageMode("url")}>Use Image URL</button></div></div>
          {imageMode === "upload" ? <input type="hidden" name="coverImageUrl" value={coverImageUrl} /> : null}
          {imageMode === "url" ? <label>
            Image URL
            <input
              name="coverImageUrl"
              type="text"
              value={coverImageUrl}
              aria-describedby="featured-image-help"
              aria-invalid={Boolean(coverImageUrl && !isValidBlogImageValue(coverImageUrl))}
              onChange={(event) => { setCoverImageUrl(event.target.value); setImageError(""); setClientErrors((errors) => ({ ...errors, coverImageUrl: "" })); }}
              placeholder="https://…"
            />
          </label> : <label className={`cw-editor-upload ${draggingImage ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDraggingImage(true); }} onDragLeave={() => setDraggingImage(false)} onDrop={(event) => { event.preventDefault(); setDraggingImage(false); void uploadImage(event.dataTransfer.files?.[0]); }}>
            <span className="cw-editor-upload-icon" aria-hidden="true">↑</span><strong>{uploading ? "Uploading image…" : "Drop an image here or click to upload"}</strong>
            <small>JPG, PNG, or WEBP · maximum {BLOG_IMAGE_MAX_LABEL}</small>
            <input ref={imageInput}
              type="file"
              accept={BLOG_IMAGE_ACCEPT}
              onChange={(event) => void uploadImage(event.target.files?.[0])}
            />
          </label>}
          <p className="cw-admin-field-note" id="featured-image-help">
            Upload a JPG, PNG, or WebP image up to 5 MB, or use an approved
            image URL. {uploadMessage}
          </p>
          {coverImageUrl ? <div className="cw-admin-image-preview"><img src={coverImageUrl} alt="Featured image preview" onLoad={(event) => { const image = event.currentTarget; setImageInfo(`${imageInfo || "Image"} · ${image.naturalWidth} × ${image.naturalHeight}`); setImageError(""); }} onError={() => setImageError("This image could not be loaded. Replace it before saving.")} /><div><b>{imageInfo || "Featured image"}</b>{imageError ? <p className="cw-admin-error" role="alert">{imageError}</p> : null}<button type="button" className="cw-admin-reset" onClick={() => { setCoverImageUrl(""); setImageInfo(""); setImageError(""); }}>Remove image</button></div></div> : null}
          {coverImageUrl && !isValidBlogImageValue(coverImageUrl) ? <p className="cw-admin-error" role="alert">{validBlogImageMessage()}</p> : null}
          {errorFor("coverImageUrl")}
          </section>
          <div className="cw-admin-blog-split">
            <label>
              Category
              <input
                name="category"
                defaultValue={post?.category}
                placeholder="Search or enter a category"
                list="blog-category-options"
              />
              <datalist id="blog-category-options"><option value="Education loans" /><option value="Study abroad" /><option value="Scholarships" /><option value="Financial planning" /><option value="Student life" /></datalist>
            </label>
            <label>Tags<div className="cw-editor-tags">{tags.map((tag) => <button type="button" key={tag} onClick={() => setTags(tags.filter((item) => item !== tag))}>{tag} ×</button>)}<input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); } }} onBlur={addTag} placeholder="Type and press Enter" /></div></label>
          </div>
          <label>
            Content{required}
            <div
              className="cw-admin-rich-toolbar"
              role="toolbar"
              aria-label="Text formatting"
            >
              <button type="button" className="cw-editor-icon" title="Bold (Ctrl/Cmd+B)" aria-label="Bold" onClick={() => command("bold")}><b>B</b></button>
              <button type="button" className="cw-editor-icon" title="Italic (Ctrl/Cmd+I)" aria-label="Italic" onClick={() => command("italic")}><i>I</i></button>
              <button type="button" className="cw-editor-icon" title="Underline" aria-label="Underline" onClick={() => command("underline")}><u>U</u></button>
              <button type="button" className="cw-editor-icon" title="Strikethrough" aria-label="Strikethrough" onClick={() => command("strikeThrough")}><s>S</s></button>
              <select className="cw-editor-heading-select" title="Heading style" aria-label="Heading style" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)}><option value="p">P</option><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option></select>
              <button type="button" className="cw-editor-icon cw-editor-heading-legacy" title="Paragraph" aria-label="Paragraph" onClick={() => command("formatBlock", "p")}>P</button>
              <button type="button" className="cw-editor-heading-legacy" title="Heading 1" onClick={() => command("formatBlock", "h1")}>H1</button>
              <button type="button" className="cw-editor-heading-legacy" title="Heading 2" onClick={() => command("formatBlock", "h2")}>H2</button>
              <button type="button" className="cw-editor-heading-legacy" title="Heading 3" onClick={() => command("formatBlock", "h3")}>H3</button>
              <button
                type="button"
                onClick={() => command("insertUnorderedList")}
              >
                List
              </button>
              <button type="button" onClick={() => command("insertOrderedList")}>Numbered list</button>
              <button type="button" onClick={() => command("formatBlock", "blockquote")}>Quote</button>
              <button type="button" title="Align left" onClick={() => command("justifyLeft")}>Left</button><button type="button" title="Align center" onClick={() => command("justifyCenter")}>Center</button><button type="button" title="Align right" onClick={() => command("justifyRight")}>Right</button>
              <button type="button" title="Insert link (Ctrl/Cmd+K)" onClick={insertLink}>Link</button><button type="button" title="Insert Button" aria-label="Insert Button" onClick={() => openButtonDialog()}>↗</button><button type="button" title="Insert image" onClick={insertImage}>Image</button><button type="button" title="Code block" onClick={() => command("formatBlock", "pre")}>Code</button><button type="button" title="Horizontal divider" onClick={() => command("insertHorizontalRule")}>Divider</button><button type="button" title="Clear formatting" onClick={() => command("removeFormat")}>Clear</button>
              <button type="button" title="Undo" onClick={() => command("undo")}>Undo</button><button type="button" title="Redo" onClick={() => command("redo")}>Redo</button><button type="button" title="Focus writing mode" onClick={() => setFocusMode((value) => !value)}>{focusMode ? "Exit focus" : "Focus"}</button>
            </div>
            <div
              ref={editor}
              className={`cw-admin-rich-editor ${focusMode ? "is-focus-mode" : ""}`}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-invalid={Boolean(fieldErrors.content)}
              data-blog-content
              tabIndex={0}
              onInput={() => { setDirty(true); setContent(editor.current?.innerHTML || ""); setClientErrors((errors) => ({ ...errors, content: "" })); }}
              onPaste={(event) => { const html = event.clipboardData.getData("text/html"); if (html) { event.preventDefault(); document.execCommand("insertHTML", false, cleanPastedHtml(html)); setContent(editor.current?.innerHTML || ""); setDirty(true); } }}
              onKeyDown={(event) => { if (!(event.ctrlKey || event.metaKey)) return; const key = event.key.toLowerCase(); if (key === "k") { event.preventDefault(); insertLink(); } else if (key === "b") { event.preventDefault(); command("bold"); } else if (key === "i") { event.preventDefault(); command("italic"); } else if (key === "z") { event.preventDefault(); command(event.shiftKey ? "redo" : "undo"); } }}
              onClick={(event) => { const target = event.target as HTMLElement; const button = target.closest<HTMLAnchorElement>("a[data-blog-button='true']"); if (button) { event.preventDefault(); openButtonDialog(button); } }}
              data-placeholder="Start writing your blog content here…"
              dangerouslySetInnerHTML={{ __html: post?.content || "" }}
            />
            {errorFor("content")}
            <footer className="cw-editor-content-footer"><span>{wordCount} words</span><span>{charCount} characters</span><span>About {Math.max(1, Math.ceil(wordCount / 200))} min read</span><button type="button" title="Back to editor toolbar" onClick={() => document.querySelector<HTMLElement>(".cw-admin-rich-toolbar")?.scrollIntoView({ behavior: "smooth", block: "center" })}>↑ Toolbar</button></footer>
            <small className="cw-editor-counter">{content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length} words · about {Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length / 200))} min read</small>
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
            <small className="cw-editor-counter">Ideal: 50–60 characters</small>
          </label>
          <label>
            Meta description
            <textarea
              name="seoDescription"
              maxLength={320}
              defaultValue={post?.seoDescription}
            />
            <small className="cw-editor-counter">Ideal: 150–160 characters</small>
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
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </label>
        </aside>
      </div>
      {buttonDialog ? <div className="cw-editor-modal-backdrop" role="presentation"><section className="cw-editor-button-modal" role="dialog" aria-modal="true" aria-labelledby="button-modal-title"><header><h2 id="button-modal-title">{editingButton ? "Edit Button" : "Insert Button"}</h2><button type="button" aria-label="Close" onClick={() => setButtonDialog(false)}>×</button></header><label>Button Text<input autoFocus value={buttonForm.text} onChange={(event) => setButtonForm({ ...buttonForm, text: event.target.value })} /></label><label>Button URL<input value={buttonForm.url} placeholder="/apply or https://…" onChange={(event) => setButtonForm({ ...buttonForm, url: event.target.value })} /></label><label>Open link in<select value={buttonForm.target} onChange={(event) => setButtonForm({ ...buttonForm, target: event.target.value })}><option value="same">Same tab</option><option value="new">New tab</option></select></label><label>Button Style<select value={buttonForm.style} onChange={(event) => setButtonForm({ ...buttonForm, style: event.target.value })}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="outline">Outline</option></select></label><label>Button Alignment<select value={buttonForm.align} onChange={(event) => setButtonForm({ ...buttonForm, align: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>{buttonError ? <p className="cw-admin-error" role="alert">{buttonError}</p> : null}<footer>{editingButton ? <><button type="button" className="cw-admin-reset" onClick={() => { const copy = editingButton.cloneNode(true); editingButton.after(copy); setContent(editor.current?.innerHTML || ""); setDirty(true); setButtonDialog(false); }}>Duplicate Button</button><button type="button" className="cw-admin-danger" onClick={() => { if (window.confirm("Remove this button from the post?")) { editingButton.remove(); setContent(editor.current?.innerHTML || ""); setDirty(true); setButtonDialog(false); } }}>Remove Button</button></> : null}<button type="button" className="cw-admin-reset" onClick={() => setButtonDialog(false)}>Cancel</button><button type="button" className="cw-admin-primary" onClick={saveButton}>{editingButton ? "Save Button" : "Insert Button"}</button></footer></section></div> : null}
    </form>
  );
}
