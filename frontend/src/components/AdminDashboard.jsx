import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import ApprovalQueue from './ApprovalQueue.jsx';
import BlogManagement from './BlogManagement.jsx';
import UserManagement from './UserManagement.jsx';
import IntakeReview from './IntakeReview.jsx';
import DashboardOverview from './DashboardOverview.jsx';
import AdminQueue from './AdminQueue.jsx';

/**
 * Main Admin Dashboard Component
 * Provides tabbed interface for admin functions
 */
export default function AdminDashboard({ user, onLogout, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = user && user.role === 'admin';

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please log in to access the admin panel</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.full_name || user?.username}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button variant="outline" onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-red-800 text-red-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approvals'
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Blog Approvals
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('blogManagement')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'blogManagement'
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Blog Management
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('intakes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'intakes'
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Intakes
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('queue')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'queue'
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Queue
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <DashboardOverview user={user} />}
        {activeTab === 'approvals' && isAdmin && <ApprovalQueue user={user} />}
        {activeTab === 'blogManagement' && isAdmin && <BlogManagement />}
        {activeTab === 'users' && isAdmin && <UserManagement user={user} />}
        {activeTab === 'intakes' && isAdmin && <IntakeReview user={user} />}
        {activeTab === 'queue' && isAdmin && <AdminQueue />}
      </div>
    </div>
  );
}
