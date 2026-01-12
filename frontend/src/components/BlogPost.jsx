import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react'
import blogFallbackImage from '../assets/tenantguard-shield.png'

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
    if (!dateString) {
      return ''
    }
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
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

  const resolveFeaturedImage = (postData) => postData.featured_image || blogFallbackImage

  const escapeHtml = (value) => (
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  )

  const renderInlineMarkdown = (value) => {
    let output = escapeHtml(value)
    output = output.replace(/`([^`]+)`/g, '<code>$1</code>')
    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    output = output.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    return output
  }

  const renderMarkdown = (value) => {
    const sections = value.split('```')
    const rendered = sections.map((section, index) => {
      if (index % 2 === 1) {
        const trimmed = section.replace(/^[^\n]*\n/, '')
        return `<pre><code>${escapeHtml(trimmed)}</code></pre>`
      }

      const lines = section.split('\n')
      const output = []
      let inUnorderedList = false
      let inOrderedList = false

      const closeLists = () => {
        if (inUnorderedList) {
          output.push('</ul>')
          inUnorderedList = false
        }
        if (inOrderedList) {
          output.push('</ol>')
          inOrderedList = false
        }
      }

      lines.forEach((line) => {
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
        const unorderedMatch = line.match(/^\s*[-*]\s+(.*)$/)
        const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/)

        if (headingMatch) {
          closeLists()
          const level = headingMatch[1].length
          output.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`)
          return
        }

        if (unorderedMatch) {
          if (!inUnorderedList) {
            closeLists()
            output.push('<ul>')
            inUnorderedList = true
          }
          output.push(`<li>${renderInlineMarkdown(unorderedMatch[1])}</li>`)
          return
        }

        if (orderedMatch) {
          if (!inOrderedList) {
            closeLists()
            output.push('<ol>')
            inOrderedList = true
          }
          output.push(`<li>${renderInlineMarkdown(orderedMatch[1])}</li>`)
          return
        }

        if (!line.trim()) {
          closeLists()
          return
        }

        closeLists()
        output.push(`<p>${renderInlineMarkdown(line)}</p>`)
      })

      closeLists()
      return output.join('\n')
    })

    return rendered.join('\n')
  }

  const formatContent = (content) => {
    if (!content) {
      return ''
    }
    if (content.includes('<')) {
      return content
    }
    return renderMarkdown(content)
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
        <div className="w-full h-96 overflow-hidden rounded-t-lg">
          <img 
            src={resolveFeaturedImage(post)} 
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = blogFallbackImage
            }}
          />
        </div>
        
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
              <span>{formatDate(post.published_at || post.created_at)}</span>
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
            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
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
