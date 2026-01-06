"""
Enhanced User Model with OAuth and Role-Based Permissions
Supports OAuth 2.0 authentication and JWT token management
"""

from datetime import datetime, timedelta
from src.models.user import db
import jwt
import os
import hashlib

class AuthUser(db.Model):
    __tablename__ = 'auth_users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    full_name = db.Column(db.String(200))
    
    # OAuth fields
    oauth_provider = db.Column(db.String(50))  # 'google', 'github', 'local'
    oauth_id = db.Column(db.String(255))  # Provider's user ID
    oauth_access_token = db.Column(db.Text)  # Encrypted OAuth token
    oauth_refresh_token = db.Column(db.Text)  # Encrypted refresh token
    
    # Local authentication (if not using OAuth)
    password_hash = db.Column(db.String(255))  # Hashed password for local auth
    
    # Profile
    avatar_url = db.Column(db.String(500))
    bio = db.Column(db.Text)
    
    # Role and permissions
    role = db.Column(db.String(20), default='viewer')  # 'admin', 'editor', 'viewer'
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # JWT token tracking
    jwt_token_version = db.Column(db.Integer, default=0)  # Increment to invalidate all tokens
    
    def generate_jwt_token(self, expires_in=3600):
        """Generate JWT access token (1 hour default)"""
        payload = {
            'user_id': self.id,
            'email': self.email,
            'role': self.role,
            'token_version': self.jwt_token_version,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in),
            'iat': datetime.utcnow()
        }
        
        secret_key = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
        return jwt.encode(payload, secret_key, algorithm='HS256')
    
    def generate_refresh_token(self, expires_in=2592000):
        """Generate JWT refresh token (30 days default)"""
        payload = {
            'user_id': self.id,
            'token_version': self.jwt_token_version,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in),
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        
        secret_key = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
        return jwt.encode(payload, secret_key, algorithm='HS256')
    
    @staticmethod
    def verify_jwt_token(token):
        """Verify and decode JWT token"""
        try:
            secret_key = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            
            # Verify token version matches current user's version
            user = AuthUser.query.get(payload['user_id'])
            if not user or user.jwt_token_version != payload['token_version']:
                return None
            
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def invalidate_all_tokens(self):
        """Invalidate all existing JWT tokens by incrementing version"""
        self.jwt_token_version += 1
        db.session.commit()
    
    def has_permission(self, required_permission):
        """Check if user has required permission based on role"""
        permissions = {
            'admin': ['read', 'write', 'delete', 'approve', 'manage_users', 'configure'],
            'editor': ['read', 'write'],
            'viewer': ['read']
        }
        
        user_permissions = permissions.get(self.role, [])
        return required_permission in user_permissions
    
    def can_approve_posts(self):
        """Check if user can approve blog posts"""
        return self.role == 'admin'
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.role == 'admin'
    
    def set_password(self, password):
        """Hash and set the user's password"""
        # Use SHA-256 for password hashing (in production, use bcrypt or argon2)
        self.password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    def check_password(self, password):
        """Verify the user's password"""
        if not self.password_hash:
            return False
        return self.password_hash == hashlib.sha256(password.encode()).hexdigest()
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'full_name': self.full_name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'role': self.role,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
        if include_sensitive:
            data.update({
                'oauth_provider': self.oauth_provider,
                'oauth_id': self.oauth_id,
                'jwt_token_version': self.jwt_token_version
            })
        
        return data


class OAuthState(db.Model):
    """Store OAuth state tokens to prevent CSRF attacks"""
    __tablename__ = 'oauth_states'
    
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String(255), unique=True, nullable=False, index=True)
    provider = db.Column(db.String(50), nullable=False)
    redirect_uri = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    # Optional: record intended post-auth start role (e.g. 'tenant' or 'attorney')
    start_role = db.Column(db.String(50))
    
    def is_valid(self):
        """Check if state is still valid"""
        return not self.used and datetime.utcnow() < self.expires_at
    
    def mark_used(self):
        """Mark state as used"""
        self.used = True
        db.session.commit()
