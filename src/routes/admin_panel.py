"""
Admin Panel Routes for TenantGuard - Fixed for PostgreSQL Migration
Uses SQLAlchemy ORM for database-agnostic operations
"""

from flask import Blueprint, jsonify, request, current_app
from functools import wraps
import jwt
import os
from datetime import datetime
from src.models.user import db
from src.models.auth_user import AuthUser
from src.models.blog import BlogPost
from src.models.case import Case

admin_panel_bp = Blueprint('admin_panel', __name__, url_prefix='/api/admin')
from src.routes.auth import admin_required

# Dashboard Stats
@admin_panel_bp.route('/stats', methods=['GET'])
@admin_required
def get_dashboard_stats(current_user):
    """Get dashboard statistics"""
    try:
        # Total users
        total_users = AuthUser.query.count()
        
        # Pending blog posts
        pending_blog_posts = BlogPost.query.filter(
            (BlogPost.status == 'pending') | 
            (BlogPost.status == 'draft') |
            (BlogPost.status == 'pending_approval')
        ).count()
        
        # New tenant cases
        new_tenant_cases = Case.query.filter(
            (Case.status == 'pending') | 
            (Case.status == 'new') |
            (Case.status == 'intake_submitted')
        ).count()
        
        # Pending lawyer applications
        # Note: Attorney model needs to be converted to SQLAlchemy
        # For now, return 0 or query from raw SQL if needed
        pending_lawyer_applications = 0
        
        return jsonify({
            'totalUsers': total_users,
            'pendingBlogPosts': pending_blog_posts,
            'newTenantCases': new_tenant_cases,
            'pendingLawyerApplications': pending_lawyer_applications
        })
    except Exception as e:
        print(f"[ADMIN_ERROR] Stats error: {e}")
        return jsonify({'error': str(e)}), 500

