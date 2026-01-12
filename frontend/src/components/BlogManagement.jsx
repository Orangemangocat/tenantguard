import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { API_BASE_URL } from '../lib/apiBase.js';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const initialFormState = {
  title: '',
  excerpt: '',
  content: '',
  author: 'Admin',
  category: 'general',
  status: 'draft',
  featured_image: '',
  published_at: ''
};

const statusOptions = ['draft', 'pending', 'pending_approval', 'published', 'rejected'];
const categoryOptions = ['general', 'legal', 'technical', 'market-research'];

const BlockEmbed = Quill.import('blots/block/embed');

class AudioBlot extends BlockEmbed {
  static blotName = 'audio';
  static tagName = 'audio';

  static create(value) {
    const node = super.create();
    node.setAttribute('controls', '');
    node.setAttribute('src', value);
    return node;
  }

  static value(node) {
    return node.getAttribute('src');
  }
}

Quill.register(AudioBlot);

const toLocalInputValue = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoStringOrNull = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const normalizeBlogMediaUrl = (value) => {
  if (!value) {
    return '';
  }
  if (value.startsWith('/static/')) {
    return value.replace(/^\/static/, '');
  }
  return value;
};

export default function BlogManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);
  const editorContainerRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const editorChangeHandlerRef = useRef(null);
  const lastEditorContentRef = useRef('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const pickFile = (accept) => new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });

  const uploadMediaFile = async (file) => {
    const accessToken = localStorage.getItem('access_token');
    const payload = new FormData();
    payload.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/admin/blog-posts/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: payload
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Failed to upload media (status ${response.status})`);
    }
    return normalizeBlogMediaUrl(data.url);
  };

  useEffect(() => {
    if (!showDialog) {
      if (editorInstanceRef.current) {
        if (editorChangeHandlerRef.current) {
          editorInstanceRef.current.off('text-change', editorChangeHandlerRef.current);
        }
        editorInstanceRef.current = null;
        editorChangeHandlerRef.current = null;
        if (editorContainerRef.current) {
          editorContainerRef.current.innerHTML = '';
        }
      }
      return;
    }

    if (!editorContainerRef.current || editorInstanceRef.current) {
      return;
    }

    const quill = new Quill(editorContainerRef.current, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: '#blog-editor-toolbar'
        }
      }
    });

    editorInstanceRef.current = quill;
    const content = formData.content || '';
    if (content) {
      quill.clipboard.dangerouslyPasteHTML(content);
    }
    lastEditorContentRef.current = content;

    const handleChange = () => {
      const html = quill.root.innerHTML;
      lastEditorContentRef.current = html;
      setFormData((prev) => ({
        ...prev,
        content: html
      }));
    };

    editorChangeHandlerRef.current = handleChange;
    quill.on('text-change', handleChange);

    const insertHtmlAtCursor = (html) => {
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      quill.clipboard.dangerouslyPasteHTML(index, html);
      quill.setSelection(index + 1, 0);
    };

    const handleMediaUpload = async ({ accept, kind }) => {
      const file = await pickFile(accept);
      if (!file) {
        return;
      }
      try {
        setImageUploadError(null);
        const url = await uploadMediaFile(file);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isAudioType = file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext);
        const isVideoType = file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext);

        if (kind === 'image') {
          const range = quill.getSelection(true);
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, 'image', url, 'user');
          quill.setSelection(index + 1, 0);
          return;
        }

        if (kind === 'audio' || isAudioType) {
          const range = quill.getSelection(true);
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, 'audio', url, 'user');
          quill.setSelection(index + 1, 0);
          return;
        }

        if (kind === 'video' || isVideoType) {
          const range = quill.getSelection(true);
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, 'video', url, 'user');
          quill.setSelection(index + 1, 0);
          return;
        }

        insertHtmlAtCursor(`<a href="${url}" target="_blank" rel="noopener noreferrer">${file.name}</a>`);
      } catch (err) {
        console.error('Media upload failed:', err);
        setImageUploadError(err.message);
      }
    };

    const toolbar = quill.getModule('toolbar');
    if (toolbar) {
      toolbar.addHandler('image', () => {
        handleMediaUpload({ accept: 'image/*', kind: 'image' });
      });
      toolbar.addHandler('video', () => {
        handleMediaUpload({ accept: 'video/*,audio/*,.mp4,.m4a', kind: 'video' });
      });
      toolbar.addHandler('audio', () => {
        handleMediaUpload({ accept: 'audio/*,.mp4,.m4a', kind: 'audio' });
      });
    }

    return () => {
      if (!editorInstanceRef.current) {
        return;
      }
      if (editorChangeHandlerRef.current) {
        editorInstanceRef.current.off('text-change', editorChangeHandlerRef.current);
      }
      editorInstanceRef.current = null;
      editorChangeHandlerRef.current = null;
      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = '';
      }
    };
  }, [showDialog]);

  useEffect(() => {
    if (!showDialog || !editorInstanceRef.current) {
      return;
    }
    const content = formData.content || '';
    if (content !== lastEditorContentRef.current) {
      editorInstanceRef.current.clipboard.dangerouslyPasteHTML(content);
      lastEditorContentRef.current = content;
    }
  }, [formData.content, showDialog]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/blog-posts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch blog posts (status ${response.status})`);
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedPost(null);
    setFeaturedImageFile(null);
    setImageUploading(false);
    setImageUploadError(null);
  };

  const handleOpenDialog = (mode, post = null) => {
    setDialogMode(mode);
    setSelectedPost(post);

    if (mode === 'edit' && post) {
      setFormData({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        author: post.author || 'Admin',
        category: post.category || 'general',
        status: post.status || 'draft',
        featured_image: normalizeBlogMediaUrl(post.featured_image || ''),
        published_at: toLocalInputValue(post.published_at)
      });
    } else {
      setFormData(initialFormState);
    }

    setShowDialog(true);
    setError(null);
    setSuccess(null);
    setImageUploadError(null);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError(null);
      setSuccess(null);
      const accessToken = localStorage.getItem('access_token');
      const isEdit = dialogMode === 'edit' && selectedPost;
      const url = isEdit
        ? `${API_BASE_URL}/api/admin/blog-posts/${selectedPost.id}`
        : `${API_BASE_URL}/api/admin/blog-posts`;
      const method = isEdit ? 'PUT' : 'POST';
      const editorContent = editorInstanceRef.current?.root?.innerHTML;
      const payload = {
        ...formData,
        featured_image: normalizeBlogMediaUrl(formData.featured_image),
        content: editorContent !== undefined ? editorContent : formData.content
      };
      const normalizedPublishedAt = toIsoStringOrNull(formData.published_at);
      if (normalizedPublishedAt) {
        payload.published_at = normalizedPublishedAt;
      } else {
        delete payload.published_at;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} blog post`);
      }

      setSuccess(`Blog post ${isEdit ? 'updated' : 'created'} successfully`);
      handleCloseDialog();
      fetchPosts();
    } catch (err) {
      console.error('Error saving blog post:', err);
      setError(err.message);
    }
  };

  const handleFeaturedImageUpload = async () => {
    if (!featuredImageFile) {
      setImageUploadError('Select an image to upload.');
      return;
    }

    try {
      setImageUploading(true);
      setImageUploadError(null);
      const accessToken = localStorage.getItem('access_token');
      const payload = new FormData();
      payload.append('file', featuredImageFile);

      const response = await fetch(`${API_BASE_URL}/api/admin/blog-posts/featured-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: payload
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        featured_image: normalizeBlogMediaUrl(data.url || '')
      }));
      setFeaturedImageFile(null);
    } catch (err) {
      console.error('Error uploading featured image:', err);
      setImageUploadError(err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleDelete = async (postId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blog-posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete blog post');
      }

      setSuccess('Blog post deleted successfully');
      fetchPosts();
    } catch (err) {
      console.error('Error deleting blog post:', err);
      setError(err.message);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.author || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="text-gray-600">Create, edit, and manage blog posts</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Search by title or author"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="md:min-w-[240px]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <Button onClick={() => handleOpenDialog('create')}>
            New Blog Post
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-sm">{post.excerpt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{post.author || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700">
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{post.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.published_at ? new Date(post.published_at).toLocaleString() : 'Unpublished'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.updated_at ? new Date(post.updated_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog('edit', post)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(post.id, post.title)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>{dialogMode === 'create' ? 'Create Blog Post' : 'Edit Blog Post'}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(event) => setFormData({ ...formData, excerpt: event.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featured_image">Featured Image Path</Label>
                  <Input
                    id="featured_image"
                    type="text"
                    value={formData.featured_image}
                    onChange={(event) => setFormData({ ...formData, featured_image: event.target.value })}
                    placeholder="/uploads/blog/example.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featured_image_upload">Upload Featured Image</Label>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <Input
                      id="featured_image_upload"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        setFeaturedImageFile(event.target.files?.[0] || null);
                        setImageUploadError(null);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!featuredImageFile || imageUploading}
                      onClick={handleFeaturedImageUpload}
                    >
                      {imageUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                  {imageUploadError && (
                    <p className="text-sm text-red-600">{imageUploadError}</p>
                  )}
                  {formData.featured_image && (
                    <p className="text-xs text-gray-500">
                      Current image: {formData.featured_image}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <div id="blog-editor-toolbar" className="border border-gray-200 rounded-t-md">
                    <span className="ql-formats">
                      <select className="ql-header" defaultValue="">
                        <option value="1">H1</option>
                        <option value="2">H2</option>
                        <option value="3">H3</option>
                        <option value="">Normal</option>
                      </select>
                    </span>
                    <span className="ql-formats">
                      <button className="ql-bold" />
                      <button className="ql-italic" />
                      <button className="ql-underline" />
                      <button className="ql-strike" />
                    </span>
                    <span className="ql-formats">
                      <button className="ql-list" value="ordered" />
                      <button className="ql-list" value="bullet" />
                    </span>
                    <span className="ql-formats">
                      <button className="ql-link" />
                      <button className="ql-blockquote" />
                      <button className="ql-code-block" />
                    </span>
                    <span className="ql-formats">
                      <button className="ql-image" />
                      <button className="ql-video" />
                      <button className="ql-audio">Audio</button>
                    </span>
                    <span className="ql-formats">
                      <button className="ql-clean" />
                    </span>
                  </div>
                  <div id="content" ref={editorContainerRef} className="min-h-[320px] border border-t-0 border-gray-200 rounded-b-md" />
                  {imageUploadError && (
                    <p className="text-sm text-red-600">{imageUploadError}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(event) => setFormData({ ...formData, author: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="published_at">Published Date</Label>
                  <Input
                    id="published_at"
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(event) => setFormData({ ...formData, published_at: event.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {dialogMode === 'create' ? 'Create Post' : 'Update Post'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
