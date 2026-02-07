import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { API_BASE_URL } from '../lib/apiBase.js';

export default function TenantDocumentUpload() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const caseNumber = params.get('case');
  const [hasDocuments, setHasDocuments] = useState(null);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event) => {
    const selection = Array.from(event.target.files || []);
    setFiles(selection);
  };

  const enqueueCaseProcessing = async () => {
    if (!caseNumber) return;
    try {
      await fetch(`${API_BASE_URL}/api/cases/${caseNumber}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Failed to queue case processing:', err);
    }
  };

  const handleSubmit = async () => {
    if (!caseNumber) {
      setError('Missing case number. Return to intake and try again.');
      return;
    }

    if (hasDocuments && files.length === 0) {
      setError('Select at least one document to upload.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setStatus('');

      if (hasDocuments) {
        const formData = new FormData();
        files.forEach((file) => formData.append('documents', file));

        const res = await fetch(`${API_BASE_URL}/api/cases/${caseNumber}/documents`, {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Document upload failed');
        }
      }

      await enqueueCaseProcessing();
      setStatus('Documents received. Preparing your case notebook...');
      window.location.href = `/case-status?case=${encodeURIComponent(caseNumber)}`;
    } catch (err) {
      setError(err.message || 'Something went wrong during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!caseNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Missing Case Number</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              We could not find your case number. Please return to the intake form.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Upload Supporting Documents</CardTitle>
          <p className="text-sm text-gray-600">
            Case {caseNumber}. Upload any notices, lease agreements, or court documents.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Do you have documents to upload right now?</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={hasDocuments === true ? 'default' : 'outline'}
                onClick={() => setHasDocuments(true)}
              >
                Yes, upload now
              </Button>
              <Button
                type="button"
                variant={hasDocuments === false ? 'default' : 'outline'}
                onClick={() => setHasDocuments(false)}
              >
                Not yet
              </Button>
            </div>
          </div>

          {hasDocuments && (
            <div className="space-y-2">
              <Label htmlFor="documents">Select documents</Label>
              <Input
                id="documents"
                type="file"
                multiple
                onChange={handleFileChange}
              />
              {files.length > 0 && (
                <div className="text-xs text-gray-600">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
          {status && <div className="text-sm text-green-700">{status}</div>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || hasDocuments === null}
            >
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
