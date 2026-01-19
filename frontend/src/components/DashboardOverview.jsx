import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { API_BASE_URL } from '../lib/apiBase.js';

/**
 * Dashboard Overview Component
 * Displays key statistics and metrics for the admin panel
 */
export default function DashboardOverview({ user, onNavigate }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);

        if (user?.role !== 'admin') {
          setStats({});
          setWarnings([]);
          setError(null);
          return;
        }

        const token = localStorage.getItem('access_token');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const fetchJson = async (url) => {
          const res = await fetch(url, {
            headers: {
              ...authHeaders,
              'Content-Type': 'application/json'
            }
          });
          if (!res.ok) {
            throw new Error(`Request failed (${res.status})`);
          }
          return res.json();
        };

        const tasks = [
          { key: 'admin', label: 'Admin stats', url: `${API_BASE_URL}/api/admin/stats` },
          { key: 'blog', label: 'Blog analytics', url: `${API_BASE_URL}/api/blog/analytics` },
          { key: 'approval', label: 'Approval stats', url: `${API_BASE_URL}/api/blog/approval/statistics` },
          { key: 'cases', label: 'Case stats', url: `${API_BASE_URL}/api/cases/stats` },
          { key: 'attorneys', label: 'Attorney stats', url: `${API_BASE_URL}/api/attorneys/stats` },
          { key: 'groups', label: 'Group stats', url: `${API_BASE_URL}/api/groups` },
          { key: 'queue', label: 'Worker queue', url: `${API_BASE_URL}/api/admin/queue` }
        ];

        const results = await Promise.allSettled(tasks.map((task) => fetchJson(task.url)));
        const nextStats = {};
        const nextWarnings = [];

        results.forEach((result, index) => {
          const task = tasks[index];
          if (result.status === 'fulfilled') {
            nextStats[task.key] = result.value;
          } else {
            nextWarnings.push(task.label);
          }
        });

        setStats(nextStats);
        setWarnings(nextWarnings);
        setLastUpdated(new Date());
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

  const formatDateTime = (value) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString();
  };

  const handleNavigate = (tab) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

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

  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Overview</h2>
          <p className="text-sm text-slate-200 mt-2">
            Your role has limited access to operational metrics. Contact an admin for full access.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Access Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700">
              You are signed in as <span className="font-semibold">{user?.role}</span>.
              The admin overview shows system counts, queue health, and intake metrics.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminStats = stats.admin || {};
  const blogStats = stats.blog || {};
  const approvalStats = stats.approval || {};
  const caseStats = stats.cases?.stats || {};
  const attorneyStats = stats.attorneys?.stats || {};
  const groupStats = stats.groups || {};
  const queueJobs = (stats.queue?.jobs || []).slice().sort((a, b) => {
    const aTime = new Date(a.enqueued_at || 0).getTime();
    const bTime = new Date(b.enqueued_at || 0).getTime();
    return bTime - aTime;
  });

  const blogTotal = (blogStats.total_published_posts || 0) + (blogStats.draft_posts || 0);
  const pendingApprovals = approvalStats.pending_count ?? adminStats.pendingBlogPosts ?? 0;

  const cards = [
    {
      key: 'users',
      title: 'Users',
      value: adminStats.totalUsers || 0,
      description: 'Total accounts',
      meta: `Admins manage access and roles.`,
      accent: 'border-l-slate-900',
      tab: 'users'
    },
    {
      key: 'groups',
      title: 'Groups',
      value: groupStats.count || 0,
      description: 'Teams and memberships',
      meta: 'Managed inside User Management.',
      accent: 'border-l-blue-700',
      tab: 'users'
    },
    {
      key: 'blog',
      title: 'Blog Posts',
      value: blogTotal,
      description: 'Published and draft posts',
      meta: `Pending approvals: ${pendingApprovals}`,
      accent: 'border-l-emerald-700',
      tab: 'blogManagement'
    },
    {
      key: 'tenant-intakes',
      title: 'Tenant Intakes',
      value: caseStats.total_cases || 0,
      description: 'Total intake cases',
      meta: `New or pending: ${adminStats.newTenantCases || 0}`,
      accent: 'border-l-amber-600',
      tab: 'intakes'
    },
    {
      key: 'attorney-intakes',
      title: 'Attorney Intakes',
      value: attorneyStats.total_attorneys || 0,
      description: 'Attorney applications',
      meta: `Pending review: ${attorneyStats.status_breakdown?.pending_review || 0}`,
      accent: 'border-l-teal-700',
      tab: 'attorneys'
    },
    {
      key: 'queue',
      title: 'Worker Queue',
      value: queueJobs.length,
      description: 'Jobs in queue',
      meta: queueJobs[0] ? `Latest: ${queueJobs[0].status}` : 'No recent jobs',
      accent: 'border-l-rose-700',
      tab: 'queue'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              Operations Overview
            </p>
            <h2 className="text-3xl font-semibold mt-2">Admin Dashboard Pulse</h2>
            <p className="text-sm text-slate-200 mt-2">
              Monitor intake flow, content pipeline, and worker capacity at a glance.
            </p>
          </div>
          <div className="text-xs text-slate-300">
            Last updated: {lastUpdated ? formatDateTime(lastUpdated) : 'Just now'}
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded">
          Some metrics failed to load: {warnings.join(', ')}.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => handleNavigate(card.tab)}
            className={`group w-full rounded-xl border bg-white p-4 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 border-l-4 ${card.accent}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{card.title}</p>
                <div className="text-3xl font-semibold text-slate-900">{card.value}</div>
                <p className="text-xs text-slate-500 mt-1">{card.description}</p>
              </div>
              <div className="text-xs font-medium text-slate-500 group-hover:text-slate-700">
                Open
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600">{card.meta}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Worker Queue Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {queueJobs.length === 0 ? (
              <div className="text-gray-600">No jobs are currently queued.</div>
            ) : (
              <div className="space-y-3">
                {queueJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">{job.status}</span>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(job.enqueued_at)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 break-words">
                      {job.description || job.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                <span className="text-sm text-amber-900">Pending blog approvals</span>
                <span className="text-sm font-semibold text-amber-900">{pendingApprovals}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                <span className="text-sm text-blue-900">New tenant intakes</span>
                <span className="text-sm font-semibold text-blue-900">
                  {adminStats.newTenantCases || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-teal-50 px-3 py-2">
                <span className="text-sm text-teal-900">Attorney apps pending</span>
                <span className="text-sm font-semibold text-teal-900">
                  {attorneyStats.status_breakdown?.pending_review || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2">
                <span className="text-sm text-rose-900">Queue depth</span>
                <span className="text-sm font-semibold text-rose-900">{queueJobs.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Intake Status</CardTitle>
          </CardHeader>
          <CardContent>
            {caseStats.status_breakdown ? (
              <div className="space-y-2 text-sm text-gray-700">
                {Object.entries(caseStats.status_breakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">Case status data is unavailable.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attorney Intake Status</CardTitle>
          </CardHeader>
          <CardContent>
            {attorneyStats.status_breakdown ? (
              <div className="space-y-2 text-sm text-gray-700">
                {Object.entries(attorneyStats.status_breakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">Attorney status data is unavailable.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blog Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Published</span>
                <span className="font-semibold text-gray-900">
                  {blogStats.total_published_posts || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Drafts</span>
                <span className="font-semibold text-gray-900">{blogStats.draft_posts || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending topics</span>
                <span className="font-semibold text-gray-900">
                  {blogStats.pending_topics || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hours since last post</span>
                <span className="font-semibold text-gray-900">
                  {blogStats.hours_since_last_post ?? 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
