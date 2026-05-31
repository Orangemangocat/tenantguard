from flask import Blueprint, request, jsonify, redirect
from datetime import datetime
from urllib.parse import urlparse
import re
import os
import unicodedata

from src.models.user import db
from src.models.blog import BlogPost
from src.models.blog_slug import BlogSlugHistory
from src.routes.auth import admin_required
from src.services.blog_content import normalize_blog_content

blog_bp = Blueprint('blog', __name__)


def create_slug(title, max_len=90):
    """Create SEO-friendly URL slug from title (ASCII, predictable)."""
    if not title:
        return ""

    value = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    value = value.lower().strip()
    value = value.replace("_", " ")
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s-]+", "-", value).strip("-")

    if len(value) > max_len:
        value = value[:max_len].rstrip("-")

    return value or "post"


def ensure_unique_slug(base_slug, post_id=None):
    """
    Ensure slug is unique. If post_id provided, ignore that post during uniqueness check.
    Generates base-slug, base-slug-2, base-slug-3...
    """
    slug = base_slug
    counter = 2

    while True:
        q = BlogPost.query.filter_by(slug=slug)
        if post_id is not None:
            q = q.filter(BlogPost.id != post_id)

        if not q.first():
            return slug

        slug = f"{base_slug}-{counter}"
        counter += 1


def _detect_media_type(value):
    if not value:
        return None
    path = urlparse(value).path if "://" in value else value
    path = path.split("?", 1)[0].split("#", 1)[0]
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    if ext in {"mp3", "wav", "ogg", "m4a"}:
        return "audio"
    if ext in {"mp4", "webm", "mov"}:
        return "video"
    return None


@blog_bp.route('/api/blog/posts', methods=['GET'])
def get_posts():
    """Get all blog posts with optional filtering"""
    try:
        category = request.args.get('category')
        status = request.args.get('status', 'published')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))

        query = BlogPost.query

        if category:
            query = query.filter_by(category=category)

        if status:
            query = query.filter_by(status=status)

        query = query.order_by(db.func.coalesce(BlogPost.published_at, BlogPost.created_at).desc())

        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'posts': [
                {**post.to_dict(), 'content': normalize_blog_content(post.content)}
                for post in paginated.items
            ],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blog_bp.route('/api/blog/posts/<slug>', methods=['GET'])
