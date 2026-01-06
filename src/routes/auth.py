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
import logging

# Set up logging
logger = logging.getLogger(__name__)

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

# Use environment variable for redirect URI to ensure consistency
# Fallback to dynamic generation if not set
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', None)
GITHUB_REDIRECT_URI = os.getenv('GITHUB_REDIRECT_URI', None)

def get_redirect_uri(provider='google'):
    """
    Get the redirect URI for OAuth providers with consistent logic.
    
    Args:
        provider: 'google' or 'github'
    
    Returns:
        str: The redirect URI
    """
    if provider == 'google' and GOOGLE_REDIRECT_URI:
        return GOOGLE_REDIRECT_URI
    elif provider == 'github' and GITHUB_REDIRECT_URI:
        return GITHUB_REDIRECT_URI
    else:
        # Fallback to dynamic generation
        base_url = request.host_url.replace('http://', 'https://').rstrip('/')
        return f"{base_url}/auth/{provider}/callback"

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
    """Initiate Google OAuth flow with improved error handling"""
    
    try:
        # Validate OAuth credentials are configured
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            logger.error("Google OAuth credentials not configured")
            return jsonify({
                'error': 'OAuth not configured',
                'detail': 'Google OAuth credentials are missing. Please contact support.'
            }), 500
        
        # Generate state token for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Get redirect URI
        redirect_uri = get_redirect_uri('google')
        
        # Capture optional 'start' param (tenant/attorney) and store with state
        start_role = request.args.get('start')

        # Store state in database with redirect URI and intended start role for verification
        oauth_state = OAuthState(
            state=state,
            provider='google',
            redirect_uri=redirect_uri,
            start_role=start_role,
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        db.session.add(oauth_state)
        db.session.commit()
        
        # Build authorization URL
        auth_url = (
            f"{GOOGLE_AUTH_URL}?"
            f"client_id={GOOGLE_CLIENT_ID}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid email profile&"
            f"state={state}"
        )
        
        logger.info(f"Google OAuth initiated with redirect_uri: {redirect_uri}")
        
        return jsonify({'auth_url': auth_url}), 200
        
    except Exception as e:
        logger.error(f"Error initiating Google OAuth: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'OAuth initialization failed',
            'detail': str(e) if os.getenv('DEBUG') else 'An error occurred'
        }), 500


@auth_bp.route('/auth/google/callback', methods=['GET'])
def google_callback():
    """
    Handle Google OAuth callback with comprehensive error reporting.
    
    This function exchanges the authorization code for access tokens,
    retrieves user information, and creates or updates the user account.
    """
    
    try:
        # Extract parameters
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        error_description = request.args.get('error_description')
        
        # Check for OAuth errors from Google
        if error:
            logger.error(f"Google OAuth error: {error} - {error_description}")
            return jsonify({
                'error': 'OAuth authentication failed',
                'detail': error_description or error
            }), 400
        
        # Validate required parameters
        if not code or not state:
            logger.error("Missing code or state in OAuth callback")
            return jsonify({
                'error': 'Invalid OAuth callback',
                'detail': 'Missing required parameters'
            }), 400
        
        # Verify state token
        oauth_state = OAuthState.query.filter_by(state=state, provider='google').first()
        if not oauth_state or not oauth_state.is_valid():
            logger.error(f"Invalid or expired OAuth state: {state}")
            return jsonify({
                'error': 'Invalid or expired state',
                'detail': 'OAuth state verification failed. Please try again.'
            }), 400
        
        # Mark state as used
        oauth_state.mark_used()
        
        # Get redirect URI (use stored one if available, otherwise generate)
        redirect_uri = oauth_state.redirect_uri or get_redirect_uri('google')
        
        logger.info(f"Processing Google OAuth callback with redirect_uri: {redirect_uri}")
        
        # Prepare token exchange request
        token_data = {
            'code': code,
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        # Exchange authorization code for access token
        try:
            token_response = requests.post(GOOGLE_TOKEN_URL, data=token_data, timeout=10)
            
            # Enhanced error reporting for token exchange
            if token_response.status_code != 200:
                error_data = token_response.json() if token_response.headers.get('content-type', '').startswith('application/json') else {}
                error_message = error_data.get('error_description', error_data.get('error', 'Unknown error'))
                
                logger.error(
                    f"Google token exchange failed: "
                    f"Status {token_response.status_code}, "
                    f"Error: {error_message}, "
                    f"Response: {token_response.text[:500]}"
                )
                
                # Provide detailed error information
                return jsonify({
                    'error': 'Failed to obtain access token',
                    'detail': error_message,
                    'status_code': token_response.status_code,
                    'redirect_uri_used': redirect_uri if os.getenv('DEBUG') else None,
                    'hint': 'Verify that the redirect URI matches exactly in Google Cloud Console'
                }), 400
            
            tokens = token_response.json()
            access_token = tokens.get('access_token')
            
            if not access_token:
                logger.error("No access token in Google response")
                return jsonify({
                    'error': 'Invalid token response',
                    'detail': 'No access token received from Google'
                }), 400
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during token exchange: {str(e)}", exc_info=True)
            return jsonify({
                'error': 'Network error',
                'detail': 'Failed to communicate with Google OAuth service'
            }), 500
        
        # Get user information from Google
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            userinfo_response = requests.get(GOOGLE_USERINFO_URL, headers=headers, timeout=10)
            
            if userinfo_response.status_code != 200:
                logger.error(f"Failed to get user info: Status {userinfo_response.status_code}")
                return jsonify({
                    'error': 'Failed to get user info',
                    'detail': 'Could not retrieve user information from Google'
                }), 400
            
            userinfo = userinfo_response.json()
            
            if not userinfo.get('email'):
                logger.error("No email in Google userinfo response")
                return jsonify({
                    'error': 'Invalid user info',
                    'detail': 'Email not provided by Google'
                }), 400
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error getting user info: {str(e)}", exc_info=True)
            return jsonify({
                'error': 'Network error',
                'detail': 'Failed to retrieve user information'
            }), 500
        
        # Find or create user
        user = AuthUser.query.filter_by(oauth_provider='google', oauth_id=userinfo['id']).first()
        
        if not user:
            # Check if email already exists with different provider
            existing_user = AuthUser.query.filter_by(email=userinfo['email']).first()
            if existing_user:
                logger.warning(f"Email {userinfo['email']} already registered with provider: {existing_user.oauth_provider}")
                return jsonify({
                    'error': 'Email already registered',
                    'detail': f'This email is already registered with {existing_user.oauth_provider or "local"} authentication'
                }), 400
            
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
            
            logger.info(f"Created new user: {user.email} (ID: {user.id})")
        else:
            # Update existing user
            user.oauth_access_token = access_token
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            logger.info(f"Updated existing user: {user.email} (ID: {user.id})")
        
        # Generate JWT tokens
        jwt_token = user.generate_jwt_token()
        refresh_token = user.generate_refresh_token()
        
        # Redirect to frontend with tokens
        frontend_url = request.host_url.rstrip('/')
        redirect_url = (
            f"{frontend_url}/auth/callback?"
            f"access_token={jwt_token}&"
            f"refresh_token={refresh_token}&"
            f"token_type=Bearer&"
            f"expires_in=3600"
        )

        # Preserve intended start role for frontend onboarding flow
        if oauth_state.start_role:
            redirect_url = f"{redirect_url}&start={oauth_state.start_role}"
        
        logger.info(f"OAuth successful for user {user.email}, redirecting to frontend")
        
        return redirect(redirect_url)
        
    except Exception as e:
        logger.error(f"Unexpected error in Google OAuth callback: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Authentication failed',
            'detail': str(e) if os.getenv('DEBUG') else 'An unexpected error occurred'
        }), 500


# ============================================================================
# GITHUB OAUTH ROUTES
# ============================================================================

@auth_bp.route('/auth/github/login', methods=['GET'])
def github_login():
    """Initiate GitHub OAuth flow"""
    
    state = secrets.token_urlsafe(32)
    
    start_role = request.args.get('start')

    oauth_state = OAuthState(
        state=state,
        provider='github',
        start_role=start_role,
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
    
    # Redirect to frontend with tokens
    frontend_url = request.host_url.rstrip('/')
    redirect_url = f"{frontend_url}/auth/callback?access_token={jwt_token}&refresh_token={refresh_token}&token_type=Bearer&expires_in=3600"
    if oauth_state.start_role:
        redirect_url = f"{redirect_url}&start={oauth_state.start_role}"
    
    return redirect(redirect_url)


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
    
    try:
        users = AuthUser.query.all()
        return jsonify({'users': [u.to_dict() for u in users]}), 200
    except Exception as e:
        # If table doesn't exist yet, return empty list
        print(f"[list_users] Database query error: {e}")
        return jsonify({'users': []}), 200


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
@token_required
def update_user(current_user, user_id):
    """Update user details (self or admin)"""
    
    user = AuthUser.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if user is updating their own profile or is an admin
    is_self = (user.id == current_user.id)
    is_admin = (current_user.role == 'admin')
    
    if not is_self and not is_admin:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.json
    
    # Fields that users can update for themselves
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    if 'bio' in data:
        user.bio = data['bio']
    
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    
    # Admin-only fields
    if is_admin:
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
