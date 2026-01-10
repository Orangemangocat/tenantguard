import json
from datetime import datetime

from src.main import app
from src.models.blog import BlogPost
from src.models.blog_topic import BlogTopic
from src.models.user import db
from src.services.blog_ai import call_openai_chat, parse_llm_json


ALLOWED_CATEGORIES = {'technical', 'market-research'}


def _normalize_tags(tags):
    if not tags:
        return []
    if isinstance(tags, list):
        return [tag.strip() for tag in tags if isinstance(tag, str) and tag.strip()]
    if isinstance(tags, str):
        return [tag.strip() for tag in tags.split(',') if tag.strip()]
    return []


def _normalize_links(links):
    if not links:
        return []
    if isinstance(links, list):
        return [link for link in links if link]
    if isinstance(links, str):
        return [link.strip() for link in links.splitlines() if link.strip()]
    return []


def _build_context(links, text_snippets, additional_context):
    context_parts = []
    if links:
        context_parts.append("Reference links:\n" + "\n".join(f"- {link}" for link in links))
    if text_snippets:
        context_parts.append(f"Research notes:\n{text_snippets}")
    if additional_context:
        context_parts.append(f"Additional instructions:\n{additional_context}")
    return "\n\n".join(context_parts) if context_parts else None


def _build_prompt(topic, category):
    return f"""Write a professional blog post for TenantGuard about: {topic}

The blog post should:
1. Have an engaging title
2. Include a compelling excerpt (150-200 characters)
3. Be well-structured with clear sections
4. Be informative and professional
5. Include relevant keywords for SEO
6. Be approximately 800-1200 words
7. End with a call-to-action

Category: {category}

Return ONLY valid JSON with this structure:
{{
  "title": "Blog Post Title",
  "excerpt": "Brief excerpt",
  "content": "Full blog post content in markdown format",
  "suggested_tags": ["tag1", "tag2", "tag3"]
}}
"""


def _build_revision_prompt(revision_request, title, content):
    return f"""Revise the following blog post according to these instructions:

REVISION REQUEST: {revision_request}

CURRENT TITLE: {title}

CURRENT CONTENT:
{content}

Return ONLY valid JSON with this structure:
{{
  "title": "Revised title (if changed)",
  "excerpt": "Revised excerpt (optional)",
  "content": "Revised content in markdown format"
}}
"""


def _create_slug(title):
    slug = title.lower()
    slug = ''.join(char if char.isalnum() or char in {' ', '-'} else '' for char in slug)
    slug = '-'.join(slug.split())
    return slug.strip('-')


def generate_blog_post(payload, submit_for_approval=False, topic_id=None):
    with app.app_context():
        topic_record = None
        if topic_id:
            topic_record = BlogTopic.query.get(topic_id)
            if not topic_record:
                return {'error': 'Topic not found', 'topic_id': topic_id}

        topic = payload.get('topic') or (topic_record.title if topic_record else None)
        category = payload.get('category') or (topic_record.category if topic_record else 'technical')
        author = payload.get('author', 'Manus AI')
        links = _normalize_links(payload.get('links') or [])
        text_snippets = payload.get('text_snippets', '')
        additional_context = payload.get('additional_context', '')
        provider_index = payload.get('provider_index')
        generation_source = payload.get('generation_source', 'ai_assisted')

        if not topic:
            return {'error': 'Topic is required'}
        if category not in ALLOWED_CATEGORIES:
            return {'error': f'Invalid category: {category}'}

        context = _build_context(links, text_snippets, additional_context)
        prompt = _build_prompt(topic, category)

        response_text = call_openai_chat(prompt, context=context, provider_index=provider_index)
        response_data, parse_error = parse_llm_json(response_text)
        if parse_error:
            return {'error': parse_error}

        content = response_data.get('content')
        if not content:
            return {'error': 'LLM response missing content'}

        title = response_data.get('title') or topic
        excerpt = response_data.get('excerpt') or (content[:200] + '...')
        tags = _normalize_tags(response_data.get('suggested_tags', []))

        slug = _create_slug(title) or f"blog-post-{int(datetime.utcnow().timestamp())}"
        existing_post = BlogPost.query.filter_by(slug=slug).first()
        if existing_post:
            slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

        post = BlogPost(
            title=title,
            slug=slug,
            content=content,
            excerpt=excerpt,
            category=category,
            author=author,
            status='pending_approval' if submit_for_approval else 'draft',
            tags=','.join(tags),
            generated_by='openai',
            generation_source=generation_source,
        )

        if submit_for_approval:
            post.submitted_for_approval_at = datetime.utcnow()

        db.session.add(post)
        db.session.flush()

        if topic_record:
            topic_record.blog_post_id = post.id
            topic_record.status = 'completed'
            topic_record.completed_at = datetime.utcnow()

        db.session.commit()

        return {'success': True, 'post_id': post.id}


def revise_blog_post(post_id, payload):
    with app.app_context():
        post = BlogPost.query.get(post_id)
        if not post:
            return {'error': 'Post not found', 'post_id': post_id}

        revision_request = payload.get('revision_request')
        if not revision_request:
            return {'error': 'Revision request is required'}

        provider_index = payload.get('provider_index')

        prompt = _build_revision_prompt(revision_request, post.title, post.content)
        response_text = call_openai_chat(prompt, provider_index=provider_index)
        response_data, parse_error = parse_llm_json(response_text)
        if parse_error:
            return {'error': parse_error}

        if response_data.get('title'):
            post.title = response_data['title']

        if response_data.get('content'):
            post.content = response_data['content']
        else:
            return {'error': 'LLM response missing content'}

        if response_data.get('excerpt'):
            post.excerpt = response_data['excerpt']

        post.updated_at = datetime.utcnow()
        db.session.commit()

        return {'success': True, 'post_id': post.id}
