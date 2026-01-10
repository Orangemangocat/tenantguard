import { useEffect, useState } from 'react';
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
  Eye
} from 'lucide-react';
import { API_BASE_URL } from '../lib/apiBase.js';

const LLM_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'Uses configured OpenAI models and API keys' }
];

const CATEGORIES = [
  { id: 'technical', name: 'Technical Update' },
  { id: 'market-research', name: 'Market Research' }
];

export default function BlogAIManagement() {
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [scheduleHours, setScheduleHours] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [queueJobs, setQueueJobs] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('create');

  const [formData, setFormData] = useState({
    llmProvider: 'openai',
    providerIndex: '',
    topic: '',
    category: 'technical',
    author: 'Manus AI',
    links: '',
    textSnippets: '',
    images: [],
    additionalContext: ''
  });

  const [selectedPost, setSelectedPost] = useState(null);
  const [revisionRequest, setRevisionRequest] = useState('');
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    category: 'technical',
    research_links: '',
    research_notes: '',
    priority: 'normal'
  });
  const [majorUpdateForm, setMajorUpdateForm] = useState({
    title: '',
    description: '',
    research_links: '',
    research_notes: ''
  });

  useEffect(() => {
    fetchSchedule();
    if (activeTab === 'manage') {
      fetchPosts();
    }
    if (activeTab === 'topics') {
      fetchTopics();
    }
    if (activeTab === 'major') {
      fetchQueueJobs();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/blog-posts`, {
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

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/blog/topics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const data = await response.json();
      setTopics(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load topic queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/schedule`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      const data = await response.json();
      setSchedule(data);
      const hoursValue = data?.max_hours_between_posts ?? data?.max_days_between_posts ?? '';
      setScheduleHours(hoursValue === null || hoursValue === undefined ? '' : String(hoursValue));
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  };

  const fetchQueueJobs = async () => {
    try {
      setQueueLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/queue`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch queue');
      }
      const data = await response.json();
      setQueueJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setQueueLoading(false);
    }
  };

  const toggleAutoPosting = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          auto_posting_enabled: schedule ? !schedule.auto_posting_enabled : true
        })
      });
      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }
      fetchSchedule();
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError('Failed to update schedule');
    }
  };

  const updateScheduleHours = async (e) => {
    e.preventDefault();
    if (scheduleHours === '') {
      setError('Please enter a cadence in hours.');
      return;
    }
    const nextValue = Number(scheduleHours);
    if (!Number.isFinite(nextValue) || nextValue < 1) {
      setError('Cadence must be at least 1 hour.');
      return;
    }
    try {
      setScheduleSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/blog/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          max_hours_between_posts: Math.round(nextValue)
        })
      });
      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }
      setSuccess('Schedule cadence updated.');
      fetchSchedule();
    } catch (err) {
      console.error('Error updating schedule cadence:', err);
      setError('Failed to update schedule cadence');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleMajorUpdateSubmit = async (e) => {
    e.preventDefault();

    try {
      const linksArray = majorUpdateForm.research_links
        .split('\n')
        .filter(link => link.trim())
        .map(link => link.trim());

      const response = await fetch(`${API_BASE_URL}/api/blog/topics/major-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          title: majorUpdateForm.title,
          description: majorUpdateForm.description,
          research_links: linksArray,
          research_notes: majorUpdateForm.research_notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to queue major update');
      }

      const data = await response.json().catch(() => ({}));
      const jobId = data && data.job_id ? String(data.job_id) : '';
      setSuccess(
        jobId
          ? `Major update queued for generation (job ${jobId}).`
          : 'Major update queued for generation.'
      );
      setMajorUpdateForm({
        title: '',
        description: '',
        research_links: '',
        research_notes: ''
      });
    } catch (err) {
      console.error('Error queuing major update:', err);
      setError('Failed to queue major update');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
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
          provider_index: formData.providerIndex === '' ? undefined : Number(formData.providerIndex),
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

      const data = await response.json().catch(() => ({}));
      const jobId = data && data.job_id ? String(data.job_id) : '';
      setSuccess(
        jobId
          ? `Blog post queued (job ${jobId}). It will appear as a draft when generation completes.`
          : 'Blog post queued. It will appear as a draft when generation completes.'
      );
      setFormData({
        llmProvider: 'openai',
        providerIndex: '',
        topic: '',
        category: 'technical',
        author: 'Manus AI',
        links: '',
        textSnippets: '',
        images: [],
        additionalContext: ''
      });

      setActiveTab('manage');
      fetchPosts();
    } catch (err) {
      console.error('Error generating post:', err);
      setError('Failed to generate blog post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();

    try {
      const linksArray = topicForm.research_links
        .split('\n')
        .filter(link => link.trim())
        .map(link => link.trim());

      const response = await fetch(`${API_BASE_URL}/api/blog/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          title: topicForm.title,
          description: topicForm.description,
          category: topicForm.category,
          research_links: linksArray,
          research_notes: topicForm.research_notes,
          priority: topicForm.priority
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create topic');
      }

      setSuccess('Topic added to queue.');
      setShowTopicForm(false);
      setTopicForm({
        title: '',
        description: '',
        category: 'technical',
        research_links: '',
        research_notes: '',
        priority: 'normal'
      });
      fetchTopics();
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Failed to add topic');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete topic');
      }

      setSuccess('Topic removed.');
      fetchTopics();
    } catch (err) {
      console.error('Error deleting topic:', err);
      setError('Failed to delete topic');
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

      setSuccess('Post revision queued!');
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

  const handleSubmitForApproval = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/posts/${postId}/submit-for-approval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to submit post');
      }

      setSuccess('Post submitted for approval.');
      fetchPosts();
    } catch (err) {
      console.error('Error submitting post:', err);
      setError('Failed to submit post for approval');
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/approval/approve/${postId}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/blog/approval/reject/${postId}`, {
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
      draft: { color: 'bg-gray-500', icon: FileText },
      pending_approval: { color: 'bg-yellow-500', icon: Clock },
      approved: { color: 'bg-green-500', icon: CheckCircle },
      published: { color: 'bg-blue-500', icon: CheckCircle },
      rejected: { color: 'bg-red-500', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.draft;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          AI-Powered Blog Management
        </h1>
        <p style={{ color: 'var(--color-textSecondary)' }}>
          Create, manage, and publish blog posts with AI assistance
        </p>
      </div>

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
        <button
          onClick={() => setActiveTab('topics')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'topics'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="inline w-4 h-4 mr-2" />
          Topic Queue
        </button>
        <button
          onClick={() => setActiveTab('major')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'major'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="inline w-4 h-4 mr-2" />
          Major Updates
        </button>
      </div>

      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Blog Post with AI</CardTitle>
            <CardDescription>
              Provide source materials and let AI create a professional blog post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              <div className="mt-4">
                <Label htmlFor="providerIndex">Provider Slot (optional)</Label>
                <Input
                  id="providerIndex"
                  type="number"
                  min="0"
                  value={formData.providerIndex}
                  onChange={(e) => handleInputChange('providerIndex', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="topic">Blog Post Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Major intake workflow upgrade"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
              />
            </div>

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

            <div>
              <Label htmlFor="links">
                <LinkIcon className="inline w-4 h-4 mr-2" />
                Reference Links (one per line)
              </Label>
              <Textarea
                id="links"
                placeholder="https://example.com/release-notes"
                rows={4}
                value={formData.links}
                onChange={(e) => handleInputChange('links', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="textSnippets">
                <FileText className="inline w-4 h-4 mr-2" />
                Text Snippets / Research Notes
              </Label>
              <Textarea
                id="textSnippets"
                placeholder="Paste key details here..."
                rows={6}
                value={formData.textSnippets}
                onChange={(e) => handleInputChange('textSnippets', e.target.value)}
              />
            </div>

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

            <div>
              <Label htmlFor="additionalContext">Additional Context / Instructions</Label>
              <Textarea
                id="additionalContext"
                placeholder="Any specific tone, style, or requirements..."
                rows={3}
                value={formData.additionalContext}
                onChange={(e) => handleInputChange('additionalContext', e.target.value)}
              />
            </div>

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
                          onClick={() => handleSubmitForApproval(post.id)}
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

      {activeTab === 'topics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Topic Queue</h2>
              <p className="text-sm text-gray-600">Add or remove topics for AI generation.</p>
            </div>
            <Button
              onClick={() => setShowTopicForm((show) => !show)}
              style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
            >
              {showTopicForm ? 'Hide Form' : 'Add Topic'}
            </Button>
          </div>

          {showTopicForm && (
            <Card>
              <CardHeader>
                <CardTitle>Suggest Topic</CardTitle>
                <CardDescription>Add a topic for the AI to write about.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTopicSubmit} className="space-y-4">
                  <div>
                    <Label>Topic Title *</Label>
                    <Input
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Description / Angle</Label>
                    <Textarea
                      rows={3}
                      value={topicForm.description}
                      onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={topicForm.category}
                        onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value })}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={topicForm.priority}
                        onChange={(e) => setTopicForm({ ...topicForm, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label>Research Links (one per line)</Label>
                    <Textarea
                      rows={3}
                      value={topicForm.research_links}
                      onChange={(e) => setTopicForm({ ...topicForm, research_links: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Research Notes</Label>
                    <Textarea
                      rows={4}
                      value={topicForm.research_notes}
                      onChange={(e) => setTopicForm({ ...topicForm, research_notes: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save Topic</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTopicForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : topics.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-textSecondary)' }} />
                <p style={{ color: 'var(--color-textSecondary)' }}>No topics in the queue</p>
              </CardContent>
            </Card>
          ) : (
            topics.map(topic => (
              <Card key={topic.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{topic.title}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{topic.category}</Badge>
                        <Badge variant="outline">{topic.priority}</Badge>
                        <Badge variant="outline">{topic.status}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExpandedTopicId(expandedTopicId === topic.id ? null : topic.id);
                      }}
                    >
                      {expandedTopicId === topic.id ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                </CardHeader>
                {expandedTopicId === topic.id && (
                  <CardContent className="space-y-3">
                    {topic.description && (
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-gray-700">{topic.description}</p>
                      </div>
                    )}
                    {topic.research_links && (
                      <div>
                        <Label>Research Links</Label>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{topic.research_links}</div>
                      </div>
                    )}
                    {topic.research_notes && (
                      <div>
                        <Label>Research Notes</Label>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{topic.research_notes}</div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteTopic(topic.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'major' && (
        <div className="space-y-4">
          {schedule ? (
            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>Control cadence and queue major updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Automated Posting</h3>
                    <p className="text-sm text-gray-600">
                      Scheduler runs daily. It generates posts when the last published post is at least {schedule.max_hours_between_posts} hours old.
                    </p>
                  </div>
                  <Button
                    onClick={toggleAutoPosting}
                    className={schedule.auto_posting_enabled ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}
                  >
                    {schedule.auto_posting_enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <form onSubmit={updateScheduleHours} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label htmlFor="scheduleHours">Max hours between posts</Label>
                    <Input
                      id="scheduleHours"
                      type="number"
                      min="1"
                      value={scheduleHours}
                      onChange={(e) => setScheduleHours(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={scheduleSaving}>
                    {scheduleSaving ? 'Saving...' : 'Save Cadence'}
                  </Button>
                </form>

                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold mb-2">Major Technical Update</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Queue an urgent technical post immediately, regardless of cadence.
                  </p>
                  <form onSubmit={handleMajorUpdateSubmit} className="space-y-4">
                    <div>
                      <Label>Update Title *</Label>
                      <Input
                        value={majorUpdateForm.title}
                        onChange={(e) => setMajorUpdateForm({ ...majorUpdateForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Summary / Angle</Label>
                      <Textarea
                        rows={3}
                        value={majorUpdateForm.description}
                        onChange={(e) => setMajorUpdateForm({ ...majorUpdateForm, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Release Notes / Sources</Label>
                      <Textarea
                        rows={3}
                        value={majorUpdateForm.research_links}
                        onChange={(e) => setMajorUpdateForm({ ...majorUpdateForm, research_links: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Key Details</Label>
                      <Textarea
                        rows={4}
                        value={majorUpdateForm.research_notes}
                        onChange={(e) => setMajorUpdateForm({ ...majorUpdateForm, research_notes: e.target.value })}
                      />
                    </div>
                    <Button type="submit">Queue Major Update</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-textSecondary)' }} />
                <p style={{ color: 'var(--color-textSecondary)' }}>Schedule settings not available</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Queue Jobs</CardTitle>
              <CardDescription>Latest background jobs queued for blog automation.</CardDescription>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : queueJobs.length === 0 ? (
                <p className="text-sm text-gray-600">No recent jobs in the queue.</p>
              ) : (
                <div className="space-y-3">
                  {queueJobs.map(job => (
                    <div key={job.id} className="flex flex-col gap-1 border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{job.description || 'Job'}</span>
                        <Badge variant="outline">{job.status || 'unknown'}</Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        Enqueued: {job.enqueued_at || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
