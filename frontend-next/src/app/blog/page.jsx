import Link from "next/link";
import { getPublishedPosts } from "@/lib/blogApi";

export const revalidate = 300;

export const metadata = {
  title: "TenantGuard Blog",
  description: "TenantGuard blog articles and updates.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "TenantGuard Blog",
    description: "TenantGuard blog articles and updates.",
    url: "/blog",
    type: "website",
  },
};

export default async function BlogIndexPage() {
  const data = await getPublishedPosts({ page: 1, perPage: 50 });
  const posts = data?.posts ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Blog</h1>
      <p className="mt-2 text-sm opacity-80">
        Latest TenantGuard articles. (Server-rendered for SEO)
      </p>

      <div className="mt-8 grid gap-4">
        {posts.map((p) => (
          <article key={p.id} className="rounded-xl border p-5">
            <div className="flex items-center gap-2 text-xs opacity-70">
              <span>{p.category}</span>
              <span>•</span>
              <span>{p.published_at ? new Date(p.published_at).toLocaleDateString() : ""}</span>
            </div>

            <h2 className="mt-2 text-xl font-semibold">
              <Link href={`/blog/${p.slug}`} className="hover:underline">
                {p.title}
              </Link>
            </h2>

            <p className="mt-2 text-sm opacity-90">
              {p.excerpt || (p.content ? String(p.content).slice(0, 200) + "…" : "")}
            </p>

            <div className="mt-3">
              <Link href={`/blog/${p.slug}`} className="text-sm underline underline-offset-4">
                Read more
              </Link>
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <div className="rounded-xl border p-6 text-sm">
            No published posts found.
          </div>
        )}
      </div>
    </main>
  );
}
