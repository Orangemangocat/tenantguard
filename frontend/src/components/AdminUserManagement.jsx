import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from "../lib/apiBase";

const AdminUserManagement = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    role: 'viewer'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        setError('Not authenticated. Please login.');
        setLoading(false);
        return;
      }

      const response = await fetch('${API_BASE_URL}/auth/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
      } else if (response.status === 403) {
        setError('Admin access required.');
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.id);
    setEditForm({
      email: user.email,
      username: user.username,
      full_name: user.full_name || '',
      role: user.role,
      is_active: user.is_active
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleSaveUser = async (userId) => {
    try {
      setSaving(true);
      setError(null);
      
      const accessToken = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setSuccessMessage('User updated successfully!');
        setEditingUser(null);
        await fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        setSuccessMessage(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        await fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error toggling user status:', err);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const accessToken = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        setSuccessMessage('User deleted successfully!');
        await fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error deleting user:', err);
    }
  };

  const handleCreateUser = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const accessToken = localStorage.getItem('access_token');
      
      const response = await fetch('${API_BASE_URL}/auth/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUserForm)
      });

      if (response.ok) {
        setSuccessMessage('User created successfully!');
        setShowCreateModal(false);
        setNewUserForm({
          email: '',
          username: '',
          full_name: '',
          password: '',
          role: 'viewer'
        });
        await fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error creating user:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">User Management</h2>
              <p className="text-red-100 mt-1">Manage user accounts and permissions</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Controls */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create User
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm text-gray-600">
            <span>Total: <strong className="text-gray-900">{users.length}</strong></span>
            <span>Filtered: <strong className="text-gray-900">{filteredUsers.length}</strong></span>
            <span>Active: <strong className="text-green-600">{users.filter(u => u.is_active).length}</strong></span>
            <span>Inactive: <strong className="text-red-600">{users.filter(u => !u.is_active).length}</strong></span>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    {editingUser === user.id ? (
                      // Edit Mode
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-transparent text-sm"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.is_active}
                              onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                              className="rounded border-gray-300 text-red-800 focus:ring-red-800"
                            />
                            <span className="text-sm">{editForm.is_active ? 'Active' : 'Inactive'}</span>
                          </label>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(user.last_login)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSaveUser(user.id)}
                            disabled={saving}
                            className="text-green-600 hover:text-green-800 font-medium text-sm mr-3 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">@{user.username}</div>
                              {user.full_name && (
                                <div className="text-sm text-gray-500">{user.full_name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              user.is_active ? 'bg-green-600' : 'bg-red-600'
                            }`}></span>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(user.last_login)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3"
                            title="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            className={`font-medium text-sm mr-3 ${
                              user.is_active 
                                ? 'text-orange-600 hover:text-orange-800' 
                                : 'text-green-600 hover:text-green-800'
                            }`}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                            title="Delete user"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-6 rounded-t-lg">
              <h3 className="text-xl font-bold">Create New User</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={saving || !newUserForm.email || !newUserForm.username || !newUserForm.password}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
