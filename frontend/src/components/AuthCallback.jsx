import { useEffect } from 'react';

/**
 * OAuth Callback Handler
 * 
 * This component handles the OAuth callback from Google/GitHub authentication.
 * It extracts tokens from URL parameters, stores them in localStorage,
 * and redirects the user to the appropriate page.
 */
function AuthCallback({ onComplete }) {

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const tokenType = urlParams.get('token_type');
    const expiresIn = urlParams.get('expires_in');

    if (accessToken) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('token_type', tokenType || 'Bearer');
      
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      
      if (expiresIn) {
        const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
        localStorage.setItem('token_expires_at', expiresAt.toString());
      }

      // Fetch user info
      fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          
          // Redirect to dashboard or home page
          const redirectTo = localStorage.getItem('auth_redirect') || '/';
          localStorage.removeItem('auth_redirect');
          
          // Use window.location for full page reload to update auth state
          window.location.href = redirectTo;
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
          // Redirect anyway
          window.location.href = '/';
        });
    } else {
      // No token found, redirect to login
      console.error('No access token found in callback URL');
      if (onComplete) onComplete(false);
    }
  }, [onComplete]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ fontSize: '18px', color: '#666' }}>
        Completing authentication...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AuthCallback;
