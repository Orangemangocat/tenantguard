import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Tabs, Tab, AppBar, Toolbar, Button, Avatar, Menu, MenuItem } from '@mui/material';
import { Dashboard as DashboardIcon, Article as ArticleIcon, People as PeopleIcon, Settings as SettingsIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import ApprovalQueue from './ApprovalQueue';
import UserManagement from './UserManagement';
import DashboardOverview from './DashboardOverview';

/**
 * Main Admin Dashboard Component
 * Provides tabbed interface for blog approval, user management, and analytics
 */
export default function AdminDashboard({ user, onLogout }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  // Check if user has admin permissions
  const isAdmin = user && user.role === 'admin';
  const isEditor = user && (user.role === 'admin' || user.role === 'editor');

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Please log in to access the admin panel
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Top App Bar */}
      <AppBar position="static" sx={{ bgcolor: '#1a237e' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            TenantGuard Admin Panel
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {user.full_name || user.username}
            </Typography>
            <Box>
              <Avatar
                onClick={handleMenuOpen}
                sx={{ 
                  bgcolor: '#ff6f00', 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#ff8f00' }
                }}
              >
                {(user.full_name || user.username).charAt(0).toUpperCase()}
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    Role: {user.role}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ p: 3 }}>
        {/* Welcome Banner */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'white' }}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user.full_name || user.username}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {isAdmin ? 'You have full administrative access to manage blog posts and users.' : 
             isEditor ? 'You can create and submit blog posts for approval.' :
             'You have read-only access to the system.'}
          </Typography>
        </Paper>

        {/* Tabbed Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Dashboard" 
              iconPosition="start"
            />
            <Tab 
              icon={<ArticleIcon />} 
              label="Blog Approval" 
              iconPosition="start"
              disabled={!isAdmin}
            />
            <Tab 
              icon={<PeopleIcon />} 
              label="User Management" 
              iconPosition="start"
              disabled={!isAdmin}
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {currentTab === 0 && <DashboardOverview user={user} />}
          {currentTab === 1 && isAdmin && <ApprovalQueue user={user} />}
          {currentTab === 2 && isAdmin && <UserManagement user={user} />}
        </Box>
      </Box>
    </Box>
  );
}
