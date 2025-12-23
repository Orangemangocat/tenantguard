"""
Group and GroupMember models for team-based authorization

This module defines the database models for groups/teams functionality,
enabling team-based collaboration and permission management.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from src.models import db
import re


class Group(db.Model):
    """
    Group/Team model for organizing users into collaborative teams
    
    Attributes:
        id: Unique group identifier
        name: Group name (unique)
        description: Optional group description
        slug: URL-friendly identifier (auto-generated from name)
        owner_id: User ID of group owner
        is_active: Active status flag
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """
    
    __tablename__ = 'groups'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    owner_id = Column(Integer, ForeignKey('auth_users.id', ondelete='CASCADE'), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owner = relationship('AuthUser', foreign_keys=[owner_id], backref='owned_groups')
    members = relationship('GroupMember', back_populates='group', cascade='all, delete-orphan')
    
    def __init__(self, name, owner_id, description=None):
        """
        Initialize a new group
        
        Args:
            name: Group name
            owner_id: User ID of group owner
            description: Optional group description
        """
        self.name = name
        self.slug = self.generate_slug(name)
        self.owner_id = owner_id
        self.description = description
    
    @staticmethod
    def generate_slug(name):
        """
        Generate URL-friendly slug from group name
        
        Args:
            name: Group name
            
        Returns:
            Lowercase slug with hyphens
        """
        # Convert to lowercase
        slug = name.lower()
        # Replace spaces and special characters with hyphens
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        # Remove leading/trailing hyphens
        slug = slug.strip('-')
        # Limit length
        slug = slug[:100]
        return slug
    
    def to_dict(self, include_members=False):
        """
        Convert group to dictionary
        
        Args:
            include_members: Whether to include member list
            
        Returns:
            Dictionary representation of group
        """
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'slug': self.slug,
            'owner_id': self.owner_id,
            'owner': {
                'id': self.owner.id,
                'username': self.owner.username,
                'email': self.owner.email,
                'full_name': self.owner.full_name
            } if self.owner else None,
            'is_active': self.is_active,
            'member_count': len(self.members),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_members:
            data['members'] = [member.to_dict() for member in self.members]
        
        return data
    
    def get_member(self, user_id):
        """
        Get a specific member of this group
        
        Args:
            user_id: User ID to find
            
        Returns:
            GroupMember object or None
        """
        return GroupMember.query.filter_by(
            group_id=self.id,
            user_id=user_id
        ).first()
    
    def is_owner(self, user_id):
        """
        Check if user is the group owner
        
        Args:
            user_id: User ID to check
            
        Returns:
            Boolean
        """
        return self.owner_id == user_id
    
    def is_admin(self, user_id):
        """
        Check if user is a group admin (owner or admin role)
        
        Args:
            user_id: User ID to check
            
        Returns:
            Boolean
        """
        if self.is_owner(user_id):
            return True
        
        member = self.get_member(user_id)
        return member and member.role == 'admin'
    
    def is_member(self, user_id):
        """
        Check if user is a member of this group
        
        Args:
            user_id: User ID to check
            
        Returns:
            Boolean
        """
        return self.get_member(user_id) is not None
    
    def can_view(self, user_id):
        """
        Check if user can view this group
        
        Args:
            user_id: User ID to check
            
        Returns:
            Boolean
        """
        return self.is_member(user_id)
    
    def can_edit(self, user_id):
        """
        Check if user can edit this group
        
        Args:
            user_id: User ID to check
            
        Returns:
            Boolean
        """
        return self.is_admin(user_id)
    
    def can_manage_members(self, user_id):
        """
        Check if user can manage group members
        
        Args:
            user_id: User ID to check
            
        Returns:
            Boolean
        """
        return self.is_admin(user_id)
    
    def can_delete(self, user_id):
        """
        Check if user can delete this group
        
        Args:
            user_id: User ID to check
            
        Returns:
            Boolean (only owner can delete)
        """
        return self.is_owner(user_id)
    
    def __repr__(self):
        return f'<Group {self.name}>'


class GroupMember(db.Model):
    """
    GroupMember model for many-to-many relationship between users and groups
    
    Attributes:
        id: Unique membership identifier
        group_id: Group reference
        user_id: User reference
        role: Member role (owner, admin, member, viewer)
        joined_at: Join timestamp
    """
    
    __tablename__ = 'group_members'
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey('groups.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('auth_users.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(String(20), nullable=False, default='member', index=True)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    group = relationship('Group', back_populates='members')
    user = relationship('AuthUser', backref='group_memberships')
    
    # Unique constraint: user can only be in a group once
    __table_args__ = (
        UniqueConstraint('group_id', 'user_id', name='unique_group_membership'),
    )
    
    # Valid roles
    VALID_ROLES = ['owner', 'admin', 'member', 'viewer']
    
    def __init__(self, group_id, user_id, role='member'):
        """
        Initialize a new group membership
        
        Args:
            group_id: Group ID
            user_id: User ID
            role: Member role (default: 'member')
        """
        if role not in self.VALID_ROLES:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(self.VALID_ROLES)}")
        
        self.group_id = group_id
        self.user_id = user_id
        self.role = role
    
    def to_dict(self):
        """
        Convert group member to dictionary
        
        Returns:
            Dictionary representation of group member
        """
        return {
            'id': self.id,
            'group_id': self.group_id,
            'user_id': self.user_id,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'full_name': self.user.full_name,
                'avatar_url': self.user.avatar_url
            } if self.user else None,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }
    
    def can_update_role(self, requester_id):
        """
        Check if requester can update this member's role
        
        Args:
            requester_id: User ID of requester
            
        Returns:
            Boolean
        """
        # Cannot change owner's role
        if self.role == 'owner':
            return False
        
        # Only admins and owner can update roles
        return self.group.is_admin(requester_id)
    
    def can_remove(self, requester_id):
        """
        Check if requester can remove this member
        
        Args:
            requester_id: User ID of requester
            
        Returns:
            Boolean
        """
        # Cannot remove owner
        if self.role == 'owner':
            return False
        
        # Admins can remove members
        if self.group.is_admin(requester_id):
            return True
        
        # Members can remove themselves
        if self.user_id == requester_id:
            return True
        
        return False
    
    def __repr__(self):
        return f'<GroupMember user_id={self.user_id} group_id={self.group_id} role={self.role}>'
