"""
Admin Panel Routes for TenantGuard - Fixed to match actual database schema
"""

from flask import Blueprint, jsonify, request, current_app
from functools import wraps
import jwt
import os
from datetime import datetime
import sqlite3

admin_panel_bp = Blueprint('admin_panel', __name__, url_prefix='/api/admin')

def get_db():
    """Get database connection"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'tenantguard.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            # Decode JWT token
            # Use the same secret key as the auth system (auth_user.py)
            secret_key = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
            print(f"[ADMIN_DEBUG] Secret: {secret_key[:20]}... Token: {token[:30]}...")
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            print(f"[ADMIN_DEBUG] Payload: {payload}")
            user_id = payload.get('user_id')
            role = payload.get('role')
            
            # Check if user is admin
            if role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            request.current_user_id = user_id
            request.current_user_role = role
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError as e:
            print(f"[ADMIN_DEBUG] Expired: {e}")
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError as e:
            print(f"[ADMIN_DEBUG] Invalid: {type(e).__name__} - {e}")
            return jsonify({'error': 'Invalid token', 'detail': str(e)}), 401
        except Exception as e:
            print(f"[ADMIN_DEBUG] Exception: {type(e).__name__} - {e}")
            return jsonify({'error': str(e)}), 401
    
    return decorated_function

# Dashboard Stats
@admin_panel_bp.route('/stats', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Get dashboard statistics"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Total users
        cursor.execute("SELECT COUNT(*) as count FROM auth_users")
        total_users = cursor.fetchone()[0]
        
        # Pending blog posts
        cursor.execute("SELECT COUNT(*) as count FROM blog_posts WHERE status = 'pending' OR status = 'draft'")
        pending_blog_posts = cursor.fetchone()[0]
        
        # New tenant cases
        cursor.execute("SELECT COUNT(*) as count FROM cases WHERE status = 'pending' OR status = 'new'")
        new_tenant_cases = cursor.fetchone()[0]
        
        # Pending lawyer applications
        cursor.execute("SELECT COUNT(*) as count FROM attorneys WHERE status = 'pending_review' OR status = 'pending'")
        pending_lawyer_applications = cursor.fetchone()[0]
        
        return jsonify({
            'totalUsers': total_users,
            'pendingBlogPosts': pending_blog_posts,
            'newTenantCases': new_tenant_cases,
            'pendingLawyerApplications': pending_lawyer_applications
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# User Management
@admin_panel_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """List all users with optional search"""
    search = request.args.get('search', '')
    conn = get_db()
    
    try:
        cursor = conn.cursor()
        if search:
            cursor.execute("""
                SELECT id, email, username, full_name, role, is_active, 
                       created_at, updated_at, last_login
                FROM auth_users
                WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?
                ORDER BY created_at DESC
            """, (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute("""
                SELECT id, email, username, full_name, role, is_active, 
                       created_at, updated_at, last_login
                FROM auth_users
                ORDER BY created_at DESC
            """)
        
        users = [dict(row) for row in cursor.fetchall()]
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    """Update user role"""
    data = request.json
    role = data.get('role')
    
    if role not in ['admin', 'editor', 'viewer', 'user']:
        return jsonify({'error': 'Invalid role'}), 400
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE auth_users SET role = ?, updated_at = ? WHERE id = ?", 
                      (role, datetime.now().isoformat(), user_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/users/<int:user_id>/toggle-active', methods=['PUT'])
@admin_required
def toggle_user_active(user_id):
    """Toggle user active status"""
    data = request.json
    is_active = 1 if data.get('isActive', True) else 0
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE auth_users SET is_active = ?, updated_at = ? WHERE id = ?", 
                      (is_active, datetime.now().isoformat(), user_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user details"""
    data = request.json
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Build dynamic update query based on provided fields
        update_fields = []
        params = []
        
        if 'username' in data:
            update_fields.append('username = ?')
            params.append(data['username'])
        
        if 'email' in data:
            update_fields.append('email = ?')
            params.append(data['email'])
        
        if 'full_name' in data:
            update_fields.append('full_name = ?')
            params.append(data['full_name'])
        
        if 'role' in data:
            if data['role'] not in ['admin', 'editor', 'viewer', 'user']:
                return jsonify({'error': 'Invalid role'}), 400
            update_fields.append('role = ?')
            params.append(data['role'])
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        # Add updated_at
        update_fields.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        
        # Add user_id for WHERE clause
        params.append(user_id)
        
        query = f"UPDATE auth_users SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM auth_users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404
        
        # Delete the user
        cursor.execute("DELETE FROM auth_users WHERE id = ?", (user_id,))
        conn.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Blog Post Management
