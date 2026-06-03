import Link from 'next/link'
import { FileText, Calendar } from 'lucide-react'
import { fixMediaUrl } from '@/lib/api'

interface SidebarPost {
  id: number
  title: string
  slug: string
  excerpt: string
  featured_image: string | null
  created_at: string
}

interface RecentPostsSidebarProps {
  posts: SidebarPost[]
  currentSlug?: string
}

export default function RecentPostsSidebar({ posts, currentSlug }: RecentPostsSidebarProps) {
  const recent = posts.filter((p) => p.slug !== currentSlug).slice(0, 5)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
        <h3 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
          Recent Posts
        </h3>
        <div className="space-y-5">
          {recent.map((post) => {
            const blurb = post.excerpt
              ? post.excerpt.slice(0, 200)
              : null

            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex gap-3 items-start"
              >
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {post.featured_image ? (
                    <img
                      src={fixMediaUrl(post.featured_image)!}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
                    {post.title}
                  </h4>
                  {blurb && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1">
                      {blurb}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </Link>
            )
          })}

          {recent.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No recent posts.</p>
          )}
        </div>
      </div>
    </aside>
  )
}
