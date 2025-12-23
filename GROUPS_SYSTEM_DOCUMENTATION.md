# Groups/Teams System Documentation

## Overview

The Groups/Teams system extends TenantGuard's authorization model by enabling team-based collaboration and permission management. Users can create groups, invite members, assign roles, and organize collaborative workflows.

## Database Schema

### Groups Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `name` | String(100) | Unique group name |
| `description` | Text | Optional group description |
| `slug` | String(100) | URL-friendly identifier (auto-generated) |
| `owner_id` | Integer | Foreign key to `auth_users.id` |
| `is_active` | Boolean | Active status flag |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

**Indexes:** `name`, `slug`, `owner_id`, `is_active`

### Group Members Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `group_id` | Integer | Foreign key to `groups.id` |
| `user_id` | Integer | Foreign key to `auth_users.id` |
| `role` | String(20) | Member role: owner, admin, member, viewer |
| `joined_at` | DateTime | Join timestamp |

**Indexes:** `group_id`, `user_id`, `role`

**Constraints:** Unique constraint on `(group_id, user_id)` to prevent duplicate memberships

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Group Management

#### List Groups
```
GET /api/groups
```

**Query Parameters:**
- `my_groups` (optional): If "true", returns only groups the user is a member of
- `owned` (optional): If "true", returns only groups owned by the user

**Response:**
```json
{
  "groups": [
    {
      "id": 1,
      "name": "Engineering Team",
      "description": "Software development team",
      "slug": "engineering-team",
      "owner_id": 5,
      "owner": {
        "id": 5,
        "username": "john_doe",
        "email": "john@example.com",
        "full_name": "John Doe"
      },
      "is_active": true,
      "member_count": 12,
      "created_at": "2025-12-23T10:00:00",
      "updated_at": "2025-12-23T10:00:00"
    }
  ],
  "total": 1
}
```

#### Get Group Details
```
GET /api/groups/<group_id>
```

**Response:**
```json
{
  "id": 1,
  "name": "Engineering Team",
  "description": "Software development team",
  "slug": "engineering-team",
  "owner_id": 5,
  "owner": {
    "id": 5,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe"
  },
  "is_active": true,
  "member_count": 12,
  "members": [
    {
      "id": 1,
      "group_id": 1,
      "user_id": 5,
      "user": {
        "id": 5,
        "username": "john_doe",
        "email": "john@example.com",
        "full_name": "John Doe",
        "avatar_url": null
      },
      "role": "owner",
      "joined_at": "2025-12-23T10:00:00"
    }
  ],
  "created_at": "2025-12-23T10:00:00",
  "updated_at": "2025-12-23T10:00:00"
}
```

#### Create Group
```
POST /api/groups
```

**Request Body:**
```json
{
  "name": "Engineering Team",
  "description": "Software development team"
}
```

**Response:**
```json
{
  "message": "Group created successfully",
  "group": {
    "id": 1,
    "name": "Engineering Team",
    "description": "Software development team",
    "slug": "engineering-team",
    "owner_id": 5,
    "is_active": true,
    "member_count": 1,
    "created_at": "2025-12-23T10:00:00",
    "updated_at": "2025-12-23T10:00:00"
  }
}
```

#### Update Group
```
PUT /api/groups/<group_id>
```

**Permissions:** Only group admins (owner or admin role) can update groups

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "is_active": true
}
```

**Response:**
```json
{
  "message": "Group updated successfully",
  "group": {
    "id": 1,
    "name": "Updated Team Name",
    "description": "Updated description",
    "slug": "updated-team-name",
    "owner_id": 5,
    "is_active": true,
    "member_count": 12,
    "created_at": "2025-12-23T10:00:00",
    "updated_at": "2025-12-23T11:00:00"
  }
}
```

#### Delete Group
```
DELETE /api/groups/<group_id>
```

**Permissions:** Only the group owner can delete groups

**Response:**
```json
{
  "message": "Group deleted successfully"
}
```

### Member Management

#### List Group Members
```
GET /api/groups/<group_id>/members
```

**Query Parameters:**
- `role` (optional): Filter by role (owner, admin, member, viewer)

**Response:**
```json
{
  "members": [
    {
      "id": 1,
      "group_id": 1,
      "user_id": 5,
      "user": {
        "id": 5,
        "username": "john_doe",
        "email": "john@example.com",
        "full_name": "John Doe",
        "avatar_url": null
      },
      "role": "owner",
      "joined_at": "2025-12-23T10:00:00"
    }
  ],
  "total": 1
}
```

#### Add Group Member
```
POST /api/groups/<group_id>/members
```

**Permissions:** Only group admins can add members

**Request Body:**
```json
{
  "user_id": 10,
  "role": "member"
}
```

**Valid Roles:** `owner`, `admin`, `member`, `viewer`

**Response:**
```json
{
  "message": "Member added successfully",
  "member": {
    "id": 2,
    "group_id": 1,
    "user_id": 10,
    "role": "member",
    "joined_at": "2025-12-23T11:00:00"
  }
}
```

#### Update Member Role
```
PUT /api/groups/<group_id>/members/<member_id>
```

**Permissions:** Only group admins can update member roles. Owner role cannot be changed.

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "message": "Member role updated successfully",
  "member": {
    "id": 2,
    "group_id": 1,
    "user_id": 10,
    "role": "admin",
    "joined_at": "2025-12-23T11:00:00"
  }
}
```

#### Remove Group Member
```
DELETE /api/groups/<group_id>/members/<member_id>
```

**Permissions:** 
- Group admins can remove any member except the owner
- Members can remove themselves

**Response:**
```json
{
  "message": "Member removed successfully"
}
```

## Permission Model

### Group Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control: edit group, manage members, delete group. Cannot be removed. |
| **Admin** | Edit group details, add/remove members, update member roles (except owner) |
| **Member** | View group and members, participate in group activities |
| **Viewer** | Read-only access to group information |

### Permission Methods

The `Group` model provides several permission-checking methods:

- `is_owner(user_id)` - Check if user is the group owner
- `is_admin(user_id)` - Check if user is an admin (owner or admin role)
- `is_member(user_id)` - Check if user is a member
- `can_view(user_id)` - Check if user can view the group
- `can_edit(user_id)` - Check if user can edit the group
- `can_manage_members(user_id)` - Check if user can manage members
- `can_delete(user_id)` - Check if user can delete the group

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (group or member not found)
- `409` - Conflict (duplicate membership, name conflict)
- `500` - Internal Server Error

## Integration with Existing Systems

### Authentication

The groups system integrates with the existing OAuth/JWT authentication system:

- All endpoints use the `@token_required` decorator from `src/routes/auth.py`
- User identity is extracted from JWT tokens
- Group ownership and membership are tied to `auth_users` table

### Database

Groups and memberships are stored in the same SQLite database as other TenantGuard data:

- Database path: `/var/www/tenantguard/src/database/tenantguard.db`
- Tables are created automatically via SQLAlchemy `db.create_all()`
- Foreign key constraints ensure referential integrity

## Usage Examples

### Creating a Group

```bash
curl -X POST https://www.tenantguard.net/api/groups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Team",
    "description": "Product management and design"
  }'
```

### Adding a Member

```bash
curl -X POST https://www.tenantguard.net/api/groups/1/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 15,
    "role": "member"
  }'
```

### Listing My Groups

```bash
curl -X GET "https://www.tenantguard.net/api/groups?my_groups=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

### Frontend Development

To complete the groups system, create React components:

1. **GroupList.jsx** - Display list of groups with filtering
2. **GroupDetail.jsx** - Show group details and member list
3. **GroupForm.jsx** - Create/edit group form
4. **GroupMemberManagement.jsx** - Add/remove members, update roles
5. **MyGroups.jsx** - User's personal groups dashboard

### Integration Points

- Add group-based permissions to blog posts (e.g., restrict posts to specific groups)
- Enable group-based case assignment for attorneys
- Implement group activity feeds and notifications
- Add group-based analytics and reporting

### Future Enhancements

- Group invitations via email
- Group discovery and join requests
- Subgroups and hierarchical structures
- Group-based resource sharing (documents, templates)
- Activity logs and audit trails
- Group settings and preferences

## Deployment

The groups system is deployed and operational on production:

- **URL:** https://www.tenantguard.net
- **Server:** 35.237.102.136
- **Service:** `tenantguard.service` (systemd)
- **Code:** GitHub repository `Orangemangocat/tenantguard`

### Files Added

- `src/models/group.py` - Group and GroupMember models
- `src/routes/groups.py` - Groups API endpoints
- `src/main.py` - Updated to register groups blueprint

### Deployment Commands

```bash
# On production server
cd /var/www/tenantguard
sudo systemctl restart tenantguard.service
sudo systemctl status tenantguard.service
```

## Support

For questions or issues with the groups system:

- Review this documentation
- Check API error responses for debugging information
- Examine server logs: `sudo journalctl -u tenantguard.service -n 100`
- Test endpoints with curl or Postman
- Submit feedback at https://help.manus.im

---

**Last Updated:** December 23, 2025  
**Version:** 1.0  
**Status:** ✅ Deployed and Operational
