import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { API_BASE_URL } from '../lib/apiBase.js';

/**
 * User Management Component
 * Allows admins to create, edit, activate/deactivate, and delete users
 */
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userGroupsMap, setUserGroupsMap] = useState({});
  const [groupsLoadingMap, setGroupsLoadingMap] = useState({});
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupUser, setGroupUser] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState(null);
  const [groupSuccess, setGroupSuccess] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [newGroupForm, setNewGroupForm] = useState({
    group_id: '',
    role: 'member'
  });

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    role: 'viewer',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const loadedUsers = data.users || [];
        setUsers(loadedUsers);
        await loadUsersGroups(loadedUsers);
        setError(null);
      } else {
        throw new Error(`Failed to fetch users (status ${response.status})`);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode, userToEdit = null) => {
    setDialogMode(mode);
    setSelectedUser(userToEdit);

    if (mode === 'edit' && userToEdit) {
      setFormData({
        email: userToEdit.email,
        username: userToEdit.username,
        full_name: userToEdit.full_name || '',
        role: userToEdit.role,
        is_active: userToEdit.is_active
      });
    } else {
      setFormData({
        email: '',
        username: '',
        full_name: '',
        role: 'viewer',
        is_active: true
      });
    }

    setShowDialog(true);
    setError(null);
    setSuccess(null);
  };

  const loadUsersGroups = async (usersToLoad) => {
    if (!usersToLoad || usersToLoad.length === 0) {
      setUserGroupsMap({});
      return;
    }
    const token = localStorage.getItem('access_token');
    setGroupsLoadingMap((prev) => {
      const next = { ...prev };
      usersToLoad.forEach((user) => {
        next[user.id] = true;
      });
      return next;
    });
    try {
      const responses = await Promise.all(usersToLoad.map((user) => (
        fetch(`${API_BASE_URL}/api/users/${user.id}/groups`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(async (response) => ({
          userId: user.id,
          ok: response.ok,
          data: response.ok ? await response.json() : null
        }))
      )));

      const nextMap = {};
      responses.forEach((result) => {
        if (result.ok && result.data && Array.isArray(result.data.groups)) {
          nextMap[result.userId] = result.data.groups;
        }
      });
      setUserGroupsMap(nextMap);
    } catch (err) {
      console.error('Error loading user groups:', err);
    } finally {
      setGroupsLoadingMap((prev) => {
        const next = { ...prev };
        usersToLoad.forEach((user) => {
          next[user.id] = false;
        });
        return next;
      });
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedUser(null);
  };

  const handleOpenGroupDialog = async (userToManage) => {
    setGroupUser(userToManage);
    setGroupDialogOpen(true);
    setGroupError(null);
    setGroupSuccess(null);
    setNewGroupForm({ group_id: '', role: 'member' });
    await refreshGroupData(userToManage);
  };

  const handleCloseGroupDialog = () => {
    setGroupDialogOpen(false);
    setGroupUser(null);
    setUserGroups([]);
    setAllGroups([]);
  };

  const refreshGroupData = async (userToManage) => {
    if (!userToManage) {
      return;
    }
    try {
      setGroupLoading(true);
      const token = localStorage.getItem('access_token');
      const [groupsResponse, userGroupsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/groups`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_BASE_URL}/api/users/${userToManage.id}/groups`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (!groupsResponse.ok) {
        throw new Error(`Failed to load groups (status ${groupsResponse.status})`);
      }
      if (!userGroupsResponse.ok) {
        throw new Error(`Failed to load user groups (status ${userGroupsResponse.status})`);
      }

      const groupsData = await groupsResponse.json();
      const userGroupsData = await userGroupsResponse.json();
      setAllGroups(groupsData.groups || []);
      setUserGroups(userGroupsData.groups || []);
      setGroupError(null);
    } catch (err) {
      console.error('Error loading group data:', err);
      setGroupError(err.message || 'Failed to load group data');
    } finally {
      setGroupLoading(false);
    }
  };

  const handleAddUserToGroup = async (e) => {
    e.preventDefault();
    if (!groupUser || !newGroupForm.group_id) {
      setGroupError('Select a group to add the user to.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${newGroupForm.group_id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          user_id: groupUser.id,
          role: newGroupForm.role
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add group member');
      }

      setGroupSuccess('User added to group successfully');
      setNewGroupForm({ group_id: '', role: 'member' });
      await refreshGroupData(groupUser);
    } catch (err) {
      setGroupError(err.message);
    }
  };

  const handleUpdateGroupRole = async (groupId, role) => {
    if (!groupUser) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${groupUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setGroupSuccess('Group role updated');
      await refreshGroupData(groupUser);
    } catch (err) {
      setGroupError(err.message);
    }
  };

  const handleRemoveGroupMember = async (groupId) => {
    if (!groupUser) {
      return;
    }
    if (!confirm('Remove this user from the group?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${groupUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      setGroupSuccess('User removed from group');
      await refreshGroupData(groupUser);
    } catch (err) {
      setGroupError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = dialogMode === 'create'
        ? `${API_BASE_URL}/auth/users`
        : `${API_BASE_URL}/auth/users/${selectedUser.id}`;

      const method = dialogMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`User ${dialogMode === 'create' ? 'created' : 'updated'} successfully`);
        handleCloseDialog();
        fetchUsers();
      } else {
        throw new Error(data.error || 'Operation failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setSuccess('User deleted successfully');
        fetchUsers();
      } else {
        throw new Error(`Failed to delete user (status ${response.status})`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        throw new Error(`Failed to update user status (status ${response.status})`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => handleOpenDialog('create')}>
          Add New User
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groups</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.username}</div>
                      <div className="text-sm text-gray-500">{u.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {groupsLoadingMap[u.id] ? (
                        <span className="text-xs text-gray-500">Loading...</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(userGroupsMap[u.id] || []).length === 0 ? (
                            <span className="text-xs text-gray-500">No groups</span>
                          ) : (
                            (userGroupsMap[u.id] || []).map((group) => (
                              <span
                                key={`${u.id}-${group.id}`}
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${group.user_role === 'admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : group.user_role === 'owner'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                {group.name}: {group.user_role}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog('edit', u)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenGroupDialog(u)}
                      >
                        Groups
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{dialogMode === 'create' ? 'Create New User' : 'Edit User'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {dialogMode === 'create' ? 'Create' : 'Update'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {groupDialogOpen && groupUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Manage Groups: {groupUser.username}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {groupError}
                </div>
              )}
              {groupSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                  {groupSuccess}
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Current Memberships</h3>
                {groupLoading ? (
                  <div className="text-sm text-gray-500">Loading group data...</div>
                ) : (
                  <div className="border rounded-md divide-y">
                    {userGroups.length === 0 && (
                      <div className="p-3 text-sm text-gray-500">No group memberships yet.</div>
                    )}
                    {userGroups.map((group) => (
                      <div key={group.id} className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{group.name}</div>
                          <div className="text-xs text-gray-500">Role: {group.user_role}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={group.user_role}
                            onChange={(e) => handleUpdateGroupRole(group.id, e.target.value)}
                            disabled={group.user_role === 'owner'}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveGroupMember(group.id)}
                            disabled={group.user_role === 'owner'}
                            className={group.user_role === 'owner' ? 'opacity-50' : 'text-red-600 hover:text-red-700'}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Owner roles cannot be modified or removed here.
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Add to Group</h3>
                <form onSubmit={handleAddUserToGroup} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="group_id">Group</Label>
                    <select
                      id="group_id"
                      value={newGroupForm.group_id}
                      onChange={(e) => setNewGroupForm({ ...newGroupForm, group_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select a group</option>
                      {allGroups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="group_role">Role</Label>
                    <select
                      id="group_role"
                      value={newGroupForm.role}
                      onChange={(e) => setNewGroupForm({ ...newGroupForm, role: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <Button type="submit">Add</Button>
                </form>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" type="button" onClick={handleCloseGroupDialog}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