def get_post(slug):
    """Get a single blog post by slug"""
    try:
        post = BlogPost.query.filter_by(slug=slug).first()
        if not post:
            return jsonify({'error': 'Post not found'}), 404

        post_data = post.to_dict()
        post_data['content'] = normalize_blog_content(post.content)
        return jsonify(post_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blog_bp.route('/api/blog/posts', methods=['POST'])
@admin_required
def create_post(current_user):
    """Create a new blog post - Admin only"""
    try:
        data = request.json or {}

        required_fields = ['title', 'content', 'category', 'author']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        base_slug = create_slug(data['title'])
        slug = ensure_unique_slug(base_slug)

        content = normalize_blog_content(data['content'])
        excerpt = data.get('excerpt') or (data['content'][:200] + '...')

        post = BlogPost(
            title=data['title'],
            slug=slug,
            content=content,
            excerpt=excerpt,
            category=data['category'],
            author=data['author'],
            status=data.get('status', 'draft'),
            featured_image=data.get('featured_image'),
            media_url=data.get('media_url'),
            tags=','.join(data.get('tags', [])) if isinstance(data.get('tags'), list) else data.get('tags', '')
        )

        if post.status == 'published':
            post.published_at = datetime.utcnow()

        db.session.add(post)
        db.session.commit()

        if post.status == 'published':
            try:
                post.publish(source='blog_api_create')
            except Exception as exc:
                print(f"[seo_ping] Blog publish ping failed: {exc}")

        return jsonify(post.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_bp.route('/api/blog/posts/<int:post_id>', methods=['PUT'])
@admin_required
def update_post(current_user, post_id):
    """Update an existing blog post - Admin only"""
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404

        data = request.json or {}

        old_slug = post.slug

        if 'title' in data:
            new_title = (data['title'] or '').strip()
            if new_title and new_title != post.title:
                post.title = new_title
                base_slug = create_slug(new_title)
                post.slug = ensure_unique_slug(base_slug, post_id=post.id)

        if 'content' in data:
            post.content = normalize_blog_content(data['content'])

        if 'excerpt' in data:
            post.excerpt = data['excerpt']

        if 'category' in data:
            post.category = data['category']

        if 'author' in data:
            post.author = data['author']

        if 'status' in data:
            post.status = data['status']
            if data['status'] == 'published' and not post.published_at:
                post.published_at = datetime.utcnow()

        if 'featured_image' in data:
            post.featured_image = data['featured_image']

        if 'media_url' in data:
            post.media_url = data['media_url']

        if 'tags' in data:
            post.tags = ','.join(data['tags']) if isinstance(data['tags'], list) else data['tags']

        post.updated_at = datetime.utcnow()

        # If slug changed, store old slug for SEO redirects
        if old_slug and post.slug and old_slug != post.slug:
            if not BlogSlugHistory.query.filter_by(old_slug=old_slug).first():
                db.session.add(BlogSlugHistory(post_id=post.id, old_slug=old_slug))

        db.session.commit()

        if post.status == 'published':
            try:
                post.publish(source='blog_api_update')
            except Exception as exc:
                print(f"[seo_ping] Blog publish ping failed: {exc}")

        post_data = post.to_dict()
        post_data['content'] = normalize_blog_content(post.content)
        return jsonify(post_data), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_bp.route('/api/blog/posts/<int:post_id>', methods=['DELETE'])
@admin_required
def delete_post(current_user, post_id):
    """Delete a blog post - Admin only"""
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404

        db.session.delete(post)
        db.session.commit()
        return jsonify({'message': 'Post deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_bp.route('/api/blog/categories', methods=['GET'])
def get_categories():
    """Get all blog categories with post counts"""
    try:
        categories = db.session.query(
            BlogPost.category,
            db.func.count(BlogPost.id).label('count')
        ).filter_by(status='published').group_by(BlogPost.category).all()

        return jsonify([{'name': cat[0], 'count': cat[1]} for cat in categories]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blog_bp.route('/api/blog/recent', methods=['GET'])
def get_recent_posts():
    """Get recent blog posts"""
    try:
        limit = int(request.args.get('limit', 5))

        posts = BlogPost.query.filter_by(status='published') \
            .order_by(db.func.coalesce(BlogPost.published_at, BlogPost.created_at).desc()) \
            .limit(limit).all()

        return jsonify([
            {**post.to_dict(), 'content': normalize_blog_content(post.content)}
            for post in posts
        ]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blog_bp.route('/blog/<slug>')
def render_blog_post(slug):
    """Render individual blog post with SEO meta tags"""
    try:
        from flask import render_template

        # Prefer published post by current slug
        post = BlogPost.query.filter_by(slug=slug, status='published').first()

        # If not found, try old slug redirect
        if not post:
            history = BlogSlugHistory.query.filter_by(old_slug=slug).first()
            if history:
                current = BlogPost.query.get(history.post_id)
                if current and current.status == 'published':
                    return redirect(f"/blog/{current.slug}", code=301)
            return "Blog post not found", 404

        public_site_url = os.getenv("PUBLIC_SITE_URL") or request.host_url.rstrip("/")
        logo_url = f"{public_site_url}/assets/logo.png"

        post_dict = post.to_dict()
        post_dict['content'] = normalize_blog_content(post.content)

        if isinstance(post_dict.get('tags'), list):
            post_dict['tags'] = ','.join(post_dict['tags'])

        post_dict['meta_title'] = f"{post.title} | TenantGuard Blog"
        post_dict['meta_description'] = post.excerpt[:160] if post.excerpt else post.content[:160]

        # Full URLs for images/media
        if post_dict.get('featured_image') and not post_dict['featured_image'].startswith('http'):
            post_dict['featured_image'] = f"{public_site_url}{post_dict['featured_image']}"

        media_url = post_dict.get('media_url')
        if media_url and not media_url.startswith('http'):
            media_url = f"{public_site_url}{media_url}"
        post_dict['media_url'] = media_url
        post_dict['media_type'] = _detect_media_type(media_url)

        schema_markup = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post_dict['meta_description'],
            "author": {"@type": "Person", "name": post.author},
            "datePublished": post_dict.get('published_at') or post_dict.get('created_at'),
            "dateModified": post_dict.get('updated_at'),
            "publisher": {
                "@type": "Organization",
                "name": "TenantGuard",
                "logo": {"@type": "ImageObject", "url": logo_url}
            },
            "image": post_dict.get('featured_image', logo_url),
            "keywords": post_dict.get('tags', ''),
            "articleSection": post.category
        }

        return render_template('blog_post.html', post=post_dict, schema_markup=schema_markup)

    except Exception as e:
        return f"Error loading blog post: {str(e)}", 500