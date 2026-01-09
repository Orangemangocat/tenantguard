import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Sparkles, 
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Send, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye
} from 'lucide-react';
import { API_BASE_URL } from '../lib/apiBase.js';

const LLM_PROVIDERS = [
  { id: 'manus', name: 'Manus AI', description: 'Advanced reasoning and research capabilities' },
  { id: 'chatgpt', name: 'ChatGPT', description: 'GPT-4 for creative and conversational content' },
  { id: 'claude', name: 'Claude', description: 'Anthropic Claude for detailed analysis' },
  { id: 'gemini', name: 'Gemini', description: 'Google Gemini for multimodal content' }
];

const CATEGORIES = [
  { id: 'technical', name: 'Technical Update' },
  { id: 'market-research', name: 'Market Research' },
  { id: 'legal', name: 'Legal' },
  { id: 'general', name: 'General' }
];

export default function BlogAIManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'manage'
  
  // Form state for AI generation
  const [formData, setFormData] = useState({
    llmProvider: 'manus',
    topic: '',
    category: 'general',
    author: 'Manus AI',
    links: '',
    textSnippets: '',
    images: [],
    additionalContext: ''
  });

  // State for managing existing posts
  const [selectedPost, setSelectedPost] = useState(null);
  const [revisionRequest, setRevisionRequest] = useState('');

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchPosts();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/blog-posts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    // In a real implementation, upload to server and get URLs
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }));
  };

  const handleGeneratePost = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/blog/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          llm_provider: formData.llmProvider,
          topic: formData.topic,
          category: formData.category,
          author: formData.author,
          links: formData.links.split('\n').filter(l => l.trim()),
          text_snippets: formData.textSnippets,
          images: formData.images,
          additional_context: formData.additionalContext
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate post');
      }

      const data = await response.json();
      setSuccess('Blog post generated successfully! It has been saved as a draft.');
      
      // Reset form
      setFormData({
        llmProvider: 'manus',
        topic: '',
        category: 'general',
        author: 'Manus AI',
        links: '',
        textSnippets: '',
        images: [],
        additionalContext: ''
      });

      // Switch to manage tab to see the new post
      setActiveTab('manage');
      fetchPosts();
      
    } catch (err) {
      console.error('Error generating post:', err);
      setError('Failed to generate blog post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevisePost = async (postId) => {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/blog/ai-revise/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          revision_request: revisionRequest
        })
      });

      if (!response.ok) {
        throw new Error('Failed to revise post');
      }

      setSuccess('Post revised successfully!');
      setRevisionRequest('');
      setSelectedPost(null);
      fetchPosts();
      
    } catch (err) {
      console.error('Error revising post:', err);
      setError('Failed to revise post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/approve/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve post');
      }

      setSuccess('Post approved and published!');
      fetchPosts();
    } catch (err) {
      console.error('Error approving post:', err);
      setError('Failed to approve post');
    }
  };

  const handleRejectPost = async (postId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/reject/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject post');
      }

      setSuccess('Post rejected');
      fetchPosts();
    } catch (err) {
      console.error('Error rejecting post:', err);
      setError('Failed to reject post');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-500', icon: FileText },
      'pending_approval': { color: 'bg-yellow-500', icon: Clock },
      'approved': { color: 'bg-green-500', icon: CheckCircle },
      'published': { color: 'bg-blue-500', icon: CheckCircle },
      'rejected': { color: 'bg-red-500', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig['draft'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          AI-Powered Blog Management
        </h1>
        <p style={{ color: 'var(--color-textSecondary)' }}>
          Create, manage, and publish blog posts with AI assistance
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'create'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="inline w-4 h-4 mr-2" />
          Create New Post
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'manage'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="inline w-4 h-4 mr-2" />
          Manage Posts
        </button>
      </div>

      {/* Create Tab */}
      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Blog Post with AI</CardTitle>
            <CardDescription>
              Provide source materials and let AI create a professional blog post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* LLM Provider Selection */}
            <div>
              <Label>Select AI Provider</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {LLM_PROVIDERS.map(provider => (
                  <Card
                    key={provider.id}
                    className={`cursor-pointer transition-all ${
                      formData.llmProvider === provider.id
                        ? 'border-blue-500 border-2'
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleInputChange('llmProvider', provider.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className={`w-5 h-5 mt-1 ${
                          formData.llmProvider === provider.id ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <div>
                          <h4 className="font-semibold">{provider.name}</h4>
                          <p className="text-sm text-gray-600">{provider.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <Label htmlFor="topic">Blog Post Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., How TenantGuard protects tenant data"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
              />
            </div>

            {/* Category and Author */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-md"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                />
              </div>
            </div>

            {/* Links */}
            <div>
              <Label htmlFor="links">
                <LinkIcon className="inline w-4 h-4 mr-2" />
                Reference Links (one per line)
              </Label>
              <Textarea
                id="links"
                placeholder="https://example.com/article1&#10;https://example.com/article2"
                rows={4}
                value={formData.links}
                onChange={(e) => handleInputChange('links', e.target.value)}
              />
            </div>

            {/* Text Snippets */}
            <div>
              <Label htmlFor="textSnippets">
                <FileText className="inline w-4 h-4 mr-2" />
                Text Snippets / Research Notes
              </Label>
              <Textarea
                id="textSnippets"
                placeholder="Paste any relevant text, quotes, or research notes here..."
                rows={6}
                value={formData.textSnippets}
                onChange={(e) => handleInputChange('textSnippets', e.target.value)}
              />
            </div>

            {/* Images */}
            <div>
              <Label htmlFor="images">
                <ImageIcon className="inline w-4 h-4 mr-2" />
                Reference Images
              </Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
              {formData.images.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`Upload ${idx}`} className="w-20 h-20 object-cover rounded" />
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Context */}
            <div>
              <Label htmlFor="additionalContext">Additional Context / Instructions</Label>
              <Textarea
                id="additionalContext"
                placeholder="Any specific tone, style, or requirements for the post..."
                rows={3}
                value={formData.additionalContext}
                onChange={(e) => handleInputChange('additionalContext', e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGeneratePost}
              disabled={generating || !formData.topic}
              className="w-full"
              style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Blog Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-textSecondary)' }} />
                <p style={{ color: 'var(--color-textSecondary)' }}>No blog posts yet</p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(post.status)}
                        <Badge variant="outline">{post.category}</Badge>
                      </div>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription>{post.excerpt}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm text-gray-600">
                      By {post.author} • {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Revision Request for Drafts */}
                  {selectedPost === post.id && post.status === 'draft' && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <Label>Request Revisions</Label>
                      <Textarea
                        placeholder="Describe the changes you want..."
                        rows={3}
                        value={revisionRequest}
                        onChange={(e) => setRevisionRequest(e.target.value)}
                        className="mt-2"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleRevisePost(post.id)}
                          disabled={generating || !revisionRequest}
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Revise
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedPost(null);
                            setRevisionRequest('');
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {post.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Revisions
                        </Button>
                        <Button
                          size="sm"
                          style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                          onClick={() => handleApprovePost(post.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit for Approval
                        </Button>
                      </>
                    )}
                    
                    {post.status === 'pending_approval' && (
                      <>
                        <Button
                          size="sm"
                          style={{ backgroundColor: 'var(--color-success)', color: '#ffffff' }}
                          onClick={() => handleApprovePost(post.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve & Publish
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) handleRejectPost(post.id, reason);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
