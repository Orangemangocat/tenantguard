import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { API_BASE_URL } from '../lib/apiBase';

export default function Onboarding({ user, onFinish }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedRole, setSelectedRole] = useState(null); // 'tenant' or 'attorney'

    // Profile fields
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

    // Organization
    const [orgName, setOrgName] = useState('');
    const [createdGroupId, setCreatedGroupId] = useState(null);

    // Invites
    const [inviteEmails, setInviteEmails] = useState(''); // comma separated

    const next = () => setStep((s) => Math.min(4, s + 1));
    const prev = () => setStep((s) => Math.max(1, s - 1));

    const token = () => localStorage.getItem('access_token');

    const saveProfile = async () => {
        if (!user || !user.id) {
            setError('Not authenticated. Please login.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to update profile');
            }

            setSuccess('Profile updated');
            setTimeout(() => setSuccess(''), 3000);
            next();
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const createOrganization = async () => {
        if (!orgName) {
            setError('Organization name is required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const res = await fetch(`${API_BASE_URL}/api/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({ name: orgName }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to create organization');
            }

            const data = await res.json();
            setCreatedGroupId(data.id || data.group?.id || null);
            setSuccess('Organization created');
            setTimeout(() => setSuccess(''), 3000);
            next();
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const sendInvites = async () => {
        if (!createdGroupId) {
            setError('No organization selected');
            return;
        }

        const emails = inviteEmails.split(',').map((e) => e.trim()).filter(Boolean);
        if (emails.length === 0) {
            setError('Please enter at least one email to invite');
            return;
        }

        try {
            setLoading(true);
            setError('');

            for (const email of emails) {
                const res = await fetch(`${API_BASE_URL}/api/groups/${createdGroupId}/members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token()}`,
                    },
                    body: JSON.stringify({ email }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    // continue but capture error
                    throw new Error(data.error || `Failed to invite ${email}`);
                }
            }

            setSuccess('Invites sent');
            setTimeout(() => setSuccess(''), 3000);
            next();
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-2">Welcome{user?.full_name ? `, ${user.full_name}` : ''}</h2>
                <p className="text-sm text-gray-600 mb-4">Let's get your account set up. Step {step} of 4.</p>

                {error && <div className="mb-4 text-red-600">{error}</div>}
                {success && <div className="mb-4 text-green-600">{success}</div>}

                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">I'm signing up as</label>
                            <div className="flex gap-2">
                                <button
                                    className={`px-3 py-2 rounded border ${selectedRole === 'tenant' ? 'bg-red-800 text-white' : 'bg-white'}`}
                                    onClick={() => setSelectedRole('tenant')}
                                >
                                    Tenant
                                </button>
                                <button
                                    className={`px-3 py-2 rounded border ${selectedRole === 'attorney' ? 'bg-red-800 text-white' : 'bg-white'}`}
                                    onClick={() => setSelectedRole('attorney')}
                                >
                                    Attorney / Lawyer
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full name</label>
                            <input className="w-full border px-3 py-2 rounded" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                            <input className="w-full border px-3 py-2 rounded" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button variant="outline" onClick={prev} disabled={step === 1}>Back</Button>
                            <Button className="ml-2" onClick={saveProfile} disabled={loading}>{loading ? 'Saving...' : 'Save & Next'}</Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                            <input className="w-full border px-3 py-2 rounded" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="My Organization" />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button variant="outline" onClick={prev}>Back</Button>
                            <Button className="ml-2" onClick={createOrganization} disabled={loading}>{loading ? 'Creating...' : 'Create & Next'}</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Invite teammates (comma separated emails)</label>
                            <textarea className="w-full border px-3 py-2 rounded" rows={4} value={inviteEmails} onChange={(e) => setInviteEmails(e.target.value)} placeholder="alice@example.com, bob@example.com" />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button variant="outline" onClick={prev}>Back</Button>
                            <Button className="ml-2" onClick={sendInvites} disabled={loading}>{loading ? 'Sending...' : 'Send Invites'}</Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <h3 className="font-medium">Finish</h3>
                        <p className="text-sm text-gray-600">You're all set. Start using TenantGuard to manage cases and collaborate with your team.</p>
                        <div className="flex flex-col md:flex-row gap-2 justify-end mt-4">
                            <Button variant="outline" onClick={prev}>Back</Button>
                            <Button className="ml-2" onClick={() => {
                                // Prefer the explicit selection made during onboarding
                                if (selectedRole === 'tenant') {
                                    if (typeof window !== 'undefined') window.location.href = '/tenant-intake';
                                    return;
                                }
                                if (selectedRole === 'attorney') {
                                    if (typeof window !== 'undefined') window.location.href = '/attorney-intake';
                                    return;
                                }

                                // Fallback to URL param if present (backcompat)
                                const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                                const start = params ? params.get('start') : null;
                                if (start === 'tenant') {
                                    if (typeof window !== 'undefined') window.location.href = '/tenant-intake';
                                    return;
                                }
                                if (start === 'attorney') {
                                    if (typeof window !== 'undefined') window.location.href = '/attorney-intake';
                                    return;
                                }

                                if (onFinish) onFinish();
                            }}>Finish</Button>
                            <a href="/tenant-intake" className="ml-2">
                                <Button>Start Tenant Intake</Button>
                            </a>
                            <a href="/attorney-intake" className="ml-2">
                                <Button>Go to Attorney Intake</Button>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
