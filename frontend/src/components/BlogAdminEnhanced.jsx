import React, { useState, useEffect } from 'react';

const BlogAdminEnhanced = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [showMajorUpdateForm, setShowMajorUpdateForm] = useState(false);
  
  // Post form state
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'technical',
    author: '',
    status: 'draft',
    featured_image: '',
    tags: ''
  });
  
  // Topic form state
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    category: 'technical',
    research_links: '',
    research_notes: '',
    priority: 'normal'
  });
  
  const [editingPost, setEditingPost] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [majorUpdateForm, setMajorUpdateForm] = useState({
    title: '',
    description: '',
    research_links: '',
    research_notes: ''
  });

  useEffect(() => {
    fetchPosts();
    fetchTopics();
    fetchAnalytics();
    fetchSchedule();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts');
      const data = await response.json();
      const postsList = Array.isArray(data) ? data : (data.posts || []);
      setPosts(postsList);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/blog/topics');
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/blog/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/blog/schedule');
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingPost 
        ? `/api/blog/posts/${editingPost.id}` 
        : '/api/blog/posts';
      const method = editingPost ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postForm)
      });
      
      if (response.ok) {
        fetchPosts();
        fetchAnalytics();
        setShowPostForm(false);
        setEditingPost(null);
        setPostForm({
          title: '',
          content: '',
          excerpt: '',
          category: 'technical',
          author: '',
          status: 'draft',
          featured_image: '',
          tags: ''
        });
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert research links from string to array
      const linksArray = topicForm.research_links
        .split('\n')
        .filter(link => link.trim())
        .map(link => link.trim());
      
      const response = await fetch('/api/blog/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...topicForm,
          research_links: linksArray
        })
      });
      
      if (response.ok) {
        fetchTopics();
        setShowTopicForm(false);
        setTopicForm({
          title: '',
          description: '',
          category: 'technical',
          research_links: '',
          research_notes: '',
          priority: 'normal'
        });
      }
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const handleMajorUpdateSubmit = async (e) => {
    e.preventDefault();

    try {
      const linksArray = majorUpdateForm.research_links
        .split('\n')
        .filter(link => link.trim())
        .map(link => link.trim());

      const response = await fetch('/api/blog/topics/major-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: majorUpdateForm.title,
          description: majorUpdateForm.description,
          research_links: linksArray,
          research_notes: majorUpdateForm.research_notes
        })
      });

      if (response.ok) {
        fetchTopics();
        fetchAnalytics();
        setShowMajorUpdateForm(false);
        setMajorUpdateForm({
          title: '',
          description: '',
          research_links: '',
          research_notes: ''
        });
      }
    } catch (error) {
      console.error('Error queuing major update:', error);
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchPosts();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!confirm('Are you sure you want to delete this topic suggestion?')) return;
    
    try {
      const response = await fetch(`/api/blog/topics/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchTopics();
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      category: post.category,
      author: post.author,
      status: post.status,
      featured_image: post.featured_image || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || ''
    });
    setShowPostForm(true);
  };

  const toggleAutoPosting = async () => {
    try {
      const response = await fetch('/api/blog/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_posting_enabled: !schedule.auto_posting_enabled
        })
      });
      
      if (response.ok) {
        fetchSchedule();
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.normal;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Blog Administration</h1>
        <p className="text-gray-600">Manage posts, suggest topics, and configure automated posting</p>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{analytics.total_published_posts}</div>
            <div className="text-sm text-gray-600">Published Posts</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{analytics.draft_posts}</div>
            <div className="text-sm text-gray-600">Draft Posts</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{analytics.pending_topics}</div>
            <div className="text-sm text-gray-600">Pending Topics</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.days_since_last_post !== null ? analytics.days_since_last_post : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Days Since Last Post</div>
          </div>
        </div>
      )}

      {/* Auto-posting Status */}
      {schedule && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Automated Posting</h3>
              <p className="text-sm text-gray-600">
                Manus will automatically generate and publish a post every {schedule.max_days_between_posts} days
              </p>
            </div>
            <button
              onClick={toggleAutoPosting}
              className={`px-6 py-2 rounded-lg font-semibold ${
                schedule.auto_posting_enabled
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {schedule.auto_posting_enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-semibold">Major Technical Update</h4>
                <p className="text-sm text-gray-600">
                  Queue an urgent technical post immediately, regardless of cadence.
                </p>
              </div>
              <button
                onClick={() => setShowMajorUpdateForm((show) => !show)}
                className="px-4 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                {showMajorUpdateForm ? 'Hide Form' : 'Queue Major Update'}
              </button>
            </div>
            {showMajorUpdateForm && (
              <form onSubmit={handleMajorUpdateSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Update Title *</label>
                  <input
                    type="text"
                    value={majorUpdateForm.title}
                    onChange={(e) => setMajorUpdateForm({...majorUpdateForm, title: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Major Case Intake Workflow Upgrade"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Summary / Angle</label>
                  <textarea
                    value={majorUpdateForm.description}
                    onChange={(e) => setMajorUpdateForm({...majorUpdateForm, description: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                    placeholder="Describe the upgrade and key benefits"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Release Notes / Sources</label>
                  <textarea
                    value={majorUpdateForm.research_links}
                    onChange={(e) => setMajorUpdateForm({...majorUpdateForm, research_links: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                    placeholder="Paste URLs (one per line)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Key Details</label>
                  <textarea
                    value={majorUpdateForm.research_notes}
                    onChange={(e) => setMajorUpdateForm({...majorUpdateForm, research_notes: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="4"
                    placeholder="Important facts or requirements to include"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Queue Major Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMajorUpdateForm(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Blog Posts
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'topics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Topic Suggestions
          </button>
        </nav>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => {
                setShowPostForm(true);
                setEditingPost(null);
                setPostForm({
                  title: '',
                  content: '',
                  excerpt: '',
                  category: 'technical',
                  author: '',
                  status: 'draft',
                  featured_image: '',
                  tags: ''
                });
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              New Post
            </button>
          </div>

          {showPostForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h3>
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Excerpt</label>
                  <textarea
                    value={postForm.excerpt}
                    onChange={(e) => setPostForm({...postForm, excerpt: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Content *</label>
                  <textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="10"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({...postForm, category: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="technical">Technical Update</option>
                      <option value="market-research">Market Research</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Status *</label>
                    <select
                      value={postForm.status}
                      onChange={(e) => setPostForm({...postForm, status: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Author *</label>
                  <input
                    type="text"
                    value={postForm.author}
                    onChange={(e) => setPostForm({...postForm, author: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                  <input
                    type="text"
                    value={postForm.featured_image}
                    onChange={(e) => setPostForm({...postForm, featured_image: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={postForm.tags}
                    onChange={(e) => setPostForm({...postForm, tags: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingPost ? 'Update Post' : 'Create Post'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPostForm(false);
                      setEditingPost(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                    <div className="flex gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.category === 'technical' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {post.category === 'technical' ? 'Technical Update' : 'Market Research'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      By {post.author} • {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setShowTopicForm(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Suggest New Topic for Manus
            </button>
          </div>

          {showTopicForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-xl font-semibold mb-4">Suggest Topic for Manus to Write</h3>
              <form onSubmit={handleTopicSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Topic Title *</label>
                  <input
                    type="text"
                    value={topicForm.title}
                    onChange={(e) => setTopicForm({...topicForm, title: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Analyze California's new rent control law"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description / Angle</label>
                  <textarea
                    value={topicForm.description}
                    onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                    placeholder="Provide context or specific angle you want Manus to focus on"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      value={topicForm.category}
                      onChange={(e) => setTopicForm({...topicForm, category: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="technical">Technical Update</option>
                      <option value="market-research">Market Research</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={topicForm.priority}
                      onChange={(e) => setTopicForm({...topicForm, priority: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Research Links</label>
                  <textarea
                    value={topicForm.research_links}
                    onChange={(e) => setTopicForm({...topicForm, research_links: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="4"
                    placeholder="Paste URLs (one per line) to articles, reports, or resources for Manus to research"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Research Notes / Key Information</label>
                  <textarea
                    value={topicForm.research_notes}
                    onChange={(e) => setTopicForm({...topicForm, research_notes: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="5"
                    placeholder="Paste key quotes, data points, or specific information you want Manus to include"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Submit Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTopicForm(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {topics.map(topic => (
              <div key={topic.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                    <div className="flex gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        topic.category === 'technical' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {topic.category === 'technical' ? 'Technical Update' : 'Market Research'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(topic.priority)}`}>
                        {topic.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(topic.status)}`}>
                        {topic.status}
                      </span>
                    </div>
                    {topic.description && (
                      <p className="text-sm text-gray-700 mb-2">{topic.description}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      Created {new Date(topic.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogAdminEnhanced;
