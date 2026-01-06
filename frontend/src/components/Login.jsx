import React, { useState } from 'react';

/**
 * Login Component with OAuth Integration
 * Supports Google OAuth, GitHub OAuth, and local login
 */
export default function Login({ onSuccess, onSwitchToRegister, onClose, pendingStartRole, setPendingStartRole }) {
  const [showLocalLogin, setShowLocalLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOAuthLogin = async (provider) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get OAuth authorization URL from backend, include pending start role if provided
      let authUrlEndpoint = `/auth/${provider}/login`
      if (pendingStartRole) {
        authUrlEndpoint += `?start=${encodeURIComponent(pendingStartRole)}`
      }
      const response = await fetch(authUrlEndpoint);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to initiate ${provider} login`);
      }
      
      // Clear pending role (page will navigate) then redirect to OAuth provider
      if (setPendingStartRole) setPendingStartRole(null)
      window.location.href = data.auth_url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Call success callback with user data
      if (onSuccess) {
        onSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-red-100">Sign in to access your TenantGuard dashboard</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!showLocalLogin ? (
            <>
              {/* OAuth Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200 font-medium text-base shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <button
                  onClick={() => handleOAuthLogin('github')}
                  disabled={loading}
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 font-medium text-base shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  {loading ? 'Connecting...' : 'Continue with GitHub'}
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or</span>
                </div>
              </div>

              <button
                onClick={() => setShowLocalLogin(true)}
                className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium text-base rounded-lg transition-all duration-200 bg-white hover:bg-gray-50"
              >
                Sign in with Email
              </button>

              <div className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-red-800 hover:text-red-900 font-semibold hover:underline transition-colors"
                >
                  Create account
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Local Login Form */}
              <form onSubmit={handleLocalLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="w-full h-11 px-4 border-2 border-gray-300 rounded-lg focus:border-red-800 focus:ring-2 focus:ring-red-800 focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    className="w-full h-11 px-4 border-2 border-gray-300 rounded-lg focus:border-red-800 focus:ring-2 focus:ring-red-800 focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-red-800 hover:bg-red-900 text-white font-medium text-base rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setShowLocalLogin(false)}
                className="w-full mt-4 text-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to OAuth options
              </button>

              <div className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-red-800 hover:text-red-900 font-semibold hover:underline transition-colors"
                >
                  Create account
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
