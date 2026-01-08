import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { API_BASE_URL } from '../lib/apiBase.js';

/**
 * Dashboard Overview Component
 * Displays key statistics and metrics for the admin panel
 */
export default function DashboardOverview({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        
        // Fetch blog statistics
        const blogResponse = await fetch(`${API_BASE_URL}/api/blog/analytics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        const blogData = await blogResponse.json();
        
        // Fetch approval queue statistics (admin only)
        let approvalData = null;
        if (user?.role === 'admin') {
          const approvalResponse = await fetch(`${API_BASE_URL}/api/blog/approval/statistics`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          approvalData = await approvalResponse.json();
        }
        
        setStats({
          blog: blogData,
          approval: approvalData
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [user]);

  

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading dashboard statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">
          {user.role === 'admin' 
            ? 'You have full administrative access to manage blog posts and users.'
            : user.role === 'editor'
            ? 'You can create and submit blog posts for approval.'
            : 'You have read-only access to the system.'}
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.blog?.total_posts || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Published blog posts</p>
          </CardContent>
        </Card>

        {user.role === 'admin' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {stats?.approval?.pending_count || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.approval?.approved_count || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Ready to publish</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Days Since Last Post</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.blog?.days_since_last_post || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Auto-post at 5 days</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Category Breakdown */}
      {stats?.blog?.by_category && (
        <Card>
          <CardHeader>
            <CardTitle>Posts by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.blog.by_category).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-700">{category}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Auto-posting</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                Enabled
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Max days between posts</span>
              <span className="font-semibold text-gray-900">5 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Your role</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
