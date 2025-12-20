import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Paper, Link } from '@mui/material';

/**
 * User Registration Form Component
 * Allows new users to create accounts
 */
export default function Register({ onSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          full_name: formData.full_name,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#f5f5f5',
      p: 2
    }}>
      <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
          Create Account
        </Typography>
        <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ mb: 3 }}>
          Join TenantGuard to access our platform
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              fullWidth
              autoComplete="email"
            />

            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              required
              fullWidth
              autoComplete="username"
            />

            <TextField
              label="Full Name (Optional)"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              fullWidth
              autoComplete="name"
            />

            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
              helperText="Minimum 8 characters"
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={formData.confirm_password}
              onChange={(e) => handleChange('confirm_password', e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{ mt: 2 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onSwitchToLogin}
              sx={{ cursor: 'pointer' }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="textSecondary" textAlign="center" display="block">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
