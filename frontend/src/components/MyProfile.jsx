import React, { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../lib/apiBase'

const MyProfile = ({ onClose }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', bio: '', avatar_url: '' })
  const [saving, setSaving] = useState(false)

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) return false

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.access_token)
        return true
      }
      return false
    } catch (err) {
      console.error('Error refreshing access token:', err)
      return false
    }
  }, [])

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const accessToken = localStorage.getItem('access_token')
      if (!accessToken) {
        setError('Not authenticated. Please login.')
        setLoading(false)
        return
      }

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setFormData({
          full_name: data.user.full_name || '',
          bio: data.user.bio || '',
          avatar_url: data.user.avatar_url || ''
        })
      } else if (res.status === 401) {
        const refreshed = await refreshAccessToken()
        if (refreshed) await fetchUserProfile()
        else setError('Session expired. Please login again.')
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [refreshAccessToken])

  useEffect(() => { fetchUserProfile() }, [fetchUserProfile])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const accessToken = localStorage.getItem('access_token')
      const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        // success
        setEditing(false)
        await fetchUserProfile()
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setFormData({ full_name: user.full_name || '', bio: user.bio || '', avatar_url: user.avatar_url || '' })
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-300'
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div></div>
        <p className="text-center mt-4 text-gray-600">Loading profile...</p>
      </div>
    </div>
  )

  if (error && !user) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Error Loading Profile</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={fetchUserProfile} className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors">Retry</button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Close</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
        <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">My Profile</h2>
              <p className="text-red-100 mt-1">Manage your account information</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-red-200 transition-colors">✕</button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || user.username} className="w-24 h-24 rounded-full object-cover border-4 border-gray-200" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center border-4 border-gray-200">
                  <span className="text-3xl font-bold text-white">{(user.full_name || user.username).charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{user.full_name || user.username}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>{(user.role || '').toUpperCase()}</span>
                {user.is_verified && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">✔ Verified</span>}
              </div>

              <p className="text-gray-600 flex items-center gap-2">{user.email}</p>
              <p className="text-gray-500 text-sm mt-1">@{user.username}</p>
            </div>

            {!editing && <button onClick={() => setEditing(true)} className="px-4 py-2 bg-red-800 text-white rounded-lg">Edit Profile</button>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                {editing ? <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /> : <p className="text-gray-900 py-2">{user.full_name || 'Not provided'}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <p className="text-gray-900 py-2">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <p className="text-gray-900 py-2">@{user.username}</p>
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar URL</label>
                {editing ? <input type="url" name="avatar_url" value={formData.avatar_url} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /> : <p className="text-gray-900 py-2 break-all">{user.avatar_url || 'Not provided'}</p>}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                {editing ? <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /> : <p className="text-gray-900 py-2 whitespace-pre-wrap">{user.bio || 'No bio provided'}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Status</label>
                <div className="flex items-center gap-2"><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}><span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-red-600'}`}></span>{user.is_active ? 'Active' : 'Inactive'}</span></div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Member Since</label>
                <p className="text-gray-900 py-2">{formatDate(user.created_at)}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Login</label>
                <p className="text-gray-900 py-2">{formatDate(user.last_login)}</p>
              </div>
            </div>
          </div>

          {editing && (
            <div className="mt-8 flex gap-3 justify-end border-t pt-6">
              <button onClick={handleCancelEdit} disabled={saving} className="px-6 py-2 bg-gray-200">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 bg-red-800 text-white">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyProfile