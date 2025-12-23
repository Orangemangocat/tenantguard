"""
Groups API endpoints for team management

This module provides REST API endpoints for creating, reading, updating,
and deleting groups/teams, as well as managing group memberships.
"""

from flask import Blueprint, request, jsonify
from src.models import db
from src.models.group import Group, GroupMember
from src.models.auth_user import AuthUser
from src.routes.auth import token_required
from sqlalchemy.exc import IntegrityError

groups_bp = Blueprint('groups', __name__)


# ============================================================================
# GROUP CRUD OPERATIONS
# ============================================================================

@groups_bp.route('/api/groups', methods=['GET'])
@token_required
def list_groups(current_user):
    """
    List all groups accessible to the current user
    
    Query Parameters:
        - my_groups: If 'true', only show groups user is a member of
        - owned: If 'true', only show groups owned by user
        - include_members: If 'true', include member lists
    
    Returns:
        JSON list of groups
    """
    try:
        # Parse query parameters
        my_groups = request.args.get('my_groups', 'false').lower() == 'true'
        owned = request.args.get('owned', 'false').lower() == 'true'
        include_members = request.args.get('include_members', 'false').lower() == 'true'
        
        if owned:
            # Show only groups owned by current user
            groups = Group.query.filter_by(owner_id=current_user.id, is_active=True).all()
        
        elif my_groups:
            # Show only groups user is a member of
            member_records = GroupMember.query.filter_by(user_id=current_user.id).all()
            group_ids = [m.group_id for m in member_records]
            groups = Group.query.filter(Group.id.in_(group_ids), Group.is_active == True).all()
        
        else:
            # System admins can see all groups
            if current_user.role == 'admin':
                groups = Group.query.filter_by(is_active=True).all()
            else:
                # Regular users see only their groups
                member_records = GroupMember.query.filter_by(user_id=current_user.id).all()
                group_ids = [m.group_id for m in member_records]
                groups = Group.query.filter(Group.id.in_(group_ids), Group.is_active == True).all()
        
        return jsonify({
            'groups': [g.to_dict(include_members=include_members) for g in groups],
            'count': len(groups)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/api/groups', methods=['POST'])
@token_required
def create_group(current_user):
    """
    Create a new group
    
    Request Body:
        - name: Group name (required, unique)
        - description: Group description (optional)
    
    Returns:
        JSON representation of created group
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Group name is required'}), 400
        
        name = data['name'].strip()
        
        # Validate name length
        if len(name) < 3:
            return jsonify({'error': 'Group name must be at least 3 characters'}), 400
        
        if len(name) > 100:
            return jsonify({'error': 'Group name must be at most 100 characters'}), 400
        
        # Check if group name already exists
        existing = Group.query.filter_by(name=name).first()
        if existing:
            return jsonify({'error': 'A group with this name already exists'}), 409
        
        # Create new group
        group = Group(
            name=name,
            owner_id=current_user.id,
            description=data.get('description', '').strip() or None
        )
        
        db.session.add(group)
        db.session.flush()  # Get group ID before committing
        
        # Add owner as member with 'owner' role
        owner_member = GroupMember(
            group_id=group.id,
            user_id=current_user.id,
            role='owner'
        )
        
        db.session.add(owner_member)
        db.session.commit()
        
        return jsonify({
            'message': 'Group created successfully',
            'group': group.to_dict(include_members=True)
        }), 201
    
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': 'Database integrity error. Group may already exist.'}), 409
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/api/groups/<int:group_id>', methods=['GET'])
@token_required
def get_group(current_user, group_id):
    """
    Get details of a specific group
    
    Path Parameters:
        - group_id: Group ID
    
    Query Parameters:
        - include_members: If 'true', include member list
    
    Returns:
        JSON representation of group
    """
    try:
        group = Group.query.get(group_id)
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Check if user can view this group
        if not group.can_view(current_user.id) and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        include_members = request.args.get('include_members', 'true').lower() == 'true'
        
        return jsonify({
            'group': group.to_dict(include_members=include_members)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/api/groups/<int:group_id>', methods=['PUT'])
@token_required
def update_group(current_user, group_id):
    """
    Update group details
    
    Path Parameters:
        - group_id: Group ID
    
    Request Body:
        - name: New group name (optional)
        - description: New description (optional)
        - is_active: Active status (optional, admin only)
    
    Returns:
        JSON representation of updated group
    """
    try:
        group = Group.query.get(group_id)
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Check if user can edit this group
        if not group.can_edit(current_user.id) and current_user.role != 'admin':
            return jsonify({'error': 'Permission denied. Only group admins can edit.'}), 403
        
        data = request.json
        
        # Update name if provided
        if 'name' in data:
            new_name = data['name'].strip()
            
            if len(new_name) < 3:
                return jsonify({'error': 'Group name must be at least 3 characters'}), 400
            
            if len(new_name) > 100:
                return jsonify({'error': 'Group name must be at most 100 characters'}), 400
            
            # Check if new name is already taken
            existing = Group.query.filter(Group.name == new_name, Group.id != group_id).first()
            if existing:
                return jsonify({'error': 'A group with this name already exists'}), 409
            
            group.name = new_name
            group.slug = Group.generate_slug(new_name)
        
        # Update description if provided
        if 'description' in data:
            group.description = data['description'].strip() or None
        
        # Update active status (admin only)
        if 'is_active' in data:
            if current_user.role != 'admin':
                return jsonify({'error': 'Only system admins can change active status'}), 403
            group.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Group updated successfully',
            'group': group.to_dict(include_members=True)
        }), 200
    
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Database integrity error'}), 409
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/api/groups/<int:group_id>', methods=['DELETE'])
@token_required
def delete_group(current_user, group_id):
    """
    Delete a group (owner only)
    
    Path Parameters:
        - group_id: Group ID
    
    Returns:
        Success message
    """
    try:
        group = Group.query.get(group_id)
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Check if user can delete this group
        if not group.can_delete(current_user.id) and current_user.role != 'admin':
            return jsonify({'error': 'Permission denied. Only the group owner can delete.'}), 403
        
        group_name = group.name
        
        # Delete group (members will be deleted automatically via CASCADE)
        db.session.delete(group)
        db.session.commit()
        
        return jsonify({
            'message': f'Group "{group_name}" deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================================
# GROUP MEMBERSHIP MANAGEMENT
# ============================================================================

@groups_bp.route('/api/groups/<int:group_id>/members', methods=['GET'])
@token_required
def list_group_members(current_user, group_id):
    """
    List all members of a group
    
    Path Parameters:
        - group_id: Group ID
    
    Returns:
        JSON list of group members
    """
    try:
        group = Group.query.get(group_id)
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Check if user can view members
        if not group.can_view(current_user.id) and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        members = GroupMember.query.filter_by(group_id=group_id).all()
        
        return jsonify({
            'members': [m.to_dict() for m in members],
            'count': len(members)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/api/groups/<int:group_id>/members', methods=['POST'])
@token_required
def add_group_member(current_user, group_id):
    """
    Add a member to a group
    
    Path Parameters:
        - group_id: Group ID
    
    Request Body:
        - user_id: User ID to add (required)
        - role: Member role (optional, default: 'member')
    
    Returns:
        JSON representation of new member
    """
    try:
        group = Group.query.get(group_id)
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Check if user can manage members
        if not group.can_manage_members(current_user.id) and current_user.role != 'admin':
            return jsonify({'error': 'Permission denied. Only group admins can add members.'}), 403
        
        data = request.json
        
        # Validate required fields
        if not data.get('user_id'):
            return jsonify({'error': 'user_id is required'}), 400
        
        user_id = data['user_id']
        role = data.get('role', 'member')
        
        # Validate role
        if role not in GroupMember.VALID_ROLES:
            return jsonify({'error': f'Invalid role. Must be one of: {", ".join(GroupMember.VALID_ROLES)}'}), 400
        
        # Cannot add with 'owner' role
        if role == 'owner':
            return jsonify({'error': 'Cannot add member with owner role. Use ownership transfer instead.'}), 400
        
        # Check if user exists
        user = AuthUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is already a member
        existing_member = group.get_member(user_id)
        if existing_member:
            return jsonify({'error': 'User is already a member of this group'}), 409
        
        # Add member
        member = GroupMember(
            group_id=group_id,
            user_id=user_id,
            role=role
        )
        
        db.session.add(member)
        db.session.commit()
        
        return jsonify({
            'message': 'Member added successfully',
            'member': member.to_dict()
        }), 201
    
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'User is already a member of this group'}), 409
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/api/groups/<int:group_id>/members/<int:user_id>', methods=['PUT'])
@token_required
def update_group_member(current_user, group_id, user_id):
    """
    Update a group member's role
    
    Path Parameters:
        - group_id: Group ID
        - user_id: User ID
    
    Request Body:
        - role: New role (required)
    
    Returns:
        JSON representation of updated member
    """
    try:
        group = Group.query.get(group_id)
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Check if user can manage members
        if not group.can_manage_members(current_user.id) and current_user.role != 'admin':
            return jsonify({'error': 'Permission denied. Only group admins can update members.'}), 403
        
        member = group.get_member(user_id)
        
        if not member:
            return jsonify({'error': 'Member not found in this group'}), 404
        
        data = request.json
        
        # Validate required fields
        if not data.get('role'):
            return jsonify({'error': 'role is required'}), 400
        
        new_role = data['role']
        
        # Validate role
        if new_role not in GroupMember.VALID_ROLES:
            return jsonify({'error': f'Invalid role. Must be one of: {", ".join(GroupMember.VALID_ROLES)}'}), 400
        
        # Cannot change owner's role
        if member.role == 'owner':
            return jsonify({'error': 'Cannot change owner role. Use ownership transfer instead.'}), 400
        
        # Cannot assign owner role
        if new_role == 'owner':
            return jsonify({'error': 'Cannot assign owner role. Use ownership transfer instead.'}), 400
        
        # Update role
        member.role = new_role
        db.session.commit()
        
        return jsonify({
            'message': 'Member role updated successfully',
            'member': member.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/api/groups/<int:group_id>/members/<int:user_id>', methods=['DELETE'])
@token_required
def remove_group_member(current_user, group_id, user_id):
    """
    Remove a member from a group
    
    Path Parameters:
        - group_id: Group ID
        - user_id: User ID to remove
    
    Returns:
        Success message
    """
    try:
        group = Group.query.get(group_id)
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        member = group.get_member(user_id)
        
        if not member:
            return jsonify({'error': 'Member not found in this group'}), 404
        
        # Check if user can remove this member
        if not member.can_remove(current_user.id) and current_user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        # Cannot remove owner
        if member.role == 'owner':
            return jsonify({'error': 'Cannot remove group owner'}), 400
        
        username = member.user.username if member.user else 'User'
        
        # Remove member
        db.session.delete(member)
        db.session.commit()
        
        return jsonify({
            'message': f'{username} removed from group successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================================
# USER'S GROUPS
# ============================================================================

@groups_bp.route('/api/users/me/groups', methods=['GET'])
@token_required
def get_my_groups(current_user):
    """
    Get all groups the current user is a member of
    
    Returns:
        JSON list of user's groups
    """
    try:
        member_records = GroupMember.query.filter_by(user_id=current_user.id).all()
        group_ids = [m.group_id for m in member_records]
        groups = Group.query.filter(Group.id.in_(group_ids), Group.is_active == True).all()
        
        # Add user's role to each group
        groups_with_roles = []
        for group in groups:
            group_dict = group.to_dict()
            member = group.get_member(current_user.id)
            group_dict['my_role'] = member.role if member else None
            groups_with_roles.append(group_dict)
        
        return jsonify({
            'groups': groups_with_roles,
            'count': len(groups_with_roles)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@groups_bp.route('/api/users/<int:user_id>/groups', methods=['GET'])
@token_required
def get_user_groups(current_user, user_id):
    """
    Get all groups a specific user is a member of (admin only)
    
    Path Parameters:
        - user_id: User ID
    
    Returns:
        JSON list of user's groups
    """
    try:
        # Only admins or the user themselves can view
        if current_user.id != user_id and current_user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        user = AuthUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        member_records = GroupMember.query.filter_by(user_id=user_id).all()
        group_ids = [m.group_id for m in member_records]
        groups = Group.query.filter(Group.id.in_(group_ids), Group.is_active == True).all()
        
        # Add user's role to each group
        groups_with_roles = []
        for group in groups:
            group_dict = group.to_dict()
            member = group.get_member(user_id)
            group_dict['user_role'] = member.role if member else None
            groups_with_roles.append(group_dict)
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'groups': groups_with_roles,
            'count': len(groups_with_roles)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
