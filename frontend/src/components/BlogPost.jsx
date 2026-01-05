import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react'

function BlogPost({ slug, onBack }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/blog/posts/${slug}`)
      const data = await response.json()
      setPost(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching post:', error)
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

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

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Post not found
          </h2>
          <Button onClick={onBack} style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-6"
        style={{ color: 'var(--color-primary)' }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
      </Button>

      {/* Post Content */}
      <Card style={{ backgroundColor: 'var(--color-cardBg)', borderColor: 'var(--color-cardBorder)' }}>
        {post.featured_image && (
          <div className="w-full h-96 overflow-hidden rounded-t-lg">
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader>
          {/* Category Badge */}
          <div className="mb-4">
            <Badge className={getCategoryColor(post.category)}>
              {getCategoryLabel(post.category)}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm mb-6" style={{ color: 'var(--color-textSecondary)' }}>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.published_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <Tag className="h-4 w-4" style={{ color: 'var(--color-textSecondary)' }} />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Post Content */}
          <div 
            className="prose prose-lg max-w-none"
            style={{ color: 'var(--color-text)' }}
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
          />
        </CardContent>
      </Card>

      {/* Share Section (optional future enhancement) */}
      <div className="mt-8 text-center">
        <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          Last updated: {formatDate(post.updated_at)}
        </p>
      </div>
    </div>
  )
}

export default BlogPost
