import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Calendar, User, ArrowRight, Tag } from 'lucide-react'

function BlogList({ onPostClick }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 10,
        status: 'published'
      })
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/blog/posts?${params}`)
      const data = await response.json()
      
      setPosts(data.posts)
      setTotalPages(data.pages)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setLoading(false)
    }
  }, [selectedCategory, currentPage])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getCategoryLabel = (category) => {
    const labels = {
      'technical': 'Technical Update',
      'market-research': 'Market Research'
    }
    return labels[category] || category
  }

  const getCategoryColor = (category) => {
    const colors = {
      'technical': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'market-research': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          TenantGuard Blog
        </h1>
        <p className="text-xl" style={{ color: 'var(--color-textSecondary)' }}>
          Stay updated with our latest technical updates and market research
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => {
            setSelectedCategory('all')
            setCurrentPage(1)
          }}
          style={selectedCategory === 'all' ? { backgroundColor: 'var(--color-primary)', color: '#ffffff' } : {}}
        >
          All Posts
        </Button>
        <Button
          variant={selectedCategory === 'technical' ? 'default' : 'outline'}
          onClick={() => {
            setSelectedCategory('technical')
            setCurrentPage(1)
          }}
          style={selectedCategory === 'technical' ? { backgroundColor: 'var(--color-primary)', color: '#ffffff' } : {}}
        >
          Technical Updates
        </Button>
        <Button
          variant={selectedCategory === 'market-research' ? 'default' : 'outline'}
          onClick={() => {
            setSelectedCategory('market-research')
            setCurrentPage(1)
          }}
          style={selectedCategory === 'market-research' ? { backgroundColor: 'var(--color-primary)', color: '#ffffff' } : {}}
        >
          Market Research
        </Button>
      </div>

      {/* Blog Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl" style={{ color: 'var(--color-textSecondary)' }}>
            No posts found in this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onPostClick(post.slug)}
              style={{ backgroundColor: 'var(--color-cardBg)', borderColor: 'var(--color-cardBorder)' }}
            >
              {post.featured_image && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={post.featured_image} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getCategoryColor(post.category)}>
                    {getCategoryLabel(post.category)}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2" style={{ color: 'var(--color-text)' }}>
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3" style={{ color: 'var(--color-textSecondary)' }}>
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <Tag className="h-4 w-4" style={{ color: 'var(--color-textSecondary)' }} />
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  className="mt-4 w-full"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Read More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
                style={currentPage === page ? { backgroundColor: 'var(--color-primary)', color: '#ffffff' } : {}}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default BlogList
