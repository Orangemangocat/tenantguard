"""
AI-Powered Blog Generation Routes
Handles AI-assisted blog post creation and revision
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.blog import BlogPost
from src.routes.auth import admin_required
import re
import os
import requests

blog_ai_bp = Blueprint('blog_ai', __name__)

def create_slug(title):
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def call_llm_api(provider, prompt, context=None):
    """
    Call the specified LLM provider API
    Returns generated content
    """
    
    if provider == 'manus':
        # Use OpenAI API with Manus configuration
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured")
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert blog writer for TenantGuard, a legal tech platform. Write professional, engaging, and SEO-optimized blog posts."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        if context:
            messages.insert(1, {
                "role": "system",
                "content": f"Context and source materials:\n{context}"
            })
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json={
                'model': 'gpt-4',
                'messages': messages,
                'temperature': 0.7,
                'max_tokens': 2000
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"LLM API error: {response.text}")
        
        return response.json()['choices'][0]['message']['content']
    
    elif provider == 'chatgpt':
        # Similar implementation for ChatGPT
        return call_llm_api('manus', prompt, context)  # Fallback to manus for now
    
    elif provider == 'claude':
        # Placeholder for Claude integration
        raise NotImplementedError("Claude integration coming soon")
    
    elif provider == 'gemini':
        # Placeholder for Gemini integration
        raise NotImplementedError("Gemini integration coming soon")
    
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")

@blog_ai_bp.route('/api/blog/ai-generate', methods=['POST'])
@admin_required
def ai_generate_post(current_user):
    """
    Generate a blog post using AI
    """
    try:
        data = request.json
        
        # Validate required fields
        if 'topic' not in data:
            return jsonify({'error': 'Topic is required'}), 400
        
        llm_provider = data.get('llm_provider', 'manus')
        topic = data['topic']
        category = data.get('category', 'general')
        author = data.get('author', 'Manus AI')
        links = data.get('links', [])
        text_snippets = data.get('text_snippets', '')
        additional_context = data.get('additional_context', '')
        
        # Build context from provided materials
        context_parts = []
        
        if links:
            context_parts.append(f"Reference links:\n" + "\n".join(f"- {link}" for link in links))
        
        if text_snippets:
            context_parts.append(f"Research notes:\n{text_snippets}")
        
        if additional_context:
            context_parts.append(f"Additional instructions:\n{additional_context}")
        
        context = "\n\n".join(context_parts) if context_parts else None
        
        # Generate blog post prompt
        prompt = f"""Write a professional blog post for TenantGuard about: {topic}

The blog post should:
1. Have an engaging title
2. Include a compelling excerpt (150-200 characters)
3. Be well-structured with clear sections
4. Be informative and professional
5. Include relevant keywords for SEO
6. Be approximately 800-1200 words
7. End with a call-to-action

Category: {category}

Please format your response as JSON with the following structure:
{{
    "title": "Blog Post Title",
    "excerpt": "Brief excerpt",
    "content": "Full blog post content in markdown format",
    "suggested_tags": ["tag1", "tag2", "tag3"]
}}
"""
        
        # Call LLM API
        response_text = call_llm_api(llm_provider, prompt, context)
        
        # Parse response (assuming JSON format)
        try:
            import json
            # Try to extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                response_data = json.loads(response_text[json_start:json_end])
            else:
                # Fallback: create structure from raw text
                response_data = {
                    'title': topic,
                    'excerpt': response_text[:200],
                    'content': response_text,
                    'suggested_tags': []
                }
        except:
            # Fallback parsing
            response_data = {
                'title': topic,
                'excerpt': response_text[:200],
                'content': response_text,
                'suggested_tags': []
            }
        
        # Create slug
        slug = create_slug(response_data['title'])
        
        # Check if slug already exists
        existing_post = BlogPost.query.filter_by(slug=slug).first()
        if existing_post:
            slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
        
        # Create new post as draft
        post = BlogPost(
            title=response_data['title'],
            slug=slug,
            content=response_data['content'],
            excerpt=response_data['excerpt'],
            category=category,
            author=author,
            status='draft',
            tags=','.join(response_data.get('suggested_tags', [])),
            generated_by=llm_provider,
            generation_source='ai_assisted'
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'post': post.to_dict(),
            'message': 'Blog post generated successfully'
        }), 201
        
    except Exception as e:
        print(f"Error generating blog post: {e}")
        return jsonify({'error': str(e)}), 500

@blog_ai_bp.route('/api/blog/ai-revise/<int:post_id>', methods=['POST'])
@admin_required
def ai_revise_post(current_user, post_id):
    """
    Revise an existing blog post using AI
    """
    try:
        data = request.json
        revision_request = data.get('revision_request', '')
        
        if not revision_request:
            return jsonify({'error': 'Revision request is required'}), 400
        
        # Get the post
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Build revision prompt
        prompt = f"""Revise the following blog post according to these instructions:

REVISION REQUEST: {revision_request}

CURRENT TITLE: {post.title}

CURRENT CONTENT:
{post.content}

Please provide the revised version in JSON format:
{{
    "title": "Revised title (if changed)",
    "content": "Revised content in markdown format"
}}
"""
        
        # Call LLM API (use the same provider that generated the post)
        llm_provider = post.generated_by or 'manus'
        response_text = call_llm_api(llm_provider, prompt)
        
        # Parse response
        try:
            import json
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                response_data = json.loads(response_text[json_start:json_end])
            else:
                response_data = {'content': response_text}
        except:
            response_data = {'content': response_text}
        
        # Update post
        if 'title' in response_data and response_data['title']:
            post.title = response_data['title']
            post.slug = create_slug(response_data['title'])
        
        if 'content' in response_data:
            post.content = response_data['content']
        
        post.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'post': post.to_dict(),
            'message': 'Blog post revised successfully'
        }), 200
        
    except Exception as e:
        print(f"Error revising blog post: {e}")
        return jsonify({'error': str(e)}), 500

@blog_ai_bp.route('/api/blog/approve/<int:post_id>', methods=['POST'])
@admin_required
def approve_post(current_user, post_id):
    """
    Approve a blog post for publication
    """
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Submit for approval or publish directly
        if post.status == 'draft':
            post.submit_for_approval(current_user.id)
        elif post.status == 'pending_approval':
            post.approve(current_user.id, publish_immediately=True)
        
        return jsonify({
            'success': True,
            'post': post.to_dict(),
            'message': 'Post status updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error approving post: {e}")
        return jsonify({'error': str(e)}), 500

@blog_ai_bp.route('/api/blog/reject/<int:post_id>', methods=['POST'])
@admin_required
def reject_post(current_user, post_id):
    """
    Reject a blog post
    """
    try:
        data = request.json
        reason = data.get('reason', 'No reason provided')
        
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        post.reject(current_user.id, reason)
        
        return jsonify({
            'success': True,
            'message': 'Post rejected'
        }), 200
        
    except Exception as e:
        print(f"Error rejecting post: {e}")
        return jsonify({'error': str(e)}), 500
