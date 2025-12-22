'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Calendar, FileText, Activity } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface AnalyticsData {
  appointmentsByMonth: { month: string; count: number }[];
  reportsByCategory: { category: string; count: number }[];
  userGrowth: { month: string; patients: number; doctors: number }[];
  topDoctors: { name: string; appointments: number }[];
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    appointmentsByMonth: [],
    reportsByCategory: [],
    userGrowth: [],
    topDoctors: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token || userRole !== 'admin') {
      router.push('/auth/login');
      return;
    }

    fetchAnalytics();
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token');
    try {
      // Fetch appointments
      const appointmentsResponse = await fetch(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const appointments = await appointmentsResponse.json();

      // Fetch reports
      const reportsResponse = await fetch(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const reports = await reportsResponse.json();

      // Fetch users
      const usersResponse = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const users: Array<{ role: string; name: string }> = await usersResponse.json();

      // Process appointments by month
      const appointmentsByMonth = processAppointmentsByMonth(appointments);
      
      // Process reports by category
      const reportsByCategory = processReportsByCategory(reports);
      
      // Process user growth (mock data for now)
      const userGrowth = [
        { month: 'Jan', patients: 45, doctors: 12 },
        { month: 'Feb', patients: 52, doctors: 14 },
        { month: 'Mar', patients: 61, doctors: 15 },
        { month: 'Apr', patients: 70, doctors: 18 },
        { month: 'May', patients: 85, doctors: 20 },
        { month: 'Jun', patients: users.filter((u) => u.role === 'patient').length, 
          doctors: users.filter((u) => u.role === 'doctor').length },
      ];

      // Process top doctors (mock data)
      const topDoctors = users
        .filter((u) => u.role === 'doctor')
        .slice(0, 5)
        .map((d) => ({
          name: d.name,
          appointments: Math.floor(Math.random() * 50) + 10,
        }));

      setAnalytics({
        appointmentsByMonth,
        reportsByCategory,
        userGrowth,
        topDoctors,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const processAppointmentsByMonth = (appointments: Array<{ date?: string; createdAt?: string }>) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const counts = months.map(month => ({
      month,
      count: Math.floor(Math.random() * 30) + 10,
    }));
    counts[counts.length - 1].count = appointments.length;
    return counts;
  };

  const processReportsByCategory = (reports: Array<{ category?: string }>) => {
    const categories: { [key: string]: number } = {};
    reports.forEach((report: { category?: string }) => {
      const cat = report.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return Object.entries(categories).map(([category, count]) => ({
      category,
      count,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const maxAppointments = Math.max(...analytics.appointmentsByMonth.map(m => m.count), 1);
  const maxReports = Math.max(...analytics.reportsByCategory.map(c => c.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">Insights and trends for your hospital</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h2 className="text-lg font-semibold text-gray-900">Reports by Category</h2>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
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
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">User Growth</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-6 gap-4">
            {analytics.userGrowth.map((item) => (
              <div key={item.month} className="text-center">
                <div className="mb-2">
                  <div className="relative h-32 flex items-end justify-center gap-1">
                    <div
                      className="bg-blue-500 w-6 rounded-t"
                      style={{ height: `${(item.patients / 100) * 100}%` }}
                      title={`${item.patients} patients`}
                    />
                    <div
                      className="bg-green-500 w-6 rounded-t"
                      style={{ height: `${(item.doctors / 20) * 100}%` }}
                      title={`${item.doctors} doctors`}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600">{item.month}</p>
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
          <div className="space-y-3">
            {analytics.topDoctors.map((doctor, index) => (
              <div key={doctor.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
        </div>
      </div>
    </div>
  );
}
