import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/apiBase.js';

export default function AdminAttorneyIntakes() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/attorneys`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load attorney applications');
      const data = await res.json();
      setApplications(data.attorneys || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching attorney applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading attorney intakes...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Attorney Intake Submissions</h2>
      {applications.length === 0 ? (
        <div className="text-gray-600">No attorney applications found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Application ID</th>
                <th className="px-4 py-2 text-left">Attorney</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((attorney) => {
                const submittedAt = attorney.application_date || attorney.created_at;
                return (
                  <tr key={attorney.application_id || attorney.id} className="border-t">
                    <td className="px-4 py-3">
                      {attorney.application_id || attorney.id}
                    </td>
                    <td className="px-4 py-3">
                      {attorney.first_name} {attorney.last_name}
                    </td>
                    <td className="px-4 py-3">{attorney.email}</td>
                    <td className="px-4 py-3">{attorney.status || 'pending_review'}</td>
                    <td className="px-4 py-3">
                      {submittedAt ? new Date(submittedAt).toLocaleString() : 'Unknown'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
