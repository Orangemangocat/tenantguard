"""
OAuth 2.0 and JWT Authentication Routes
Supports Google OAuth, GitHub OAuth, and local authentication
"""

from flask import Blueprint, request, jsonify, redirect, url_for, session
from functools import wraps
from datetime import datetime, timedelta
from src.models.user import db
from src.models.auth_user import AuthUser, OAuthState
import requests
import secrets
import os
import hashlib

auth_bp = Blueprint('auth', __name__)

# OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID', '')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET', '')

GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_USERINFO_URL = 'https://api.github.com/user'

# ============================================================================
# AUTHENTICATION DECORATORS
# ============================================================================

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token
        payload = AuthUser.verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        # Get user
        current_user = AuthUser.query.get(payload['user_id'])
        if not current_user or not current_user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = AuthUser.verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        current_user = AuthUser.query.get(payload['user_id'])
        if not current_user or not current_user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        if current_user.role != 'admin':
            return jsonify({'error': 'Admin permission required'}), 403
        
        return f(current_user, *args, **kwargs)
    
    return decorated


# ============================================================================
# GOOGLE OAUTH ROUTES
# ============================================================================

@auth_bp.route('/auth/google/login', methods=['GET'])
def google_login():
    """Initiate Google OAuth flow"""
    
    # Generate state token for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store state in database
    oauth_state = OAuthState(
        state=state,
        provider='google',
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.session.add(oauth_state)
    db.session.commit()
    
    # Build authorization URL
    # Use HTTPS for production
    base_url = request.host_url.replace('http://', 'https://').rstrip('/')
    redirect_uri = base_url + '/auth/google/callback'
    
    auth_url = (
        f"{GOOGLE_AUTH_URL}?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"state={state}"
    )
    
    return jsonify({'auth_url': auth_url}), 200


@auth_bp.route('/auth/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    
    code = request.args.get('code')
    state = request.args.get('state')
    
    if not code or not state:
        return jsonify({'error': 'Missing code or state'}), 400
    
    # Verify state
    oauth_state = OAuthState.query.filter_by(state=state, provider='google').first()
    if not oauth_state or not oauth_state.is_valid():
        return jsonify({'error': 'Invalid or expired state'}), 400
    
    oauth_state.mark_used()
    
    # Exchange code for tokens
    # Use HTTPS for production
    base_url = request.host_url.replace('http://', 'https://').rstrip('/')
    redirect_uri = base_url + '/auth/google/callback'
    
    token_data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    
    token_response = requests.post(GOOGLE_TOKEN_URL, data=token_data)
    if token_response.status_code != 200:
        return jsonify({'error': 'Failed to obtain access token'}), 400
    
    tokens = token_response.json()
    access_token = tokens.get('access_token')
    
    # Get user info
    headers = {'Authorization': f'Bearer {access_token}'}
    userinfo_response = requests.get(GOOGLE_USERINFO_URL, headers=headers)
    
    if userinfo_response.status_code != 200:
        return jsonify({'error': 'Failed to get user info'}), 400
    
    userinfo = userinfo_response.json()
    
    # Find or create user
    user = AuthUser.query.filter_by(oauth_provider='google', oauth_id=userinfo['id']).first()
    
    if not user:
        # Check if email already exists
        existing_user = AuthUser.query.filter_by(email=userinfo['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already registered with different provider'}), 400
        
        # Create new user
        username = userinfo['email'].split('@')[0] + '_' + secrets.token_hex(4)
        
        user = AuthUser(
            email=userinfo['email'],
            username=username,
            full_name=userinfo.get('name'),
            avatar_url=userinfo.get('picture'),
            oauth_provider='google',
            oauth_id=userinfo['id'],
            oauth_access_token=access_token,
            role='viewer',  # Default role
            is_verified=True,
            last_login=datetime.utcnow()
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Update existing user
        user.oauth_access_token = access_token
        user.last_login = datetime.utcnow()
        db.session.commit()
    
    # Generate JWT tokens
    jwt_token = user.generate_jwt_token()
    refresh_token = user.generate_refresh_token()
    
    # Return tokens and user info
    return jsonify({
        'access_token': jwt_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': 3600,
        'user': user.to_dict()
    }), 200


# ============================================================================
# GITHUB OAUTH ROUTES
# ============================================================================

@auth_bp.route('/auth/github/login', methods=['GET'])
def github_login():
    """Initiate GitHub OAuth flow"""
    
    state = secrets.token_urlsafe(32)
    
    oauth_state = OAuthState(
        state=state,
        provider='github',
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.session.add(oauth_state)
    db.session.commit()
    
    # Use HTTPS for production
    base_url = request.host_url.replace('http://', 'https://').rstrip('/')
    redirect_uri = base_url + '/auth/github/callback'
    
    auth_url = (
        f"{GITHUB_AUTH_URL}?"
        f"client_id={GITHUB_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=user:email&"
        f"state={state}"
    )
    
    return jsonify({'auth_url': auth_url}), 200


@auth_bp.route('/auth/github/callback', methods=['GET'])
def github_callback():
    """Handle GitHub OAuth callback"""
    
    code = request.args.get('code')
    state = request.args.get('state')
    
    if not code or not state:
        return jsonify({'error': 'Missing code or state'}), 400
    
    oauth_state = OAuthState.query.filter_by(state=state, provider='github').first()
    if not oauth_state or not oauth_state.is_valid():
        return jsonify({'error': 'Invalid or expired state'}), 400
    
    oauth_state.mark_used()
    
    # Use HTTPS for production
    base_url = request.host_url.replace('http://', 'https://').rstrip('/')
    redirect_uri = base_url + '/auth/github/callback'
    
    token_data = {
        'code': code,
        'client_id': GITHUB_CLIENT_ID,
        'client_secret': GITHUB_CLIENT_SECRET,
        'redirect_uri': redirect_uri
    }
    
    headers = {'Accept': 'application/json'}
    token_response = requests.post(GITHUB_TOKEN_URL, data=token_data, headers=headers)
    
    if token_response.status_code != 200:
        return jsonify({'error': 'Failed to obtain access token'}), 400
    
    tokens = token_response.json()
    access_token = tokens.get('access_token')
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    userinfo_response = requests.get(GITHUB_USERINFO_URL, headers=headers)
    
    if userinfo_response.status_code != 200:
        return jsonify({'error': 'Failed to get user info'}), 400
    
    userinfo = userinfo_response.json()
    
    # Get email if not in main response
    email = userinfo.get('email')
    if not email:
        email_response = requests.get(GITHUB_USERINFO_URL + '/emails', headers=headers)
        if email_response.status_code == 200:
            emails = email_response.json()
            primary_email = next((e for e in emails if e.get('primary')), None)
            if primary_email:
                email = primary_email['email']
    
    if not email:
        return jsonify({'error': 'Unable to retrieve email from GitHub'}), 400
    
    user = AuthUser.query.filter_by(oauth_provider='github', oauth_id=str(userinfo['id'])).first()
    
    if not user:
        existing_user = AuthUser.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered with different provider'}), 400
        
        username = userinfo.get('login', email.split('@')[0]) + '_' + secrets.token_hex(4)
        
        user = AuthUser(
            email=email,
            username=username,
            full_name=userinfo.get('name'),
            avatar_url=userinfo.get('avatar_url'),
            oauth_provider='github',
            oauth_id=str(userinfo['id']),
            oauth_access_token=access_token,
            role='viewer',
            is_verified=True,
            last_login=datetime.utcnow()
        )
        db.session.add(user)
        db.session.commit()
    else:
        user.oauth_access_token = access_token
        user.last_login = datetime.utcnow()
        db.session.commit()
    
    jwt_token = user.generate_jwt_token()
    refresh_token = user.generate_refresh_token()
    
    return jsonify({
        'access_token': jwt_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': 3600,
        'user': user.to_dict()
    }), 200


# ============================================================================
# LOCAL AUTHENTICATION ROUTES
# ============================================================================

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """Register a new user with email and password"""
    
    data = request.json
    
    # Validate required fields
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name', '')
    
    if not email or not username or not password:
        return jsonify({'error': 'Email, username, and password are required'}), 400
    
    # Validate email format
    import re
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400
    
    # Check if user already exists
    existing_user = AuthUser.query.filter(
        (AuthUser.email == email) | (AuthUser.username == username)
    ).first()
    
    if existing_user:
        if existing_user.email == email:
            return jsonify({'error': 'Email already registered'}), 400
        else:
            return jsonify({'error': 'Username already taken'}), 400
    
    # Create new user
    user = AuthUser(
        email=email,
        username=username,
        full_name=full_name,
        role='viewer',  # Default role
        is_verified=False,  # Require email verification in production
        last_login=datetime.utcnow()
    )
    
    # Set password (hashed)
    user.set_password(password)
    
    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500
    
    # Generate JWT tokens
    access_token = user.generate_jwt_token()
    refresh_token = user.generate_refresh_token()
    
    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': 3600,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Login with email/username and password"""
    
    data = request.json
    
    # Get credentials
    identifier = data.get('email')  # Can be email or username
    password = data.get('password')
    
    if not identifier or not password:
        return jsonify({'error': 'Email/username and password are required'}), 400
    
    # Find user by email or username
    user = AuthUser.query.filter(
        (AuthUser.email == identifier) | (AuthUser.username == identifier)
    ).first()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check if user has a password (not OAuth-only user)
    if not user.password_hash:
        return jsonify({'error': 'This account uses OAuth login. Please sign in with Google or GitHub.'}), 400
    
    # Verify password
    if not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check if user is active
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate JWT tokens
    access_token = user.generate_jwt_token()
    refresh_token = user.generate_refresh_token()
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': 3600,
        'user': user.to_dict()
    }), 200


# ============================================================================
# JWT TOKEN ROUTES
# ============================================================================

@auth_bp.route('/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh JWT access token using refresh token"""
    
    data = request.json
    refresh_token = data.get('refresh_token')
    
    if not refresh_token:
        return jsonify({'error': 'Refresh token is missing'}), 400
    
    payload = AuthUser.verify_jwt_token(refresh_token)
    if not payload or payload.get('type') != 'refresh':
        return jsonify({'error': 'Invalid refresh token'}), 401
    
    user = AuthUser.query.get(payload['user_id'])
    if not user or not user.is_active:
        return jsonify({'error': 'User not found or inactive'}), 401
    
    # Generate new access token
    new_access_token = user.generate_jwt_token()
    
    return jsonify({
        'access_token': new_access_token,
        'token_type': 'Bearer',
        'expires_in': 3600
    }), 200


@auth_bp.route('/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user (invalidate all tokens)"""
    
    current_user.invalidate_all_tokens()
    
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current authenticated user"""
    
    return jsonify({'user': current_user.to_dict()}), 200


# ============================================================================
# USER MANAGEMENT ROUTES (Admin only)
# ============================================================================

@auth_bp.route('/auth/users', methods=['GET'])
@admin_required
def list_users(current_user):
    """List all users (admin only)"""
    
    users = AuthUser.query.all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200


@auth_bp.route('/auth/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(current_user, user_id):
    """Update user role (admin only)"""
    
    data = request.json
    new_role = data.get('role')
    
    if new_role not in ['admin', 'editor', 'viewer']:
        return jsonify({'error': 'Invalid role'}), 400
    
    user = AuthUser.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent changing own role
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot change your own role'}), 400
    
    user.role = new_role
    db.session.commit()
    
    return jsonify({'message': 'Role updated successfully', 'user': user.to_dict()}), 200


@auth_bp.route('/auth/users/<int:user_id>/activate', methods=['PUT'])
@admin_required
def toggle_user_activation(current_user, user_id):
    """Activate or deactivate user (admin only)"""
    
    user = AuthUser.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot deactivate yourself'}), 400
    
    user.is_active = not user.is_active
    db.session.commit()
    
    status = 'activated' if user.is_active else 'deactivated'
    return jsonify({'message': f'User {status} successfully', 'user': user.to_dict()}), 200


@auth_bp.route('/auth/users', methods=['POST'])
@admin_required
def create_user(current_user):
    """Create a new user (admin only)"""
    
    data = request.json
    email = data.get('email')
    username = data.get('username')
    full_name = data.get('full_name', '')
    role = data.get('role', 'viewer')
    is_active = data.get('is_active', True)
    
    # Validation
    if not email or not username:
        return jsonify({'error': 'Email and username are required'}), 400
    
    if role not in ['admin', 'editor', 'viewer']:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Check if user already exists
    if AuthUser.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    if AuthUser.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    # Create new user
    new_user = AuthUser(
        email=email,
        username=username,
        full_name=full_name,
        role=role,
        is_active=is_active,
        is_verified=True,  # Admin-created users are pre-verified
        oauth_provider=None,  # Local user
        oauth_id=None
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': new_user.to_dict()
    }), 201


@auth_bp.route('/auth/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(current_user, user_id):
    """Update user details (admin only)"""
    
    user = AuthUser.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    
    # Update allowed fields
    if 'email' in data:
        # Check if new email is already taken
        existing = AuthUser.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Email already exists'}), 400
        user.email = data['email']
    
    if 'username' in data:
        # Check if new username is already taken
        existing = AuthUser.query.filter_by(username=data['username']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Username already exists'}), 400
        user.username = data['username']
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    if 'role' in data:
        if data['role'] not in ['admin', 'editor', 'viewer']:
            return jsonify({'error': 'Invalid role'}), 400
        # Prevent changing own role
        if user.id == current_user.id:
            return jsonify({'error': 'Cannot change your own role'}), 400
        user.role = data['role']
    
    if 'is_active' in data:
        # Prevent deactivating self
        if user.id == current_user.id and not data['is_active']:
            return jsonify({'error': 'Cannot deactivate yourself'}), 400
        user.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/auth/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(current_user, user_id):
    """Delete a user (admin only)"""
    
    user = AuthUser.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deleting self
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot delete yourself'}), 400
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200
