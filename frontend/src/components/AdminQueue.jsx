import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/apiBase.js';

export default function AdminQueue() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/queue`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load queue');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching queue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading queue…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Background Job Queue</h2>
      {jobs.length === 0 ? (
        <div className="text-gray-600">No jobs in queue.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Job ID</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Enqueued</th>
                <th className="px-4 py-2 text-left">Started</th>
                <th className="px-4 py-2 text-left">Ended</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="px-4 py-3 break-words max-w-xs">{j.id}</td>
                  <td className="px-4 py-3">{j.status}</td>
                  <td className="px-4 py-3">{j.enqueued_at || '—'}</td>
                  <td className="px-4 py-3">{j.started_at || '—'}</td>
                  <td className="px-4 py-3">{j.ended_at || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
