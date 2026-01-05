import React, { useState, useCallback, useEffect } from 'react';

export default function CaseDetailModal({ caseData, onClose, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [error, setError] = useState(null);

  const caseNumber = caseData.case_number || caseData.caseNumber || caseData.id;

  const callAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/cases/${caseNumber}/process`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to enqueue analysis');
      const data = await res.json();
      // Endpoint now enqueues a background job and returns job info
      if (data.queued) {
        setAnalysis({ queued: true, job_id: data.job_id });
        // fetch saved analyses (may be none yet)
        await fetchSavedAnalyses();
      } else if (data.analysis) {
        setAnalysis(data.analysis);
        await fetchSavedAnalyses();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAnalyses = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseNumber}/analyses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to fetch analyses');
      const data = await res.json();
      setSavedAnalyses(data.analyses || []);
    } catch (err) {
      console.error(err);
    }
  }, [caseNumber]);

  useEffect(() => {
    fetchSavedAnalyses();
  }, [fetchSavedAnalyses]);

  const updateStatus = async (newStatus) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseNumber}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      await res.json();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Status update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg z-10 max-w-3xl w-full">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Case {caseNumber}</h3>
          <button className="text-gray-600" onClick={onClose}>Close</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <strong>Submitter:</strong> {caseData.contact_info?.email || caseData.email}
          </div>
          <div>
            <strong>Summary:</strong>
            <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{caseData.case_summary || caseData.legal_issue?.description || '—'}</div>
          </div>

          <div className="flex gap-2">
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded"
              onClick={() => updateStatus('under_review')}
              disabled={loading}
            >
              Mark Under Review
            </button>

            <button
              className="px-3 py-2 bg-green-600 text-white rounded"
              onClick={() => updateStatus('attorney_assigned')}
              disabled={loading}
            >
              Assign Attorney
            </button>

            <button
              className="px-3 py-2 bg-yellow-600 text-white rounded"
              onClick={() => updateStatus('in_progress')}
              disabled={loading}
            >
              Set In Progress
            </button>
          </div>

          <div className="pt-2">
            <button
              className="px-3 py-2 bg-indigo-600 text-white rounded"
              onClick={callAnalyze}
              disabled={loading}
            >
              {loading ? 'Analyzing…' : 'Analyze with AI'}
            </button>
          </div>

          {error && <div className="text-red-600">{error}</div>}

          {analysis && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              {analysis.queued ? (
                <div>
                  <strong>Analysis queued:</strong> Job {analysis.job_id}. Refreshing saved analyses shortly.
                </div>
              ) : (
                <>
                  <h4 className="font-semibold">AI Summary</h4>
                  <div className="text-sm mt-2">{analysis.summary}</div>
                  <h4 className="font-semibold mt-3">Recommendation</h4>
                  <div className="text-sm mt-2">{analysis.recommendation}</div>
                </>
              )}
            </div>
          )}

          {savedAnalyses.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold">Saved Analyses</h4>
              <div className="space-y-3 mt-2">
                {savedAnalyses.map((a) => (
                  <div key={a.id} className="p-3 bg-white border rounded">
                    <div className="text-xs text-gray-500">{new Date(a.created_at).toLocaleString()} — {a.provider || 'heuristic'}</div>
                    <div className="mt-2 text-sm font-medium">{a.analysis?.summary || a.analysis?.raw || '—'}</div>
                    <div className="mt-1 text-sm text-gray-700">{a.analysis?.recommendation || ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
