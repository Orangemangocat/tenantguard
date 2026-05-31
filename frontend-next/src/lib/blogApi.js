/**
 * Blog API client for TenantGuard
 *
 * Fetches published blog posts from the Flask/Django backend.
 * The base URL is configurable via NEXT_PUBLIC_API_URL or falls
 * back to the production domain.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://tenantguard.net";

/**
 * Fetch a paginated list of published blog posts.
 *
 * @param {Object}  opts
 * @param {number}  [opts.page=1]
 * @param {number}  [opts.perPage=50]
 * @param {string}  [opts.category]   – optional category filter
 * @param {string}  [opts.status="published"]
 * @returns {Promise<{posts: Array, total: number, pages: number, current_page: number}>}
 */
export async function getPublishedPosts({
  page = 1,
  perPage = 50,
  category,
  status = "published",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    status,
  });

  if (category && category !== "all") {
    params.set("category", category);
  }

  const url = `${API_BASE}/api/blog/posts?${params}`;

  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    console.error(`Blog API error: ${res.status} ${res.statusText}`);
    return { posts: [], total: 0, pages: 0, current_page: page };
  }

  return res.json();
}

/**
 * Fetch a single blog post by its slug.
 *
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getPostBySlug(slug) {
  if (!slug) return null;

  const url = `${API_BASE}/api/blog/posts/${encodeURIComponent(slug)}`;

  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) return null;

  return res.json();
}

/**
 * Map raw category slugs to human-readable labels.
 */
export const CATEGORY_LABELS = {
  technical: "Technical",
  "market-research": "Market Research",
  legal: "Legal",
  "tenant-privacy": "Tenant Privacy",
  "short-term": "Short-Term Rentals",
  tenantguard: "TenantGuard",
  "tenant-liability": "Tenant Liability",
};

/**
 * Map category slugs to Tailwind colour classes for badges.
 */
export const CATEGORY_COLORS = {
  technical:
    "bg-blue-50 text-blue-700 ring-blue-600/20",
  "market-research":
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  legal:
    "bg-amber-50 text-amber-700 ring-amber-600/20",
  "tenant-privacy":
    "bg-violet-50 text-violet-700 ring-violet-600/20",
  "short-term":
    "bg-rose-50 text-rose-700 ring-rose-600/20",
  tenantguard:
    "bg-red-50 text-red-700 ring-red-600/20",
  "tenant-liability":
    "bg-orange-50 text-orange-700 ring-orange-600/20",
};

/**
 * Return a display-friendly label for a category slug.
 */
export function categoryLabel(slug) {
  return CATEGORY_LABELS[slug] || slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
}

/**
 * Return Tailwind classes for a category badge.
 */
export function categoryColor(slug) {
  return (
    CATEGORY_COLORS[slug] ||
    "bg-gray-50 text-gray-700 ring-gray-600/20"
  );
}

/**
 * Format a date string into a readable format.
 */
export function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
