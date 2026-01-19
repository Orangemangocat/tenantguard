import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { API_BASE_URL } from '../lib/apiBase.js';

export default function CaseStatus() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const caseNumber = params.get('case');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    if (!caseNumber) {
      setError('Missing case number.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/cases/${caseNumber}/status`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load case status');
      }
      setStatus(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load case status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (!caseNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Missing Case Number</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Return to the intake form to start again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardContent className="p-6 text-sm text-gray-600">Loading case status...</CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Status Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={fetchStatus}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Case Notebook Status</CardTitle>
          <p className="text-sm text-gray-600">Case {caseNumber}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Case Status</div>
              <div className="font-semibold">{status.case_status || 'intake_submitted'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Documents Received</div>
              <div className="font-semibold">{status.documents_count}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Notebook Processing</div>
              <div className="font-semibold">{status.analysis_status}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Last Updated</div>
              <div className="font-semibold">{status.last_analysis_at || 'Pending'}</div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            We are assembling your case notebook and checking for missing documents. You can proceed to
            payment while processing continues.
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={fetchStatus}>Refresh status</Button>
            <Button
              onClick={() => {
                window.location.href = `/payment?type=tenant&case=${encodeURIComponent(caseNumber)}`;
              }}
            >
              Continue to Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
