import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/lib/blogApi";

export const revalidate = 300;

export async function generateStaticParams() {
  // Prebuild whatever is available at build time.
  try {
    const data = await getPublishedPosts({ page: 1, perPage: 200 });
    const posts = data?.posts ?? [];
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const slug = params?.slug;
  try {
    const post = await getPostBySlug(slug);
    const title = post?.title ? `${post.title} | TenantGuard` : "TenantGuard Blog";
    const description = post?.excerpt || (post?.content ? String(post.content).slice(0, 160) : "TenantGuard blog post.");
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `/blog/${slug}`,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "TenantGuard Blog",
      description: "TenantGuard blog post.",
    };
  }
}

export default async function BlogPostPage({ params }) {
  const slug = params?.slug;

  let post = null;
  try {
    post = await getPostBySlug(slug);
  } catch {
    post = null;
  }

  if (!post) return notFound();

  // Your API returns `content` (likely stored as rich text/HTML or markdown).
  // If it's HTML, render it as HTML. If it's markdown, convert it server-side later.
  const content = post.content || "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <a href="/blog" className="text-sm underline underline-offset-4">← Back to blog</a>

      <div className="mt-6">
        <div className="text-xs opacity-70">
          <span>{post.category}</span>
          <span> • </span>
          <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}</span>
          <span> • </span>
          <span>{post.author || ""}</span>
        </div>

        <h1 className="mt-2 text-3xl font-semibold">{post.title}</h1>

        {post.excerpt && (
          <p className="mt-3 text-base opacity-90">{post.excerpt}</p>
        )}

        <hr className="my-8 opacity-30" />

        <article
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </main>
  );
}
