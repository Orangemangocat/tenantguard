import React, { useEffect, useState } from 'react';
import CaseDetailModal from './CaseDetailModal';
import { API_BASE_URL } from '../lib/apiBase.js';

export default function IntakeReview() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/cases`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load cases');
      const data = await res.json();
      setCases(data.cases || data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching cases');
    } finally {
      setLoading(false);
    }
  };

  const openCase = (c) => {
    setSelectedCase(c);
  };

  const closeModal = () => {
    setSelectedCase(null);
  };

  const handleActionComplete = async () => {
    // Refresh list after actions
    await fetchCases();
    closeModal();
  };

  if (loading) return <div className="p-6">Loading cases…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Intake Submissions</h2>
      {cases.length === 0 ? (
        <div className="text-gray-600">No intake submissions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Case ID</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Submitter</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openCase(c)}>
                  <td className="px-4 py-3">{c.id}</td>
                  <td className="px-4 py-3">{c.case_summary || c.legal_issue?.type || 'Case'}</td>
                  <td className="px-4 py-3">{c.contact_info?.email || '—'}</td>
                  <td className="px-4 py-3">{c.status || 'new'}</td>
                  <td className="px-4 py-3">{new Date(c.created_at || c.created || Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={closeModal}
          onActionComplete={handleActionComplete}
        />
      )}
    </div>
  );
}