# User Management
@admin_panel_bp.route('/users', methods=['GET'])
@admin_required
def list_users(current_user):
    """List all users with optional search"""
    search = request.args.get('search', '')
    
    try:
        query = AuthUser.query
        
        if search:
            search_filter = f'%{search}%'
            query = query.filter(
                (AuthUser.username.ilike(search_filter)) |
                (AuthUser.email.ilike(search_filter)) |
                (AuthUser.full_name.ilike(search_filter))
            )
        
        users = query.order_by(AuthUser.created_at.desc()).all()
        
        return jsonify([{
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'full_name': user.full_name,
            'role': user.role,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None
        } for user in users])
    except Exception as e:
        print(f"[ADMIN_ERROR] List users error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    """Update user role"""
    data = request.json
    role = data.get('role')
    
    if role not in ['admin', 'editor', 'viewer', 'user']:
        return jsonify({'error': 'Invalid role'}), 400
    
    try:
        user = AuthUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.role = role
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Update role error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/users/<int:user_id>/toggle-active', methods=['PUT'])
@admin_required
def toggle_user_active(user_id):
    """Toggle user active status"""
    data = request.json
    is_active = data.get('isActive', True)
    
    try:
        user = AuthUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_active = is_active
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Toggle active error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user details"""
    data = request.json
    
    try:
        user = AuthUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update fields if provided
        if 'username' in data:
            # Check if username is already taken
            existing = AuthUser.query.filter_by(username=data['username']).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Username already exists'}), 400
            user.username = data['username']
        
        if 'email' in data:
            # Check if email is already taken
            existing = AuthUser.query.filter_by(email=data['email']).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email']
        
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        if 'role' in data:
            if data['role'] not in ['admin', 'editor', 'viewer', 'user']:
                return jsonify({'error': 'Invalid role'}), 400
            user.role = data['role']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Update user error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user"""
    try:
        user = AuthUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Delete user error: {e}")
        return jsonify({'error': str(e)}), 500

# Blog Post Management
@admin_panel_bp.route('/blog-posts', methods=['GET'])
@admin_required
def list_blog_posts(current_user):
    """List blog posts with optional filtering"""
    status = request.args.get('status')
    search = request.args.get('search', '')
    
    try:
        query = BlogPost.query
        
        if status:
            query = query.filter(BlogPost.status == status)
        
        if search:
            search_filter = f'%{search}%'
            query = query.filter(
                (BlogPost.title.ilike(search_filter)) |
                (BlogPost.content.ilike(search_filter))
            )
        
        posts = query.order_by(BlogPost.created_at.desc()).all()
        
        return jsonify([{
            'id': post.id,
            'title': post.title,
            'slug': post.slug,
            'content': post.content,
            'excerpt': post.excerpt,
            'author': post.author,
            'status': post.status,
            'category': post.category,
            'created_at': post.created_at.isoformat() if post.created_at else None,
            'updated_at': post.updated_at.isoformat() if post.updated_at else None,
            'published_at': post.published_at.isoformat() if post.published_at else None
        } for post in posts])
    except Exception as e:
        print(f"[ADMIN_ERROR] List blog posts error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/blog-posts/<int:post_id>/approve', methods=['PUT'])
@admin_required
def approve_blog_post(post_id):
    """Approve a blog post"""
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Blog post not found'}), 404
        
        post.status = 'published'
        post.published_at = datetime.utcnow()
        post.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Approve blog post error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/blog-posts/<int:post_id>/reject', methods=['PUT'])
@admin_required
def reject_blog_post(post_id):
    """Reject a blog post"""
    data = request.json
    reason = data.get('reason', '')
    
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Blog post not found'}), 404
        
        post.status = 'rejected'
        if hasattr(post, 'rejection_reason'):
            post.rejection_reason = reason
        post.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Reject blog post error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/blog-posts/<int:post_id>', methods=['PUT'])
@admin_required
def update_blog_post(post_id):
    """Update blog post details"""
    data = request.json
    
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Blog post not found'}), 404
        
        # Update fields if provided
        if 'title' in data:
            post.title = data['title']
        
        if 'content' in data:
            post.content = data['content']
        
        if 'excerpt' in data:
            post.excerpt = data['excerpt']
        
        if 'author' in data:
            post.author = data['author']
        
        if 'status' in data:
            post.status = data['status']
            if data['status'] == 'published' and not post.published_at:
                post.published_at = datetime.utcnow()
        
        if 'category' in data:
            post.category = data['category']
        
        post.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Update blog post error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/blog-posts/<int:post_id>/publish', methods=['PUT'])
@admin_required
def publish_blog_post(post_id):
    """Publish a blog post"""
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Blog post not found'}), 404
        
        post.status = 'published'
        post.published_at = datetime.utcnow()
        post.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Publish blog post error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/blog-posts/<int:post_id>/unpublish', methods=['PUT'])
@admin_required
def unpublish_blog_post(post_id):
    """Unpublish a blog post (set to draft)"""
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Blog post not found'}), 404
        
        post.status = 'draft'
        post.published_at = None
        post.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Unpublish blog post error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/blog-posts/<int:post_id>', methods=['DELETE'])
@admin_required
def delete_blog_post(post_id):
    """Delete a blog post"""
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Blog post not found'}), 404
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Delete blog post error: {e}")
        return jsonify({'error': str(e)}), 500

# Tenant Case Management
@admin_panel_bp.route('/tenant-cases', methods=['GET'])
@admin_required
def list_tenant_cases(current_user):
    """List tenant cases with optional filtering"""
    status = request.args.get('status')
    urgency = request.args.get('urgency')
    search = request.args.get('search', '')
    
    try:
        query = Case.query
        
        if status:
            query = query.filter(Case.status == status)
        
        if urgency:
            query = query.filter(Case.urgency_level == urgency)
        
        if search:
            search_filter = f'%{search}%'
            query = query.filter(
                (Case.first_name.ilike(search_filter)) |
                (Case.last_name.ilike(search_filter)) |
                (Case.email.ilike(search_filter)) |
                (Case.case_number.ilike(search_filter))
            )
        
        cases = query.order_by(Case.created_at.desc()).all()
        
        return jsonify([{
            'id': case.id,
            'case_number': case.case_number,
            'first_name': case.first_name,
            'last_name': case.last_name,
            'tenant_name': f"{case.first_name} {case.last_name}",
            'email': case.email,
            'tenant_email': case.email,
            'phone': case.phone,
            'tenant_phone': case.phone,
            'rental_address': case.rental_address,
            'property_address': case.rental_address,
            'issue_type': case.issue_type,
            'case_type': case.issue_type,
            'urgency_level': case.urgency_level,
            'urgency': case.urgency_level,
            'status': case.status,
            'issue_description': case.issue_description,
            'description': case.issue_description,
            'created_at': case.created_at.isoformat() if case.created_at else None,
            'updated_at': case.updated_at.isoformat() if case.updated_at else None
        } for case in cases])
    except Exception as e:
        print(f"[ADMIN_ERROR] List tenant cases error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/tenant-cases/<int:case_id>/status', methods=['PUT'])
@admin_required
def update_case_status(case_id):
    """Update tenant case status"""
    data = request.json
    status = data.get('status')
    
    valid_statuses = ['new', 'pending', 'reviewing', 'assigned', 'in_progress', 'resolved', 'closed', 'intake_submitted']
    if status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    try:
        case = Case.query.get(case_id)
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        case.status = status
        case.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Update case status error: {e}")
        return jsonify({'error': str(e)}), 500

# Lawyer Application Management
@admin_panel_bp.route('/lawyer-applications', methods=['GET'])
@admin_required
def list_lawyer_applications(current_user):
    """List lawyer applications with optional filtering"""
    status = request.args.get('status')
    search = request.args.get('search', '')
    
    try:
        # Note: Attorney model needs to be converted to SQLAlchemy
        # For now, return empty list or use raw SQL
        # This is a placeholder that needs to be updated when Attorney model is migrated
        
        # TODO: Implement when Attorney model is converted to SQLAlchemy
        return jsonify([])
        
    except Exception as e:
        print(f"[ADMIN_ERROR] List lawyer applications error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/lawyer-applications/<int:app_id>/approve', methods=['PUT'])
@admin_required
def approve_lawyer_application(app_id):
    """Approve a lawyer application"""
    try:
        # TODO: Implement when Attorney model is converted to SQLAlchemy
        return jsonify({'success': True})
    except Exception as e:
        print(f"[ADMIN_ERROR] Approve lawyer application error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_panel_bp.route('/lawyer-applications/<int:app_id>/reject', methods=['PUT'])
@admin_required
def reject_lawyer_application(app_id):
    """Reject a lawyer application"""
    data = request.json
    reason = data.get('reason', '')
    
    try:
        # TODO: Implement when Attorney model is converted to SQLAlchemy
        return jsonify({'success': True})
    except Exception as e:
        print(f"[ADMIN_ERROR] Reject lawyer application error: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================
# Additional CRUD Endpoints
# ============================================

# Create User
@admin_panel_bp.route('/users', methods=['POST'])
@admin_required
def create_user(current_user):
    """Create a new user"""
    data = request.json
    
    # Validate required fields
    required_fields = ['email', 'username']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        # Check if email already exists
        if AuthUser.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Check if username already exists
        if AuthUser.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Create new user
        user = AuthUser(
            email=data['email'],
            username=data['username'],
            full_name=data.get('full_name', ''),
            role=data.get('role', 'user'),
            is_active=data.get('is_active', True),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'success': True, 'id': user.id})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Create user error: {e}")
        return jsonify({'error': str(e)}), 500

# Get single user details
@admin_panel_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    """Get a single user's details"""
    try:
        user = AuthUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'full_name': user.full_name,
            'role': user.role,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None
        })
    except Exception as e:
        print(f"[ADMIN_ERROR] Get user error: {e}")
        return jsonify({'error': str(e)}), 500