@admin_panel_bp.route('/blog-posts', methods=['GET'])
@admin_required
def list_blog_posts():
    """List blog posts with optional filtering"""
    status = request.args.get('status')
    search = request.args.get('search', '')
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        query = """
            SELECT id, title, slug, content, excerpt, author, status, category,
                   created_at, updated_at, published_at
            FROM blog_posts
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if search:
            query += " AND (title LIKE ? OR content LIKE ?)"
            params.extend([f'%{search}%', f'%{search}%'])
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        posts = [dict(row) for row in cursor.fetchall()]
        return jsonify(posts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/blog-posts/<int:post_id>/approve', methods=['PUT'])
@admin_required
def approve_blog_post(post_id):
    """Approve a blog post"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE blog_posts 
            SET status = 'published', published_at = ?, updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), datetime.now().isoformat(), post_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/blog-posts/<int:post_id>/reject', methods=['PUT'])
@admin_required
def reject_blog_post(post_id):
    """Reject a blog post"""
    data = request.json
    reason = data.get('reason', '')
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        # Note: blog_posts table doesn't have rejection_reason field, so we'll just update status
        cursor.execute("""
            UPDATE blog_posts 
            SET status = 'rejected', updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), post_id))
        conn.commit()
        return jsonify({'success': True, 'note': 'Rejection reason not stored in database schema'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/blog-posts/<int:post_id>', methods=['PUT'])
@admin_required
def update_blog_post(post_id):
    """Update blog post details"""
    data = request.json
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Build dynamic update query
        update_fields = []
        params = []
        
        if 'title' in data:
            update_fields.append('title = ?')
            params.append(data['title'])
        
        if 'content' in data:
            update_fields.append('content = ?')
            params.append(data['content'])
        
        if 'excerpt' in data:
            update_fields.append('excerpt = ?')
            params.append(data['excerpt'])
        
        if 'category' in data:
            update_fields.append('category = ?')
            params.append(data['category'])
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        # Add updated_at
        update_fields.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        
        # Add post_id for WHERE clause
        params.append(post_id)
        
        query = f"UPDATE blog_posts SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/blog-posts/<int:post_id>/publish', methods=['PUT'])
@admin_required
def publish_blog_post(post_id):
    """Publish a blog post"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE blog_posts 
            SET status = 'published', published_at = ?, updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), datetime.now().isoformat(), post_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/blog-posts/<int:post_id>/unpublish', methods=['PUT'])
