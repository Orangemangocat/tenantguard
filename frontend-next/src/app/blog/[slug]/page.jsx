import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPostBySlug,
  getPublishedPosts,
  categoryLabel,
  categoryColor,
  formatDate,
} from "@/lib/blogApi";

export const revalidate = 300;

/* ------------------------------------------------------------------ */
/*  Markdown → HTML helpers                                            */
/* ------------------------------------------------------------------ */
const HTML_TAG_RE = /<\/?[a-z][^>]*>/i;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInlineMarkdown(value) {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  output = output.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return output;
}

function renderMarkdown(value) {
  const sections = String(value).split("```");
  const rendered = sections.map((section, index) => {
    if (index % 2 === 1) {
      const trimmed = section.replace(/^[^\n]*\n/, "");
      return `<pre><code>${escapeHtml(trimmed)}</code></pre>`;
    }

    const lines = section.split("\n");
    const output = [];
    let inUnorderedList = false;
    let inOrderedList = false;

    const closeLists = () => {
      if (inUnorderedList) { output.push("</ul>"); inUnorderedList = false; }
      if (inOrderedList) { output.push("</ol>"); inOrderedList = false; }
    };

    lines.forEach((line) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      const unorderedMatch = line.match(/^\s*[-*]\s+(.*)$/);
      const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);

      if (headingMatch) {
        closeLists();
        const level = headingMatch[1].length;
        output.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
        return;
      }
      if (unorderedMatch) {
        if (!inUnorderedList) { closeLists(); output.push("<ul>"); inUnorderedList = true; }
        output.push(`<li>${renderInlineMarkdown(unorderedMatch[1])}</li>`);
        return;
      }
      if (orderedMatch) {
        if (!inOrderedList) { closeLists(); output.push("<ol>"); inOrderedList = true; }
        output.push(`<li>${renderInlineMarkdown(orderedMatch[1])}</li>`);
        return;
      }
      if (!line.trim()) { closeLists(); return; }
      closeLists();
      output.push(`<p>${renderInlineMarkdown(line)}</p>`);
    });

    closeLists();
    return output.join("\n");
  });

  return rendered.join("\n");
}

function formatPostContent(content) {
  if (!content) return "";
  const value = String(content);
  if (HTML_TAG_RE.test(value)) return value;
  return renderMarkdown(value);
}

/* ------------------------------------------------------------------ */
/*  Static params for build-time generation                            */
/* ------------------------------------------------------------------ */
export async function generateStaticParams() {
  try {
    const data = await getPublishedPosts({ page: 1, perPage: 200 });
    return (data?.posts ?? []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Dynamic metadata                                                   */
/* ------------------------------------------------------------------ */
export async function generateMetadata({ params }) {
  const slug = params?.slug;
  try {
    const post = await getPostBySlug(slug);
    const title = post?.title ? `${post.title} | TenantGuard` : "TenantGuard Blog";
    const description =
      post?.excerpt || (post?.content ? String(post.content).replace(/<[^>]*>/g, "").slice(0, 160) : "TenantGuard blog post.");
    return {
      title,
      description,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: { title, description, url: `/blog/${slug}`, type: "article" },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: "TenantGuard Blog", description: "TenantGuard blog post." };
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
const FALLBACK_IMAGE = "/tenantguard-shield.png";

export default async function BlogPostPage({ params }) {
  const slug = params?.slug;

  let post = null;
  try { post = await getPostBySlug(slug); } catch { post = null; }
  if (!post) return notFound();

  const content = formatPostContent(post.content || "");

  return (
    <main className="blogpost-page">
      {/* Back link */}
      <div className="blogpost-back">
        <Link href="/blog">
          <span aria-hidden="true">&larr;</span> Back to Blog
        </Link>
      </div>

      <article className="blogpost-article">
        {/* Hero image */}
        {post.featured_image && (
          <div className="blogpost-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featured_image}
              alt={post.title}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
            />
          </div>
        )}

        {/* Meta bar */}
        <div className="blogpost-meta-bar">
          <span className={`blog-badge ${categoryColor(post.category)}`}>
            {categoryLabel(post.category)}
          </span>
          <time dateTime={post.published_at || post.created_at}>
            {formatDate(post.published_at || post.created_at)}
          </time>
          {post.author && (
            <>
              <span className="blog-meta-dot" />
              <span>{post.author}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="blogpost-title">{post.title}</h1>

        {/* Excerpt / lead */}
        {post.excerpt && <p className="blogpost-excerpt">{post.excerpt}</p>}

        {/* Divider */}
        <hr className="blogpost-divider" />

        {/* Body */}
        <div
          className="blogpost-content prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Tags */}
        {post.tags && (
          <div className="blogpost-tags">
            {String(post.tags)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag) => (
                <span key={tag} className="blogpost-tag">
                  {tag}
                </span>
              ))}
          </div>
        )}
      </article>
    </main>
  );
}
