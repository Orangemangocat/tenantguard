import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { API_BASE_URL } from '../lib/apiBase.js';

const intakeCopy = {
  tenant: {
    title: 'Tenant Intake Payment',
    description: 'Complete payment to unlock your tenant dashboard and case notebook.',
    highlights: ['Case notebook assembly', 'Document organization', 'Status tracking']
  },
  attorney: {
    title: 'Attorney Intake Payment',
    description: 'Complete payment to activate your attorney intake review.',
    highlights: ['Application processing', 'Case matching setup', 'Access to intake pipeline']
  }
};

export default function PaymentPortal() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const intakeType = params.get('type') || 'tenant';
  const caseNumber = params.get('case');
  const applicationId = params.get('application_id');
  const status = params.get('status');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const copy = intakeCopy[intakeType] || intakeCopy.tenant;

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE_URL}/api/payments/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake_type: intakeType,
          case_number: caseNumber,
          application_id: applicationId,
          success_url: `${window.location.origin}/payment?type=${encodeURIComponent(intakeType)}&status=success`,
          cancel_url: `${window.location.origin}/payment?type=${encodeURIComponent(intakeType)}&status=cancel`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Stripe session URL missing.');
      }
    } catch (err) {
      setError(err.message || 'Payment initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-sm text-gray-600">{copy.description}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {status === 'success' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Payment received. We are activating your account now.
            </div>
          )}
          {status === 'cancel' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Payment was cancelled. You can retry when ready.
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="text-xs uppercase tracking-wide text-slate-400">Includes</div>
            <ul className="mt-2 space-y-2">
              {copy.highlights.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
            <Button onClick={handleCheckout} disabled={loading}>
              {loading ? 'Starting checkout...' : 'Proceed to Payment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
