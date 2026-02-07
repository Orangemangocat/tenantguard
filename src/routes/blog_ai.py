"""
AI-powered blog generation routes for admin users.
"""

import os
from flask import Blueprint, jsonify, request

from src.models.blog import BlogPost
from src.routes.auth import admin_required

blog_ai_bp = Blueprint('blog_ai', __name__)

ALLOWED_CATEGORIES = {'technical', 'market-research'}
SUPPORTED_PROVIDERS = {'openai'}


def normalize_links(links):
    if not links:
        return []
    if isinstance(links, list):
        return [link for link in links if link]
    if isinstance(links, str):
        return [link.strip() for link in links.splitlines() if link.strip()]
    return []


@blog_ai_bp.route('/api/blog/ai-generate', methods=['POST'])
@admin_required
def ai_generate_post(current_user):
    """Queue a blog post generation job (admin only)."""
    try:
        data = request.json or {}

        topic = data.get('topic')
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400

        llm_provider = data.get('llm_provider', 'openai')
        category = data.get('category', 'technical')
        author = data.get('author', 'Manus AI')
        links = normalize_links(data.get('links', []))
        text_snippets = data.get('text_snippets', '')
        additional_context = data.get('additional_context', '')
        provider_index = data.get('provider_index')

        if category not in ALLOWED_CATEGORIES:
            return jsonify({
                'error': f"Invalid category. Allowed: {sorted(ALLOWED_CATEGORIES)}"
            }), 400

        if llm_provider not in SUPPORTED_PROVIDERS:
            return jsonify({
                'error': f"Unsupported provider. Allowed: {sorted(SUPPORTED_PROVIDERS)}"
            }), 400

        from redis import Redis
        from rq import Queue
        from src.tasks.blog_ai_tasks import generate_blog_post

        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_conn = Redis.from_url(redis_url)
        q = Queue('default', connection=redis_conn)

        payload = {
            'topic': topic,
            'category': category,
            'author': author,
            'links': links,
            'text_snippets': text_snippets,
            'additional_context': additional_context,
            'llm_provider': llm_provider,
            'provider_index': provider_index,
            'generation_source': 'ai_assisted',
        }

        job = q.enqueue(generate_blog_post, payload, submit_for_approval=False)
        return jsonify({
            'success': True,
            'queued': True,
            'job_id': job.get_id(),
            'message': 'Blog post generation queued',
        }), 202

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@blog_ai_bp.route('/api/blog/ai-revise/<int:post_id>', methods=['POST'])
@admin_required
def ai_revise_post(current_user, post_id):
    """Revise an existing blog post using AI (admin only)."""
    try:
        data = request.json or {}
        revision_request = data.get('revision_request', '')
        if not revision_request:
            return jsonify({'error': 'Revision request is required'}), 400

        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404

        llm_provider = post.generated_by or 'openai'
        if llm_provider not in SUPPORTED_PROVIDERS:
            return jsonify({'error': 'Unsupported provider for revision'}), 400

        from redis import Redis
        from rq import Queue
        from src.tasks.blog_ai_tasks import revise_blog_post

        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_conn = Redis.from_url(redis_url)
        q = Queue('default', connection=redis_conn)

        payload = {
            'revision_request': revision_request,
            'llm_provider': llm_provider,
        }

        job = q.enqueue(revise_blog_post, post.id, payload)
        return jsonify({
            'success': True,
            'queued': True,
            'job_id': job.get_id(),
            'message': 'Blog post revision queued',
        }), 202
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500
