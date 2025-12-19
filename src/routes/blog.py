from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.blog import BlogPost
import re

blog_bp = Blueprint('blog', __name__)

def create_slug(title):
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

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
        
        # Order by published date (most recent first)
        query = query.order_by(BlogPost.published_at.desc())
        
        # Pagination
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'posts': [post.to_dict() for post in paginated.items],
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
        
        return jsonify(post.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/api/blog/posts', methods=['POST'])
def create_post():
    """Create a new blog post"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'content', 'category', 'author']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create slug from title
        slug = create_slug(data['title'])
        
        # Check if slug already exists
        existing_post = BlogPost.query.filter_by(slug=slug).first()
        if existing_post:
            # Append timestamp to make it unique
            slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
        
        # Create new post
        post = BlogPost(
            title=data['title'],
            slug=slug,
            content=data['content'],
            excerpt=data.get('excerpt', data['content'][:200] + '...'),
            category=data['category'],
            author=data['author'],
            status=data.get('status', 'draft'),
            featured_image=data.get('featured_image'),
            tags=','.join(data.get('tags', [])) if isinstance(data.get('tags'), list) else data.get('tags', '')
        )
        
        # Set published_at if status is published
        if post.status == 'published':
            post.published_at = datetime.utcnow()
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify(post.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/api/blog/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """Update an existing blog post"""
    try:
        post = BlogPost.query.get(post_id)
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        data = request.json
        
        # Update fields
        if 'title' in data:
            post.title = data['title']
            # Update slug if title changed
            post.slug = create_slug(data['title'])
        
        if 'content' in data:
            post.content = data['content']
        
        if 'excerpt' in data:
            post.excerpt = data['excerpt']
        
        if 'category' in data:
            post.category = data['category']
        
        if 'author' in data:
            post.author = data['author']
        
        if 'status' in data:
            post.status = data['status']
            # Set published_at when changing to published
            if data['status'] == 'published' and not post.published_at:
                post.published_at = datetime.utcnow()
        
        if 'featured_image' in data:
            post.featured_image = data['featured_image']
        
        if 'tags' in data:
            post.tags = ','.join(data['tags']) if isinstance(data['tags'], list) else data['tags']
        
        post.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(post.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/api/blog/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """Delete a blog post"""
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
        
        return jsonify([
            {'name': cat[0], 'count': cat[1]} for cat in categories
        ]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/api/blog/recent', methods=['GET'])
def get_recent_posts():
    """Get recent blog posts"""
    try:
        limit = int(request.args.get('limit', 5))
        
        posts = BlogPost.query.filter_by(status='published')\
            .order_by(BlogPost.published_at.desc())\
            .limit(limit).all()
        
        return jsonify([post.to_dict() for post in posts]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
