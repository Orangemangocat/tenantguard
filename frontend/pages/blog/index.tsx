import React, { useState } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, ArrowRight, Tag, Search, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { getPosts, getCategories, fixMediaUrl } from '@/lib/api'

interface Post {
  id: number
  title: string
  slug: string
  author: string
  category: { id: number, name: string, slug: string } | null
  featured_image: string | null
  excerpt: string
  created_at: string
  tags: string[]
}

interface BlogIndexProps {
  posts: Post[]
  categories: any[]
}

export default function BlogIndex({ posts: initialPosts, categories }: BlogIndexProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const filteredPosts = await getPosts(searchTerm)
    setPosts(filteredPosts)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenantguard.net'
  const pageUrl = `${siteUrl}/blog`
  const ogImage = `${siteUrl}/assets/logo.png`

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>TenantGuard Blog - Tenant Rights & Eviction Defense</title>
        <meta name="description" content="Expert articles on Tennessee tenant rights, eviction defense, and landlord-tenant law. Stay informed with TenantGuard's legal research and updates." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TenantGuard" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content="TenantGuard Blog - Tenant Rights & Eviction Defense" />
        <meta property="og:description" content="Expert articles on Tennessee tenant rights, eviction defense, and landlord-tenant law." />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TenantGuard Blog - Tenant Rights & Eviction Defense" />
        <meta name="twitter:description" content="Expert articles on Tennessee tenant rights, eviction defense, and landlord-tenant law." />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            TenantGuard Blog
          </h1>
          <p className="text-xl text-gray-600">
            Stay updated with our latest technical updates and market research
          </p>
        </div>

        {/* Search & Categories */}
        <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>

          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/blog'}>
              All
            </Button>
            {categories.map((cat) => (
              <Button key={cat.id} variant="outline" size="sm" onClick={async () => {
                const filtered = await getPosts(cat.name)
                setPosts(filtered)
              }}>
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-none shadow-soft overflow-hidden group-hover:-translate-y-1">
                    <div className="aspect-video relative overflow-hidden bg-gray-100">
                      {post.featured_image ? (
                        <img
                          src={fixMediaUrl(post.featured_image)!}
                          alt={post.title}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <FileText className="h-12 w-12 text-primary/20" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-3">
                        {post.category && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 mt-2">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>{post.author}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">No posts found matching your search.</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-3">© 2026 TenantGuard. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const [posts, categories] = await Promise.all([
      getPosts(),
      getCategories()
    ])
    return {
      props: {
        posts,
        categories
      }
    }
  } catch (error) {
    console.error('Error fetching blog data:', error)
    return {
      props: {
        posts: [],
        categories: []
      }
    }
  }
}
