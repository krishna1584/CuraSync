'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Lock, Globe, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '@/lib/config';

interface HospitalSettings {
  hospitalName: string;
  hospitalEmail: string;
  hospitalPhone: string;
  allowPublicSignup: boolean;
  requireEmailVerification: boolean;
  emailNotifications: boolean;
}

const DEFAULT_SETTINGS: HospitalSettings = {
  hospitalName: '',
  hospitalEmail: '',
  hospitalPhone: '',
  allowPublicSignup: true,
  requireEmailVerification: false,
  emailNotifications: false,
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          aria-label={label}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<HospitalSettings>(DEFAULT_SETTINGS);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [verificationAvailable, setVerificationAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const router = useRouter();

  const loadSettings = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        const { emailConfigured: configured, verificationAvailable: canVerify, ...rest } = result.data;
        setSettings({ ...DEFAULT_SETTINGS, ...rest });
        setEmailConfigured(Boolean(configured));
        setVerificationAvailable(Boolean(canVerify));
      } else {
        toast.error(result.message || 'Could not load settings');
      }
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('user');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const userRole = userData?.role;

    if (!token || !['admin', 'nurse', 'receptionist'].includes(userRole)) {
      router.push('/auth/login?role=admin');
      return;
    }

    // Only admins can view or change hospital-wide settings.
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }
    setCanEdit(true);
    loadSettings();
  }, [router, loadSettings]);

  const update = <K extends keyof HospitalSettings>(key: K, value: HospitalSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        const { emailConfigured: configured, verificationAvailable: canVerify, ...rest } = result.data;
        setSettings({ ...DEFAULT_SETTINGS, ...rest });
        setEmailConfigured(Boolean(configured));
        setVerificationAvailable(Boolean(canVerify));
        toast.success('Settings saved');
      } else {
        toast.error(result.message || 'Failed to save settings');
      }
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your hospital system settings</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!canEdit ? (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-600">
            Only hospital administrators can change these settings.
          </div>
        ) : (
          <>
            {!emailConfigured && (
              <div className="mb-6 flex gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800" role="status">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p>
                  Email sending is not set up on the server (EMAIL_HOST, EMAIL_USER, EMAIL_PASS), so the email
                  settings below are saved but have no effect until it is.
                </p>
              </div>
            )}

            {/* Hospital Information */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Hospital Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                  <input
                    id="hospitalName"
                    type="text"
                    value={settings.hospitalName}
                    onChange={(e) => update('hospitalName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="hospitalEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="hospitalEmail"
                    type="email"
                    value={settings.hospitalEmail}
                    onChange={(e) => update('hospitalEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="hospitalPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    id="hospitalPhone"
                    type="tel"
                    value={settings.hospitalPhone}
                    onChange={(e) => update('hospitalPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              </div>
              <Toggle
                label="Appointment emails"
                description="Email patients when an appointment is booked or its status changes"
                checked={settings.emailNotifications}
                onChange={(v) => update('emailNotifications', v)}
              />
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Sign-up &amp; Sign-in</h2>
              </div>
              <div className="space-y-4">
                <Toggle
                  label="Allow patient self sign-up"
                  description="When off, only admins can create accounts"
                  checked={settings.allowPublicSignup}
                  onChange={(v) => update('allowPublicSignup', v)}
                />
                <Toggle
                  label="Require email verification"
                  description={verificationAvailable
                    ? 'Users must confirm their email with a code before signing in'
                    : 'Turned off on the server (EMAIL_VERIFICATION_ENABLED). Anyone can sign up and sign in with any email, e.g. test accounts.'}
                  checked={settings.requireEmailVerification}
                  onChange={(v) => update('requireEmailVerification', v)}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
