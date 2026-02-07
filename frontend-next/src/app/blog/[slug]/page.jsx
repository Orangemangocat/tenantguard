import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/lib/blogApi";
import Link from "next/link";

export const revalidate = 300;

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
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
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
      if (inUnorderedList) {
        output.push("</ul>");
        inUnorderedList = false;
      }
      if (inOrderedList) {
        output.push("</ol>");
        inOrderedList = false;
      }
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
        if (!inUnorderedList) {
          closeLists();
          output.push("<ul>");
          inUnorderedList = true;
        }
        output.push(`<li>${renderInlineMarkdown(unorderedMatch[1])}</li>`);
        return;
      }

      if (orderedMatch) {
        if (!inOrderedList) {
          closeLists();
          output.push("<ol>");
          inOrderedList = true;
        }
        output.push(`<li>${renderInlineMarkdown(orderedMatch[1])}</li>`);
        return;
      }

      if (!line.trim()) {
        closeLists();
        return;
      }

      closeLists();
      output.push(`<p>${renderInlineMarkdown(line)}</p>`);
    });

    closeLists();
    return output.join("\n");
  });

  return rendered.join("\n");
}

function formatPostContent(content) {
  if (!content) {
    return "";
  }
  const value = String(content);
  if (HTML_TAG_RE.test(value)) {
    return value;
  }
  return renderMarkdown(value);
}

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
      alternates: {
        canonical: `/blog/${slug}`,
      },
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

  const content = formatPostContent(post.content || "");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/blog" className="text-sm underline underline-offset-4">← Back to blog</Link>

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
          className="prose max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </main>
  );
}
