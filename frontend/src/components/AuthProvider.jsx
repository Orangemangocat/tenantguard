import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    // Check for stored tokens on mount
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    
    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      fetchCurrentUser(storedAccessToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token invalid, clear storage
        logout();
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const response = await fetch('/auth/google/login');
      const data = await response.json();
      
      if (data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error initiating Google login:', error);
    }
  };

  const loginWithGitHub = async () => {
    try {
      const response = await fetch('/auth/github/login');
      const data = await response.json();
      
      if (data.auth_url) {
        // Redirect to GitHub OAuth
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error initiating GitHub login:', error);
    }
  };

  const handleOAuthCallback = async (tokens) => {
    // Called after OAuth redirect with tokens
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
    setUser(tokens.user);
    
    // Store tokens
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access_token);
        localStorage.setItem('access_token', data.access_token);
        return data.access_token;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    const permissions = {
      admin: ['read', 'write', 'delete', 'approve', 'manage_users', 'configure'],
      editor: ['read', 'write'],
      viewer: ['read']
    };
    
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const isAdmin = () => user && user.role === 'admin';
  const isEditor = () => user && (user.role === 'editor' || user.role === 'admin');

  const value = {
    user,
    loading,
    accessToken,
    refreshToken,
    loginWithGoogle,
    loginWithGitHub,
    handleOAuthCallback,
    refreshAccessToken,
    logout,
    hasPermission,
    isAdmin,
    isEditor,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