# Create Blog Post
@admin_panel_bp.route('/blog-posts', methods=['POST'])
@admin_required
def create_blog_post(current_user):
    """Create a new blog post"""
    data = request.json
    
    # Validate required fields
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    if not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
    
    try:
        # Generate slug from title
        import re
        slug = re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')
        
        # Check if slug already exists
        if BlogPost.query.filter_by(slug=slug).first():
            # Add timestamp to make unique
            slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
        
        status = data.get('status', 'draft')
        published_at = datetime.utcnow() if status == 'published' else None
        
        post = BlogPost(
            title=data['title'],
            slug=slug,
            content=data['content'],
            excerpt=data.get('excerpt', ''),
            author=data.get('author', 'Admin'),
            status=status,
            category=data.get('category', 'general'),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            published_at=published_at
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({'success': True, 'id': post.id, 'slug': slug})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Create blog post error: {e}")
        return jsonify({'error': str(e)}), 500

# Get single blog post details
@admin_panel_bp.route('/blog-posts/<int:post_id>', methods=['GET'])
@admin_required
def get_blog_post(post_id):
    """Get a single blog post's details"""
    try:
        post = BlogPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Blog post not found'}), 404
        
        return jsonify({
            'id': post.id,
            'title': post.title,
            'slug': post.slug,
            'content': post.content,
            'excerpt': post.excerpt,
            'author': post.author,
            'status': post.status,
            'category': post.category,
            'created_at': post.created_at.isoformat() if post.created_at else None,
            'updated_at': post.updated_at.isoformat() if post.updated_at else None,
            'published_at': post.published_at.isoformat() if post.published_at else None
        })
    except Exception as e:
        print(f"[ADMIN_ERROR] Get blog post error: {e}")
        return jsonify({'error': str(e)}), 500

# Get single tenant case details
@admin_panel_bp.route('/tenant-cases/<int:case_id>', methods=['GET'])
@admin_required
def get_tenant_case(case_id):
    """Get a single tenant case's details"""
    try:
        case = Case.query.get(case_id)
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        return jsonify({
            'id': case.id,
            'case_number': case.case_number,
            'first_name': case.first_name,
            'last_name': case.last_name,
            'tenant_name': f"{case.first_name} {case.last_name}",
            'email': case.email,
            'tenant_email': case.email,
            'phone': case.phone,
            'tenant_phone': case.phone,
            'rental_address': case.rental_address,
            'property_address': case.rental_address,
            'issue_type': case.issue_type,
            'case_type': case.issue_type,
            'urgency_level': case.urgency_level,
            'urgency': case.urgency_level,
            'status': case.status,
            'issue_description': case.issue_description,
            'description': case.issue_description,
            'created_at': case.created_at.isoformat() if case.created_at else None,
            'updated_at': case.updated_at.isoformat() if case.updated_at else None
        })
    except Exception as e:
        print(f"[ADMIN_ERROR] Get tenant case error: {e}")
        return jsonify({'error': str(e)}), 500

# Delete tenant case
@admin_panel_bp.route('/tenant-cases/<int:case_id>', methods=['DELETE'])
@admin_required
def delete_tenant_case(case_id):
    """Delete a tenant case"""
    try:
        case = Case.query.get(case_id)
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        db.session.delete(case)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN_ERROR] Delete tenant case error: {e}")
        return jsonify({'error': str(e)}), 500

# Get single lawyer application details
@admin_panel_bp.route('/lawyer-applications/<int:app_id>', methods=['GET'])
@admin_required
def get_lawyer_application(app_id):
    """Get a single lawyer application's details"""
    try:
        # TODO: Implement when Attorney model is converted to SQLAlchemy
        return jsonify({'error': 'Not implemented yet'}), 501
    except Exception as e:
        print(f"[ADMIN_ERROR] Get lawyer application error: {e}")
        return jsonify({'error': str(e)}), 500

# Delete lawyer application
@admin_panel_bp.route('/lawyer-applications/<int:app_id>', methods=['DELETE'])
@admin_required
def delete_lawyer_application(app_id):
    """Delete a lawyer application"""
    try:
        # TODO: Implement when Attorney model is converted to SQLAlchemy
        return jsonify({'success': True})
    except Exception as e:
        print(f"[ADMIN_ERROR] Delete lawyer application error: {e}")
        return jsonify({'error': str(e)}), 500
