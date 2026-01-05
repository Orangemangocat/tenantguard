import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from './Login';

const ProtectedRoute = ({ children, requireAdmin = false, requireEditor = false }) => {
  const { user, loading, isAdmin, isEditor, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to access this page
            </p>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
        {showLogin && <Login onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-2">
              You don't have permission to access this page
            </p>
            <p className="text-sm text-gray-500">
              Admin role required. Your current role: <span className="font-semibold">{user?.role}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (requireEditor && !isEditor()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-2">
              You don't have permission to access this page
            </p>
            <p className="text-sm text-gray-500">
              Editor or Admin role required. Your current role: <span className="font-semibold">{user?.role}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
