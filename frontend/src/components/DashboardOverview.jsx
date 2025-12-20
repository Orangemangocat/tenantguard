import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { Article, PendingActions, CheckCircle, Cancel, People } from '@mui/icons-material';

/**
 * Dashboard Overview Component
 * Displays key statistics and metrics for the admin panel
 */
export default function DashboardOverview({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch blog statistics
      const blogResponse = await fetch('/api/blog/analytics');
      const blogData = await blogResponse.json();
      
      // Fetch approval queue statistics (admin only)
      let approvalData = null;
      if (user.role === 'admin') {
        const approvalResponse = await fetch('/api/blog/approval/statistics', {
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card sx={{ height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            bgcolor: `${color}.light`, 
            borderRadius: 2, 
            p: 1.5, 
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon sx={{ color: `${color}.main`, fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Blog Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Posts"
            value={stats?.blog?.total_posts || 0}
            icon={Article}
            color="primary"
            subtitle="All blog posts"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Published"
            value={stats?.blog?.published_count || 0}
            icon={CheckCircle}
            color="success"
            subtitle="Live on website"
          />
        </Grid>

        {user.role === 'admin' && stats?.approval && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Approval"
                value={stats.approval.pending_count || 0}
                icon={PendingActions}
                color="warning"
                subtitle="Awaiting review"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Rejected"
                value={stats.approval.rejected_count || 0}
                icon={Cancel}
                color="error"
                subtitle="Not approved"
              />
            </Grid>
          </>
        )}

        {/* Category Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Posts by Category
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Technical Updates</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {stats?.blog?.by_category?.technical || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Market Research</Typography>
                  <Typography variant="h6" color="secondary.main" fontWeight="bold">
                    {stats?.blog?.by_category?.['market-research'] || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        {user.role === 'admin' && stats?.approval?.recent_approvals && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Recent Approvals
                </Typography>
                {stats.approval.recent_approvals.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    No recent approvals
                  </Typography>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {stats.approval.recent_approvals.slice(0, 5).map((post, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          py: 1, 
                          borderBottom: index < 4 ? '1px solid #e0e0e0' : 'none' 
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {post.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Approved {new Date(post.approved_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Days Since Last Post */}
        {stats?.blog?.days_since_last_post !== undefined && (
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              bgcolor: stats.blog.days_since_last_post > 5 ? 'error.light' : 
                       stats.blog.days_since_last_post > 3 ? 'warning.light' : 
                       'success.light'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Days Since Last Post
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {stats.blog.days_since_last_post}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {stats.blog.days_since_last_post > 5 ? 
                    '⚠️ Overdue - Auto-posting enabled' :
                    stats.blog.days_since_last_post > 3 ?
                    '⏰ Due soon' :
                    '✅ On schedule'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