@admin_required
def unpublish_blog_post(post_id):
    """Unpublish a blog post (set to draft)"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE blog_posts 
            SET status = 'draft', published_at = NULL, updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), post_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/blog-posts/<int:post_id>', methods=['DELETE'])
@admin_required
def delete_blog_post(post_id):
    """Delete a blog post"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Check if post exists
        cursor.execute("SELECT id FROM blog_posts WHERE id = ?", (post_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Blog post not found'}), 404
        
        # Delete the post
        cursor.execute("DELETE FROM blog_posts WHERE id = ?", (post_id,))
        conn.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Tenant Case Management
@admin_panel_bp.route('/tenant-cases', methods=['GET'])
@admin_required
def list_tenant_cases():
    """List tenant cases with optional filtering"""
    status = request.args.get('status')
    urgency = request.args.get('urgency')
    search = request.args.get('search', '')
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        query = """
            SELECT id, case_number, first_name, last_name, email, phone,
                   rental_address, issue_type, urgency_level, status,
                   issue_description, created_at, updated_at
            FROM cases
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if urgency:
            query += " AND urgency_level = ?"
            params.append(urgency)
        
        if search:
            query += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR issue_description LIKE ?)"
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        cases = [dict(row) for row in cursor.fetchall()]
        
        # Format for frontend - combine first_name and last_name into tenant_name
        for case in cases:
            case['tenant_name'] = f"{case.get('first_name', '')} {case.get('last_name', '')}".strip()
            case['tenant_email'] = case.get('email')
            case['tenant_phone'] = case.get('phone')
            case['property_address'] = case.get('rental_address')
            case['case_type'] = case.get('issue_type')
            case['urgency'] = case.get('urgency_level')
            case['description'] = case.get('issue_description')
        
        return jsonify(cases)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/tenant-cases/<int:case_id>/status', methods=['PUT'])
@admin_required
def update_case_status(case_id):
    """Update case status"""
    data = request.json
    status = data.get('status')
    
    valid_statuses = ['new', 'pending', 'reviewing', 'assigned', 'in_progress', 'resolved', 'closed']
    if status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE cases SET status = ?, updated_at = ? WHERE id = ?", 
                      (status, datetime.now().isoformat(), case_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Lawyer Application Management
@admin_panel_bp.route('/lawyer-applications', methods=['GET'])
@admin_required
def list_lawyer_applications():
    """List lawyer applications with optional filtering"""
    status = request.args.get('status')
    search = request.args.get('search', '')
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        query = """
            SELECT id, application_id, first_name, last_name, email, phone, 
                   bar_number, bar_state, years_experience, firm_name, firm_address,
                   specializations, status, reviewer_notes, application_date, review_date
            FROM attorneys
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if search:
            query += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR bar_number LIKE ?)"
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])
        
        query += " ORDER BY application_date DESC"
        
        cursor.execute(query, params)
        applications = [dict(row) for row in cursor.fetchall()]
        
        # Format for frontend
        for app in applications:
            app['full_name'] = f"{app.get('first_name', '')} {app.get('last_name', '')}".strip()
            app['rejection_reason'] = app.get('reviewer_notes')
            app['created_at'] = app.get('application_date')
            app['reviewed_at'] = app.get('review_date')
            app['bio'] = None  # Not in schema
            app['firm_address'] = app.get('firm_address')
        
        return jsonify(applications)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/lawyer-applications/<int:app_id>/approve', methods=['PUT'])
