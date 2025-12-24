import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Plus, Edit, Trash2, Save, X, Eye, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function BlogAdmin({ onBack, currentUser }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'technical',
    author: '',
    status: 'draft',
    featured_image: '',
    tags: ''
  })

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  // Check if user is admin
  const isAdmin = currentUser && currentUser.role === 'admin'

  useEffect(() => {
    if (!isAdmin) {
      setError('You must be an administrator to access this page.')
      setLoading(false)
      return
    }
    fetchAllPosts()
  }, [isAdmin])

  const fetchAllPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/blog/posts?status=&per_page=100')
      const data = await response.json()
      setPosts(data.posts || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('Failed to fetch posts')
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAdmin) {
      alert('You must be an administrator to perform this action.')
      return
    }
    
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      }

      let response
      if (editingPost) {
        response = await fetch(`/api/blog/posts/${editingPost.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch('/api/blog/posts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        })
      }

      if (response.ok) {
        alert(editingPost ? 'Post updated successfully!' : 'Post created successfully!')
        resetForm()
        fetchAllPosts()
      } else {
        const error = await response.json()
        if (response.status === 401) {
          alert('Authentication required. Please log in again.')
        } else if (response.status === 403) {
          alert('Admin permission required to perform this action.')
        } else {
          alert('Error: ' + (error.error || 'Unknown error'))
        }
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Error saving post')
    }
  }

  const handleEdit = (post) => {
    if (!isAdmin) {
      alert('You must be an administrator to edit posts.')
      return
    }
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      category: post.category,
      author: post.author,
      status: post.status,
      featured_image: post.featured_image || '',
      tags: post.tags.join(', ')
    })
    setShowEditor(true)
  }

  const handleDelete = async (postId) => {
    if (!isAdmin) {
      alert('You must be an administrator to delete posts.')
      return
    }
    
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        alert('Post deleted successfully!')
        fetchAllPosts()
      } else {
        const error = await response.json()
        if (response.status === 401) {
          alert('Authentication required. Please log in again.')
        } else if (response.status === 403) {
          alert('Admin permission required to delete posts.')
        } else {
          alert('Error: ' + (error.error || 'Error deleting post'))
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Error deleting post')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'technical',
      author: '',
      status: 'draft',
      featured_image: '',
      tags: ''
    })
    setEditingPost(null)
    setShowEditor(false)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Show error if not admin
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Access Denied</h3>
                <p className="text-red-600">
                  You must be logged in as an administrator to access the blog admin panel.
                </p>
              </div>
            </div>
            <Button 
              className="mt-4"
              variant="outline"
              onClick={onBack}
            >
              Return to Blog
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showEditor) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card style={{ backgroundColor: 'var(--color-cardBg)', borderColor: 'var(--color-cardBorder)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--color-text)' }}>
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </CardTitle>
            <CardDescription style={{ color: 'var(--color-textSecondary)' }}>
              {editingPost ? 'Update your blog post' : 'Write a new blog post'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  placeholder="Write your post content here..."
                  rows={15}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Update</SelectItem>
                      <SelectItem value="market-research">Market Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  placeholder="Author name"
                />
              </div>

              <div>
                <Label htmlFor="featured_image">Featured Image URL</Label>
                <Input
                  id="featured_image"
                  name="featured_image"
                  value={formData.featured_image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="submit"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingPost ? 'Update Post' : 'Create Post'}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Blog Admin
          </h1>
          <p style={{ color: 'var(--color-textSecondary)' }}>
            Manage your blog posts (Admin access required)
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowEditor(true)}
            style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
          <Button variant="outline" onClick={onBack}>
            <Eye className="mr-2 h-4 w-4" />
            View Blog
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card style={{ backgroundColor: 'var(--color-cardBg)', borderColor: 'var(--color-cardBorder)' }}>
              <CardContent className="p-6 text-center">
                <p style={{ color: 'var(--color-textSecondary)' }}>No blog posts found.</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card 
                key={post.id}
                style={{ backgroundColor: 'var(--color-cardBg)', borderColor: 'var(--color-cardBorder)' }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                          {post.status}
                        </Badge>
                        <Badge variant="outline">
                          {post.category === 'technical' ? 'Technical Update' : 'Market Research'}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                        {post.title}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: 'var(--color-textSecondary)' }}>
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                        <span>By {post.author}</span>
                        <span>•</span>
                        <span>{formatDate(post.created_at)}</span>
                        {post.published_at && (
                          <>
                            <span>•</span>
                            <span>Published: {formatDate(post.published_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default BlogAdmin
