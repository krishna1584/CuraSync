'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Calendar, FileText, Activity } from 'lucide-react';
import { API_URL } from '@/lib/config';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  appointmentsByMonth: { month: string; count: number }[];
  reportsByCategory: { category: string; count: number }[];
  userGrowth: { month: string; patients: number; doctors: number }[];
  topDoctors: { name: string; appointments: number }[];
}

interface ApiAppointment {
  date?: string;
  createdAt?: string;
  doctor?: { _id?: string; name?: string } | null;
}

interface ApiReport {
  reportType?: string;
}

interface ApiUser {
  role: string;
  createdAt?: string;
}

const MONTHS_SHOWN = 6;

// The last N calendar months, oldest first, as { key: 'YYYY-M', label: 'Mon YY', end: Date }.
const recentMonths = (count: number) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    };
  });
};

const monthKey = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : `${d.getFullYear()}-${d.getMonth()}`;
};

// Fetch an API list and always return an array (the API wraps lists as { success, data }).
const fetchList = async <T,>(path: string, token: string | null): Promise<T[]> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  if (!response.ok) throw new Error(`Request to ${path} failed (${response.status})`);
  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
};

const buildAnalytics = (
  appointments: ApiAppointment[],
  reports: ApiReport[],
  users: ApiUser[]
): AnalyticsData => {
  const months = recentMonths(MONTHS_SHOWN);

  const appointmentCounts = new Map<string, number>();
  appointments.forEach((apt) => {
    const key = monthKey(apt.date || apt.createdAt);
    if (key) appointmentCounts.set(key, (appointmentCounts.get(key) || 0) + 1);
  });
  const appointmentsByMonth = months.map((m) => ({ month: m.label, count: appointmentCounts.get(m.key) || 0 }));

  const reportCounts = new Map<string, number>();
  reports.forEach((report) => {
    const type = report.reportType || 'Other';
    reportCounts.set(type, (reportCounts.get(type) || 0) + 1);
  });
  const reportsByCategory = Array.from(reportCounts, ([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Running totals: how many patients/doctors existed by the end of each month.
  const userGrowth = months.map((m) => ({
    month: m.label,
    patients: users.filter((u) => u.role === 'patient' && (!u.createdAt || new Date(u.createdAt) < m.end)).length,
    doctors: users.filter((u) => u.role === 'doctor' && (!u.createdAt || new Date(u.createdAt) < m.end)).length,
  }));

  const doctorCounts = new Map<string, { name: string; appointments: number }>();
  appointments.forEach((apt) => {
    if (!apt.doctor?.name) return;
    const id = apt.doctor._id || apt.doctor.name;
    const entry = doctorCounts.get(id) || { name: apt.doctor.name, appointments: 0 };
    entry.appointments += 1;
    doctorCounts.set(id, entry);
  });
  const topDoctors = Array.from(doctorCounts.values())
    .sort((a, b) => b.appointments - a.appointments)
    .slice(0, 5);

  return { appointmentsByMonth, reportsByCategory, userGrowth, topDoctors };
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    appointmentsByMonth: [],
    reportsByCategory: [],
    userGrowth: [],
    topDoctors: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchAnalytics = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const [appointments, reports, users] = await Promise.all([
        fetchList<ApiAppointment>('/appointments', token),
        fetchList<ApiReport>('/reports', token),
        fetchList<ApiUser>('/users', token),
      ]);
      setAnalytics(buildAnalytics(appointments, reports, users));
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
      setError('Could not load analytics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('user');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;

    if (!token || !['admin', 'nurse', 'receptionist'].includes(userData?.role)) {
      router.push('/auth/login?role=admin');
      return;
    }
    fetchAnalytics();
  }, [router, fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const maxAppointments = Math.max(...analytics.appointmentsByMonth.map(m => m.count), 1);
  const maxReports = Math.max(...analytics.reportsByCategory.map(c => c.count), 1);
  const maxUsers = Math.max(...analytics.userGrowth.map(u => Math.max(u.patients, u.doctors)), 1);
  const emptyNote = (text: string) => <p className="text-sm text-gray-500">{text}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">Last {MONTHS_SHOWN} months of hospital activity</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Appointments by Month */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Appointments by Month</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.appointmentsByMonth.map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(item.count / maxAppointments) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports by Category */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Reports by Type</h2>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          {analytics.reportsByCategory.length === 0 ? emptyNote('No reports uploaded yet.') : (
            <div className="space-y-3">
              {analytics.reportsByCategory.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{item.category}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / maxReports) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Registered Users (running total)</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {analytics.userGrowth.map((item) => (
              <div key={item.month} className="text-center">
                <div className="mb-2">
                  <div className="relative h-32 flex items-end justify-center gap-1">
                    <div
                      className="bg-blue-500 w-5 sm:w-6 rounded-t"
                      style={{ height: `${(item.patients / maxUsers) * 100}%` }}
                      title={`${item.patients} patients`}
                    />
                    <div
                      className="bg-green-500 w-5 sm:w-6 rounded-t"
                      style={{ height: `${(item.doctors / maxUsers) * 100}%` }}
                      title={`${item.doctors} doctors`}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600">{item.month}</p>
                <p className="text-xs text-gray-400">{item.patients} / {item.doctors}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Patients</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Doctors</span>
            </div>
          </div>
        </div>

        {/* Top Doctors */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Doctors by Appointments</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          {analytics.topDoctors.length === 0 ? emptyNote('No appointments booked yet.') : (
            <div className="space-y-3">
              {analytics.topDoctors.map((doctor, index) => (
                <div key={`${doctor.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{doctor.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{doctor.appointments} appointments</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
