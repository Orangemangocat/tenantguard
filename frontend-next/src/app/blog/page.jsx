import Link from "next/link";
import {
  getPublishedPosts,
  categoryLabel,
  categoryColor,
  formatDate,
  CATEGORY_LABELS,
} from "@/lib/blogApi";

export const revalidate = 300;

export const metadata = {
  title: "TenantGuard Blog - Tenant Rights & Eviction Defense",
  description:
    "Stay informed with the latest tenant rights news, legal insights, and eviction defense strategies from TenantGuard.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "TenantGuard Blog - Tenant Rights & Eviction Defense",
    description:
      "Stay informed with the latest tenant rights news, legal insights, and eviction defense strategies from TenantGuard.",
    url: "/blog",
    type: "website",
  },
};

/* ------------------------------------------------------------------ */
/*  Fallback placeholder when a post has no featured image             */
/* ------------------------------------------------------------------ */
const FALLBACK_IMAGE = "/tenantguard-shield.png";

function PostImage({ src, alt }) {
  return (
    <div className="blog-card-image">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || FALLBACK_IMAGE}
        alt={alt}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = FALLBACK_IMAGE;
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single blog card                                                   */
/* ------------------------------------------------------------------ */
function BlogCard({ post }) {
  const href = `/blog/${post.slug}`;
  const excerpt =
    post.excerpt ||
    (post.content ? String(post.content).replace(/<[^>]*>/g, "").slice(0, 160) + "…" : "");

  return (
    <Link href={href} className="blog-card">
      <PostImage src={post.featured_image} alt={post.title} />

      <div className="blog-card-body">
        {/* Category badge */}
        <span className={`blog-badge ${categoryColor(post.category)}`}>
          {categoryLabel(post.category)}
        </span>

        {/* Title */}
        <h2 className="blog-card-title">{post.title}</h2>

        {/* Excerpt */}
        <p className="blog-card-excerpt">{excerpt}</p>

        {/* Meta row */}
        <div className="blog-card-meta">
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
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default async function BlogIndexPage({ searchParams }) {
  const categoryFilter = searchParams?.category || "all";
  const pageNum = Math.max(1, Number(searchParams?.page) || 1);

  const data = await getPublishedPosts({
    page: pageNum,
    perPage: 12,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  });

  const posts = data?.posts ?? [];
  const totalPages = data?.pages ?? 1;

  /* Derive the unique categories present in the dataset for filter pills */
  const categoryKeys = Object.keys(CATEGORY_LABELS);

  return (
    <main className="blog-page">
      {/* ---- Header ---- */}
      <header className="blog-header">
        <h1 className="blog-page-title">TenantGuard Blog</h1>
        <p className="blog-page-subtitle">
          Tenant rights insights, legal strategies, and eviction defense resources
        </p>
      </header>

      {/* ---- Category filter pills ---- */}
      <nav className="blog-filters" aria-label="Filter by category">
        <Link
          href="/blog"
          className={`blog-filter-pill ${categoryFilter === "all" ? "active" : ""}`}
        >
          All
        </Link>
        {categoryKeys.map((key) => (
          <Link
            key={key}
            href={`/blog?category=${key}`}
            className={`blog-filter-pill ${categoryFilter === key ? "active" : ""}`}
          >
            {CATEGORY_LABELS[key]}
          </Link>
        ))}
      </nav>

      {/* ---- Post grid ---- */}
      {posts.length > 0 ? (
        <div className="blog-grid">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="blog-empty">
          <p>No posts found in this category.</p>
        </div>
      )}

      {/* ---- Pagination ---- */}
      {totalPages > 1 && (
        <nav className="blog-pagination" aria-label="Blog pagination">
          {pageNum > 1 && (
            <Link
              href={`/blog?page=${pageNum - 1}${categoryFilter !== "all" ? `&category=${categoryFilter}` : ""}`}
              className="blog-page-btn"
            >
              &larr; Previous
            </Link>
          )}

          <div className="blog-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/blog?page=${p}${categoryFilter !== "all" ? `&category=${categoryFilter}` : ""}`}
                className={`blog-page-num ${p === pageNum ? "active" : ""}`}
              >
                {p}
              </Link>
            ))}
          </div>

          {pageNum < totalPages && (
            <Link
              href={`/blog?page=${pageNum + 1}${categoryFilter !== "all" ? `&category=${categoryFilter}` : ""}`}
              className="blog-page-btn"
            >
              Next &rarr;
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
