#!/usr/bin/env python3
"""
TenantGuard User Management Script

This script provides a command-line interface for managing users in the TenantGuard system.
It supports creating, listing, updating, and deleting users with different roles.

Usage:
    python3 manage_users.py create --email user@example.com --username john --role admin
    python3 manage_users.py list
    python3 manage_users.py update --email user@example.com --role editor
    python3 manage_users.py delete --email user@example.com
    python3 manage_users.py activate --email user@example.com
    python3 manage_users.py deactivate --email user@example.com

Roles:
    - admin: Full access to all features including user management and post approval
    - editor: Can create and edit posts, submit for approval
    - viewer: Read-only access to the system
"""

import sys
import os
import argparse
from datetime import datetime

# Add parent directory to path to import from src
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.main import app, db
from src.models.auth_user import AuthUser


def create_user(email, username, full_name=None, role='viewer', is_active=True, is_verified=True):
    """
    Create a new user in the database.
    
    Args:
        email (str): User's email address (required, must be unique)
        username (str): User's username (required, must be unique)
        full_name (str): User's full name (optional)
        role (str): User role - 'admin', 'editor', or 'viewer' (default: 'viewer')
        is_active (bool): Whether the user account is active (default: True)
        is_verified (bool): Whether the user's email is verified (default: True)
    
    Returns:
        AuthUser: The created user object, or None if creation failed
    """
    with app.app_context():
        # Check if user already exists
        existing_user = AuthUser.query.filter(
            (AuthUser.email == email) | (AuthUser.username == username)
        ).first()
        
        if existing_user:
            if existing_user.email == email:
                print(f"❌ Error: User with email '{email}' already exists.")
            else:
                print(f"❌ Error: User with username '{username}' already exists.")
            return None
        
        # Validate role
        valid_roles = ['admin', 'editor', 'viewer']
        if role not in valid_roles:
            print(f"❌ Error: Invalid role '{role}'. Must be one of: {', '.join(valid_roles)}")
            return None
        
        # Create new user
        user = AuthUser(
            email=email,
            username=username,
            full_name=full_name or username,
            role=role,
            is_active=is_active,
            is_verified=is_verified
        )
        
        try:
            db.session.add(user)
            db.session.commit()
            print(f"✅ User created successfully!")
            print(f"   Email: {user.email}")
            print(f"   Username: {user.username}")
            print(f"   Full Name: {user.full_name}")
            print(f"   Role: {user.role}")
            print(f"   Active: {user.is_active}")
            print(f"   Verified: {user.is_verified}")
            return user
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating user: {str(e)}")
            return None


def list_users(role=None, active_only=False):
    """
    List all users in the database.
    
    Args:
        role (str): Filter by role (optional)
        active_only (bool): Only show active users (default: False)
    """
    with app.app_context():
        query = AuthUser.query
        
        if role:
            query = query.filter_by(role=role)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        users = query.order_by(AuthUser.created_at.desc()).all()
        
        if not users:
            print("No users found.")
            return
        
        print(f"\n{'='*100}")
        print(f"{'ID':<5} {'Email':<30} {'Username':<20} {'Role':<10} {'Active':<8} {'Created':<20}")
        print(f"{'='*100}")
        
        for user in users:
            created = user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else 'N/A'
            active = '✓' if user.is_active else '✗'
            print(f"{user.id:<5} {user.email:<30} {user.username:<20} {user.role:<10} {active:<8} {created:<20}")
        
        print(f"{'='*100}")
        print(f"Total users: {len(users)}\n")


