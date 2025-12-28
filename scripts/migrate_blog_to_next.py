#!/usr/bin/env python3

import os
import shutil
import subprocess
from pathlib import Path

REVALIDATE_SECONDS = 300  # ISR interval (5 minutes)
NEXT_DIR_NAME = "frontend-next"


def run(cmd, cwd=None):
    print(f"\n$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True)


def ensure_next_app(repo_root: Path, next_dir: Path):
    if next_dir.exists() and (next_dir / "package.json").exists():
        print(f"[OK] Next.js app already exists at: {next_dir}")
        return

    print(f"[INFO] Creating Next.js app at: {next_dir}")
    # Create Next.js app (App Router + Tailwind + ESLint + src dir)
    run(
        [
            "npx",
            "create-next-app@latest",
            NEXT_DIR_NAME,
            "--js",
            "--app",
            "--eslint",
            "--tailwind",
            "--src-dir",
            "--import-alias",
            "@/*",
            "--no-turbo",
            "--use-pnpm",
        ],
        cwd=repo_root,
    )


def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"[WRITE] {path}")


def copy_tree(src: Path, dst: Path):
    if not src.exists():
        print(f"[SKIP] Missing: {src}")
        return
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    print(f"[COPY] {src} -> {dst}")


def copy_file(src: Path, dst: Path):
    if not src.exists():
        print(f"[SKIP] Missing: {src}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    print(f"[COPY] {src} -> {dst}")


def main():
    repo_root = Path(__file__).resolve().parents[1]  # .../tenantguard
    frontend_vite = repo_root / "frontend"
    backend_src = repo_root / "src"
    next_dir = repo_root / NEXT_DIR_NAME

    # Basic sanity checks
    if not frontend_vite.exists():
        raise SystemExit(f"Could not find Vite frontend at: {frontend_vite}")
    if not backend_src.exists():
        raise SystemExit(f"Could not find backend src at: {backend_src}")

    ensure_next_app(repo_root, next_dir)

    # 1) next.config.js: rewrite /api/* -> http://localhost:5000/api/*
    next_config_js = """\
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
"""
    write_file(next_dir / "next.config.js", next_config_js)

    # 2) .env.local for server-side fetch base URL (optional; rewrite also works)
    env_local = "API_BASE_URL=http://localhost:5000\nNEXT_PUBLIC_API_BASE_URL=http://localhost:5000\n"
    write_file(next_dir / ".env.local", env_local)

    # 3) Copy shadcn UI components and utils
    copy_tree(
        frontend_vite / "src" / "components" / "ui",
        next_dir / "src" / "components" / "ui",
    )
    copy_file(
        frontend_vite / "src" / "lib" / "utils.js",
        next_dir / "src" / "lib" / "utils.js",
    )

    # 4) Merge theme CSS into Next globals.css
    theme_css = ""
    theme_path = frontend_vite / "src" / "theme.css"
    if theme_path.exists():
        theme_css = theme_path.read_text(encoding="utf-8")

    globals_css_path = next_dir / "src" / "app" / "globals.css"
    existing_globals = (
        globals_css_path.read_text(encoding="utf-8")
        if globals_css_path.exists()
        else ""
    )
    if theme_css and theme_css.strip() not in existing_globals:
        combined = (
            existing_globals.rstrip()
            + "\n\n/* --- Copied from Vite theme.css --- */\n"
            + theme_css.strip()
            + "\n"
        )
        write_file(globals_css_path, combined)
    else:
        print("[OK] globals.css already contains theme.css or theme.css missing")

    # 5) Add a small server-safe blog API client
    blog_api_js = """\
const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

/**
 * Fetch JSON helper with sane defaults.
 */
async function fetchJson(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      ...(init.headers || {}),
    },
    // Important for Next server components:
    // Let Next cache according to revalidate settings on the page.
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}) ${url}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export async function getPublishedPosts({ page = 1, perPage = 20 } = {}) {
  const url = `${API_BASE_URL}/api/blog/posts?status=published&page=${page}&per_page=${perPage}`;
  return fetchJson(url);
}

export async function getPostBySlug(slug) {
  const url = `${API_BASE_URL}/api/blog/posts/${encodeURIComponent(slug)}`;
  return fetchJson(url);
}
"""
    write_file(next_dir / "src" / "lib" / "blogApi.js", blog_api_js)

    # 6) Create the blog index route: /blog
    blog_index_page = f"""\
import Link from "next/link";
import {{ getPublishedPosts }} from "@/lib/blogApi";

export const revalidate = {REVALIDATE_SECONDS};

export const metadata = {{
  title: "TenantGuard Blog",
  description: "TenantGuard blog articles and updates.",
}};

export default async function BlogIndexPage() {{
  const data = await getPublishedPosts({{ page: 1, perPage: 50 }});
  const posts = data?.posts ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Blog</h1>
      <p className="mt-2 text-sm opacity-80">
        Latest TenantGuard articles. (Server-rendered for SEO)
      </p>

      <div className="mt-8 grid gap-4">
        {{posts.map((p) => (
          <article key={{p.id}} className="rounded-xl border p-5">
            <div className="flex items-center gap-2 text-xs opacity-70">
              <span>{{p.category}}</span>
              <span>•</span>
              <span>{{p.published_at ? new Date(p.published_at).toLocaleDateString() : ""}}</span>
            </div>

            <h2 className="mt-2 text-xl font-semibold">
              <Link href={{`/blog/${{p.slug}}`}} className="hover:underline">
                {{p.title}}
              </Link>
            </h2>

            <p className="mt-2 text-sm opacity-90">
              {{p.excerpt || (p.content ? String(p.content).slice(0, 200) + "…" : "")}}
            </p>

            <div className="mt-3">
              <Link href={{`/blog/${{p.slug}}`}} className="text-sm underline underline-offset-4">
                Read more
              </Link>
            </div>
          </article>
        ))}}

        {{posts.length === 0 && (
          <div className="rounded-xl border p-6 text-sm">
            No published posts found.
          </div>
        )}}
      </div>
    </main>
  );
}}
"""
    write_file(next_dir / "src" / "app" / "blog" / "page.jsx", blog_index_page)

    # 7) Create the blog post route: /blog/[slug]
    blog_slug_page = f"""\
import {{ notFound }} from "next/navigation";
import {{ getPostBySlug, getPublishedPosts }} from "@/lib/blogApi";

export const revalidate = {REVALIDATE_SECONDS};

export async function generateStaticParams() {{
  // Prebuild whatever is available at build time.
  try {{
    const data = await getPublishedPosts({{ page: 1, perPage: 200 }});
    const posts = data?.posts ?? [];
    return posts.map((p) => ({{ slug: p.slug }}));
  }} catch {{
    return [];
  }}
}}

export async function generateMetadata({{ params }}) {{
  const slug = params?.slug;
  try {{
    const post = await getPostBySlug(slug);
    const title = post?.title ? `${{post.title}} | TenantGuard` : "TenantGuard Blog";
    const description = post?.excerpt || (post?.content ? String(post.content).slice(0, 160) : "TenantGuard blog post.");
    return {{
      title,
      description,
      openGraph: {{
        title,
        description,
        url: `/blog/${{slug}}`,
        type: "article",
      }},
      twitter: {{
        card: "summary_large_image",
        title,
        description,
      }},
    }};
  }} catch {{
    return {{
      title: "TenantGuard Blog",
      description: "TenantGuard blog post.",
    }};
  }}
}}

export default async function BlogPostPage({{ params }}) {{
  const slug = params?.slug;

  let post = null;
  try {{
    post = await getPostBySlug(slug);
  }} catch {{
    post = null;
  }}

  if (!post) return notFound();

  // Your API returns `content` (likely stored as rich text/HTML or markdown).
  // If it's HTML, render it as HTML. If it's markdown, convert it server-side later.
  const content = post.content || "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <a href="/blog" className="text-sm underline underline-offset-4">← Back to blog</a>

      <div className="mt-6">
        <div className="text-xs opacity-70">
          <span>{{post.category}}</span>
          <span> • </span>
          <span>{{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}}</span>
          <span> • </span>
          <span>{{post.author || ""}}</span>
        </div>

        <h1 className="mt-2 text-3xl font-semibold">{{post.title}}</h1>

        {{post.excerpt && (
          <p className="mt-3 text-base opacity-90">{{post.excerpt}}</p>
        )}}

        <hr className="my-8 opacity-30" />

        <article
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{{{ __html: content }}}}
        />
      </div>
    </main>
  );
}}
"""
    write_file(
        next_dir / "src" / "app" / "blog" / "[slug]" / "page.jsx", blog_slug_page
    )

    # 8) Ensure prose styling works (Tailwind typography is optional; we can add it)
    # We'll just add the dependency note; install step below.
    print(
        "\n[NOTE] If you want nice blog typography, install @tailwindcss/typography and enable it."
    )

    print("\n[DONE] Next.js blog scaffold created.")
    print("Next steps:")
    print(f"  1) cd {next_dir}")
    print("  2) pnpm install")
    print("  3) pnpm add @tailwindcss/typography   (optional but recommended)")
    print("  4) Start Flask on :5000, then pnpm dev (Next on :3000)")
    print(
        "  5) Visit http://localhost:3000/blog and view-source on a post page to confirm full HTML."
    )


if __name__ == "__main__":
    main()