@admin_required
def approve_lawyer_application(app_id):
    """Approve a lawyer application"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE attorneys 
            SET status = 'approved', 
                review_date = ?,
                approval_date = ?,
                profile_active = 1,
                updated_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), datetime.now().isoformat(), 
              datetime.now().isoformat(), app_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@admin_panel_bp.route('/lawyer-applications/<int:app_id>/reject', methods=['PUT'])
@admin_required
def reject_lawyer_application(app_id):
    """Reject a lawyer application"""
    data = request.json
    reason = data.get('reason', '')
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE attorneys 
            SET status = 'rejected', 
                reviewer_notes = ?, 
                review_date = ?,
                updated_at = ?
            WHERE id = ?
        """, (reason, datetime.now().isoformat(), datetime.now().isoformat(), app_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ============================================
# Additional CRUD Endpoints
# ============================================

# Create User
@admin_panel_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """Create a new user"""
    data = request.json
    
    # Validate required fields
    required_fields = ['email', 'username']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT id FROM auth_users WHERE email = ?", (data['email'],))
        if cursor.fetchone():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Check if username already exists
        cursor.execute("SELECT id FROM auth_users WHERE username = ?", (data['username'],))
        if cursor.fetchone():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Insert new user
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO auth_users (email, username, full_name, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data['email'],
            data['username'],
            data.get('full_name', ''),
            data.get('role', 'user'),
            1 if data.get('is_active', True) else 0,
            now,
            now
        ))
        conn.commit()
        
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get single user details
@admin_panel_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    """Get a single user's details"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, email, username, full_name, role, is_active, 
                   created_at, updated_at, last_login
            FROM auth_users
            WHERE id = ?
        """, (user_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(dict(row))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Create Blog Post
@admin_panel_bp.route('/blog-posts', methods=['POST'])
@admin_required
def create_blog_post():
    """Create a new blog post"""
    data = request.json
    
    # Validate required fields
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    if not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Generate slug from title
        import re
        slug = re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')
        
        # Check if slug already exists
        cursor.execute("SELECT id FROM blog_posts WHERE slug = ?", (slug,))
        if cursor.fetchone():
            # Add timestamp to make unique
            slug = f"{slug}-{int(datetime.now().timestamp())}"
        
        now = datetime.now().isoformat()
        status = data.get('status', 'draft')
        published_at = now if status == 'published' else None
        
        cursor.execute("""
            INSERT INTO blog_posts (title, slug, content, excerpt, author, status, category, created_at, updated_at, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['title'],
            slug,
            data['content'],
            data.get('excerpt', ''),
            data.get('author', 'Admin'),
            status,
            data.get('category', 'general'),
            now,
            now,
            published_at
        ))
        conn.commit()
        
        return jsonify({'success': True, 'id': cursor.lastrowid, 'slug': slug})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get single blog post details
@admin_panel_bp.route('/blog-posts/<int:post_id>', methods=['GET'])
@admin_required
def get_blog_post(post_id):
    """Get a single blog post's details"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, slug, content, excerpt, author, status, category,
                   created_at, updated_at, published_at
            FROM blog_posts
            WHERE id = ?
        """, (post_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Blog post not found'}), 404
        
        return jsonify(dict(row))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get single tenant case details
@admin_panel_bp.route('/tenant-cases/<int:case_id>', methods=['GET'])
@admin_required
def get_tenant_case(case_id):
    """Get a single tenant case's details"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, case_number, first_name, last_name, email, phone,
                   rental_address, issue_type, urgency_level, status,
                   issue_description, created_at, updated_at
            FROM cases
            WHERE id = ?
        """, (case_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Case not found'}), 404
        
        case = dict(row)
        case['tenant_name'] = f"{case.get('first_name', '')} {case.get('last_name', '')}".strip()
        case['tenant_email'] = case.get('email')
        case['tenant_phone'] = case.get('phone')
        case['property_address'] = case.get('rental_address')
        case['case_type'] = case.get('issue_type')
        case['urgency'] = case.get('urgency_level')
        case['description'] = case.get('issue_description')
        
        return jsonify(case)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Delete tenant case
@admin_panel_bp.route('/tenant-cases/<int:case_id>', methods=['DELETE'])
@admin_required
def delete_tenant_case(case_id):
    """Delete a tenant case"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Check if case exists
        cursor.execute("SELECT id FROM cases WHERE id = ?", (case_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Case not found'}), 404
        
        # Delete the case
        cursor.execute("DELETE FROM cases WHERE id = ?", (case_id,))
        conn.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get single lawyer application details
@admin_panel_bp.route('/lawyer-applications/<int:app_id>', methods=['GET'])
@admin_required
def get_lawyer_application(app_id):
    """Get a single lawyer application's details"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, application_id, first_name, last_name, email, phone, 
                   bar_number, bar_state, years_experience, firm_name, firm_address,
                   specializations, status, reviewer_notes, application_date, review_date
            FROM attorneys
            WHERE id = ?
        """, (app_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Application not found'}), 404
        
        app = dict(row)
        app['full_name'] = f"{app.get('first_name', '')} {app.get('last_name', '')}".strip()
        app['rejection_reason'] = app.get('reviewer_notes')
        app['created_at'] = app.get('application_date')
        app['reviewed_at'] = app.get('review_date')
        
        return jsonify(app)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Delete lawyer application
@admin_panel_bp.route('/lawyer-applications/<int:app_id>', methods=['DELETE'])
@admin_required
def delete_lawyer_application(app_id):
    """Delete a lawyer application"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Check if application exists
        cursor.execute("SELECT id FROM attorneys WHERE id = ?", (app_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Application not found'}), 404
        
        # Delete the application
        cursor.execute("DELETE FROM attorneys WHERE id = ?", (app_id,))
        conn.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