def update_user(email, **kwargs):
    """
    Update an existing user's information.
    
    Args:
        email (str): Email of the user to update
        **kwargs: Fields to update (role, full_name, is_active, is_verified)
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    with app.app_context():
        user = AuthUser.query.filter_by(email=email).first()
        
        if not user:
            print(f"❌ Error: User with email '{email}' not found.")
            return False
        
        # Update fields
        updated_fields = []
        
        if 'role' in kwargs:
            valid_roles = ['admin', 'editor', 'viewer']
            if kwargs['role'] not in valid_roles:
                print(f"❌ Error: Invalid role '{kwargs['role']}'. Must be one of: {', '.join(valid_roles)}")
                return False
            user.role = kwargs['role']
            updated_fields.append(f"role → {kwargs['role']}")
        
        if 'full_name' in kwargs:
            user.full_name = kwargs['full_name']
            updated_fields.append(f"full_name → {kwargs['full_name']}")
        
        if 'is_active' in kwargs:
            user.is_active = kwargs['is_active']
            updated_fields.append(f"is_active → {kwargs['is_active']}")
        
        if 'is_verified' in kwargs:
            user.is_verified = kwargs['is_verified']
            updated_fields.append(f"is_verified → {kwargs['is_verified']}")
        
        if 'username' in kwargs:
            # Check if username is already taken
            existing = AuthUser.query.filter_by(username=kwargs['username']).first()
            if existing and existing.id != user.id:
                print(f"❌ Error: Username '{kwargs['username']}' is already taken.")
                return False
            user.username = kwargs['username']
            updated_fields.append(f"username → {kwargs['username']}")
        
        if not updated_fields:
            print("⚠️  No fields to update.")
            return False
        
        try:
            user.updated_at = datetime.utcnow()
            db.session.commit()
            print(f"✅ User updated successfully!")
            print(f"   Email: {user.email}")
            for field in updated_fields:
                print(f"   Updated: {field}")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error updating user: {str(e)}")
            return False


def delete_user(email, confirm=False):
    """
    Delete a user from the database.
    
    Args:
        email (str): Email of the user to delete
        confirm (bool): Confirmation flag to prevent accidental deletion
    
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    with app.app_context():
        user = AuthUser.query.filter_by(email=email).first()
        
        if not user:
            print(f"❌ Error: User with email '{email}' not found.")
            return False
        
        if not confirm:
            print(f"⚠️  WARNING: You are about to delete user '{user.email}' ({user.username}).")
            print(f"   This action cannot be undone!")
            response = input("   Type 'DELETE' to confirm: ")
            if response != 'DELETE':
                print("❌ Deletion cancelled.")
                return False
        
        try:
            db.session.delete(user)
            db.session.commit()
            print(f"✅ User '{email}' deleted successfully.")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error deleting user: {str(e)}")
            return False


def activate_user(email):
    """Activate a user account."""
    return update_user(email, is_active=True)


def deactivate_user(email):
    """Deactivate a user account."""
    return update_user(email, is_active=False)


def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(
        description='TenantGuard User Management Script',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Create an admin user:
    python3 manage_users.py create --email admin@example.com --username admin --role admin
  
  Create an editor:
    python3 manage_users.py create --email editor@example.com --username editor --role editor --full-name "John Editor"
  
  List all users:
    python3 manage_users.py list
  
  List only admins:
    python3 manage_users.py list --role admin
  
  Update user role:
    python3 manage_users.py update --email user@example.com --role admin
  
  Deactivate user:
    python3 manage_users.py deactivate --email user@example.com
  
  Delete user:
    python3 manage_users.py delete --email user@example.com
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Create command
    create_parser = subparsers.add_parser('create', help='Create a new user')
    create_parser.add_argument('--email', required=True, help='User email address')
    create_parser.add_argument('--username', required=True, help='Username')
    create_parser.add_argument('--full-name', help='Full name (optional)')
    create_parser.add_argument('--role', choices=['admin', 'editor', 'viewer'], default='viewer', help='User role')
    create_parser.add_argument('--inactive', action='store_true', help='Create user as inactive')
    create_parser.add_argument('--unverified', action='store_true', help='Create user as unverified')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List all users')
    list_parser.add_argument('--role', choices=['admin', 'editor', 'viewer'], help='Filter by role')
    list_parser.add_argument('--active-only', action='store_true', help='Show only active users')
    
    # Update command
    update_parser = subparsers.add_parser('update', help='Update an existing user')
    update_parser.add_argument('--email', required=True, help='Email of user to update')
    update_parser.add_argument('--role', choices=['admin', 'editor', 'viewer'], help='New role')
    update_parser.add_argument('--username', help='New username')
    update_parser.add_argument('--full-name', help='New full name')
    
    # Delete command
    delete_parser = subparsers.add_parser('delete', help='Delete a user')
    delete_parser.add_argument('--email', required=True, help='Email of user to delete')
    delete_parser.add_argument('--confirm', action='store_true', help='Skip confirmation prompt')
    
    # Activate command
    activate_parser = subparsers.add_parser('activate', help='Activate a user account')
    activate_parser.add_argument('--email', required=True, help='Email of user to activate')
    
    # Deactivate command
    deactivate_parser = subparsers.add_parser('deactivate', help='Deactivate a user account')
    deactivate_parser.add_argument('--email', required=True, help='Email of user to deactivate')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Execute command
    if args.command == 'create':
        create_user(
            email=args.email,
            username=args.username,
            full_name=args.full_name,
            role=args.role,
            is_active=not args.inactive,
            is_verified=not args.unverified
        )
    
    elif args.command == 'list':
        list_users(role=args.role, active_only=args.active_only)
    
    elif args.command == 'update':
        kwargs = {}
        if args.role:
            kwargs['role'] = args.role
        if args.username:
            kwargs['username'] = args.username
        if args.full_name:
            kwargs['full_name'] = args.full_name
        update_user(args.email, **kwargs)
    
    elif args.command == 'delete':
        delete_user(args.email, confirm=args.confirm)
    
    elif args.command == 'activate':
        activate_user(args.email)
    
    elif args.command == 'deactivate':
        deactivate_user(args.email)


if __name__ == '__main__':
    main()
