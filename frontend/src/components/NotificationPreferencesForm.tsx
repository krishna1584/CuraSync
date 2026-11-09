'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '@/lib/config';
import { getUser, setUser as storeUser } from '@/lib/auth';

export interface NotificationPreferences {
  appointmentEmails: boolean;
  inAppAlerts: boolean;
  reportAlerts: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  appointmentEmails: true,
  inAppAlerts: true,
  reportAlerts: true,
};

interface Option {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}

const OPTIONS_BY_ROLE: Record<string, Option[]> = {
  patient: [
    { key: 'appointmentEmails', label: 'Appointment emails', description: 'Email me when an appointment is booked, cancelled or completed' },
    { key: 'inAppAlerts', label: 'Live alerts', description: 'Show pop-up alerts for appointments and prescriptions while I am signed in' },
    { key: 'reportAlerts', label: 'Report ready alerts', description: 'Tell me when the values from an uploaded report are ready' },
  ],
  doctor: [
    { key: 'inAppAlerts', label: 'Live alerts', description: 'Show pop-up alerts for new and changed appointments while I am signed in' },
  ],
};

interface Props {
  userId: string;
  role: string;
  initial?: Partial<NotificationPreferences>;
}

export default function NotificationPreferencesForm({ userId, role, initial }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...initial });
  const [saving, setSaving] = useState(false);
  const options = OPTIONS_BY_ROLE[role] || OPTIONS_BY_ROLE.doctor;

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationPreferences: prefs }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        // Keep the cached user in sync so live alerts follow the new choice immediately.
        const cached = getUser();
        if (cached) storeUser({ ...cached, notificationPreferences: prefs } as typeof cached);
        toast.success('Notification preferences saved');
      } else {
        toast.error(result.message || 'Failed to save preferences');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {options.map((option) => (
          <div key={option.key} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{option.label}</p>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={prefs[option.key]}
                onChange={(e) => setPrefs({ ...prefs, [option.key]: e.target.checked })}
                className="sr-only peer"
                aria-label={option.label}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
