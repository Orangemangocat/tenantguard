"""
Blog Post Approval Queue API Routes
Handles approval workflow for blog posts
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.blog import BlogPost
from src.routes.auth import token_required, admin_required

blog_approval_bp = Blueprint('blog_approval', __name__)

# ============================================================================
# APPROVAL QUEUE ROUTES
# ============================================================================

@blog_approval_bp.route('/api/blog/approval/pending', methods=['GET'])
@token_required
def get_pending_posts(current_user):
    """Get all posts pending approval"""
    
    # Only admins can view pending posts
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin permission required'}), 403
    
    try:
        pending_posts = BlogPost.query.filter_by(status='pending_approval').order_by(BlogPost.submitted_for_approval_at.desc()).all()
        
        return jsonify({
            'pending_posts': [post.to_dict(include_workflow=True) for post in pending_posts],
            'count': len(pending_posts)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blog_approval_bp.route('/api/blog/approval/pending/<int:post_id>', methods=['GET'])
@admin_required
def get_pending_post(current_user, post_id):
    """Get a specific pending post"""
    
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        if post.status != 'pending_approval':
            return jsonify({'error': 'Post is not pending approval'}), 400
        
        return jsonify({'post': post.to_dict(include_workflow=True)}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blog_approval_bp.route('/api/blog/approval/approve/<int:post_id>', methods=['POST'])
@admin_required
def approve_post(current_user, post_id):
    """Approve a pending post"""
    
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        if post.status != 'pending_approval':
            return jsonify({'error': 'Post is not pending approval'}), 400
        
        data = request.json or {}
        notes = data.get('notes')
        publish_immediately = data.get('publish_immediately', True)
        
        # Approve the post
        post.approve(current_user.id, notes=notes, publish_immediately=publish_immediately)
        
        return jsonify({
            'message': 'Post approved successfully',
            'post': post.to_dict(include_workflow=True)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_approval_bp.route('/api/blog/approval/reject/<int:post_id>', methods=['POST'])
@admin_required
def reject_post(current_user, post_id):
    """Reject a pending post"""
    
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        if post.status != 'pending_approval':
            return jsonify({'error': 'Post is not pending approval'}), 400
        
        data = request.json
        reason = data.get('reason')
        
        if not reason:
            return jsonify({'error': 'Rejection reason is required'}), 400
        
        # Reject the post
        post.reject(current_user.id, reason=reason)
        
        return jsonify({
            'message': 'Post rejected successfully',
            'post': post.to_dict(include_workflow=True)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_approval_bp.route('/api/blog/approval/bulk-approve', methods=['POST'])
@admin_required
def bulk_approve_posts(current_user):
    """Approve multiple posts at once"""
    
    try:
        data = request.json
        post_ids = data.get('post_ids', [])
        notes = data.get('notes')
        publish_immediately = data.get('publish_immediately', True)
        
        if not post_ids:
            return jsonify({'error': 'No post IDs provided'}), 400
        
        approved_count = 0
        errors = []
        
        for post_id in post_ids:
            try:
                post = BlogPost.query.get(post_id)
                if post and post.status == 'pending_approval':
                    post.approve(current_user.id, notes=notes, publish_immediately=publish_immediately)
                    approved_count += 1
                else:
                    errors.append(f"Post {post_id} not found or not pending")
            except Exception as e:
                errors.append(f"Error approving post {post_id}: {str(e)}")
        
        return jsonify({
            'message': f'Approved {approved_count} posts',
            'approved_count': approved_count,
            'errors': errors if errors else None
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_approval_bp.route('/api/blog/approval/statistics', methods=['GET'])
@admin_required
def get_approval_statistics(current_user):
    """Get approval queue statistics"""
    
    try:
        try:
            pending_count = BlogPost.query.filter_by(status='pending_approval').count()
            approved_count = BlogPost.query.filter_by(status='approved').count()
            rejected_count = BlogPost.query.filter_by(status='rejected').count()
            published_count = BlogPost.query.filter_by(status='published').count()
            
            # Get oldest pending post
            oldest_pending = BlogPost.query.filter_by(status='pending_approval').order_by(BlogPost.submitted_for_approval_at.asc()).first()
            
            # Get recent approvals
            recent_approvals = BlogPost.query.filter(
                BlogPost.status.in_(['approved', 'published']),
                BlogPost.approved_at.isnot(None)
            ).order_by(BlogPost.approved_at.desc()).limit(5).all()
            
            # Get recent rejections
            recent_rejections = BlogPost.query.filter_by(status='rejected').order_by(BlogPost.rejected_at.desc()).limit(5).all()
        except Exception as db_error:
            # If tables don't exist yet, return empty data
            print(f"[blog_approval_statistics] Database query error: {db_error}")
            pending_count = approved_count = rejected_count = published_count = 0
            oldest_pending = None
            recent_approvals = []
            recent_rejections = []
        
        return jsonify({
            'pending_count': pending_count,
            'approved_count': approved_count,
            'rejected_count': rejected_count,
            'published_count': published_count,
            'oldest_pending': oldest_pending.to_dict(include_workflow=True) if oldest_pending else None,
            'recent_approvals': [post.to_dict(include_workflow=True) for post in recent_approvals],
            'recent_rejections': [post.to_dict(include_workflow=True) for post in recent_rejections]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# POST SUBMISSION ROUTES (For editors and Manus)
# ============================================================================

@blog_approval_bp.route('/api/blog/posts/<int:post_id>/submit-for-approval', methods=['POST'])
@token_required
def submit_post_for_approval(current_user, post_id):
    """Submit a draft post for approval"""
    
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Check permissions
        if post.status != 'draft':
            return jsonify({'error': 'Only draft posts can be submitted for approval'}), 400
        
        # Submit for approval
        post.submit_for_approval(user_id=current_user.id)
        
        return jsonify({
            'message': 'Post submitted for approval',
            'post': post.to_dict(include_workflow=True)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_approval_bp.route('/api/blog/posts/create-and-submit', methods=['POST'])
@token_required
def create_and_submit_post(current_user):
    """Create a new post and submit for approval (for Manus or editors)"""
    
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('title') or not data.get('content') or not data.get('category'):
            return jsonify({'error': 'Title, content, and category are required'}), 400
        
        # Generate slug
        import re
        slug = re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')
        
        # Check if slug exists
        existing_post = BlogPost.query.filter_by(slug=slug).first()
        if existing_post:
            slug = f"{slug}-{secrets.token_hex(4)}"
        
        # Create new post
        post = BlogPost(
            title=data['title'],
            slug=slug,
            content=data['content'],
            excerpt=data.get('excerpt', ''),
            category=data['category'],
            author=data.get('author', current_user.full_name or current_user.username),
            featured_image=data.get('featured_image', ''),
            tags=data.get('tags', ''),
            generated_by=data.get('generated_by', 'human'),
            generation_source=data.get('generation_source', 'manual'),
            status='pending_approval'
        )
        
        db.session.add(post)
        db.session.flush()  # Get post ID
        
        # Submit for approval
        post.submit_for_approval(user_id=current_user.id)
        
        return jsonify({
            'message': 'Post created and submitted for approval',
            'post': post.to_dict(include_workflow=True)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
