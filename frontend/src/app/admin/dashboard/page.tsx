'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Trash2,
  X
} from 'lucide-react';
import { API_URL } from '@/lib/config';
import { useSocket } from '../../../contexts/SocketContext';
import { NotificationBell } from '../../../components/NotificationBell';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialty?: string;
  role: string;
}

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalReports: number;
  todayAppointments: number;
  pendingReports: number;
}

interface RecentActivity {
  _id: string;
  type: string;
  message: string;
  time: string;
  status: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalReports: 0,
    todayAppointments: 0,
    pendingReports: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'patient' });
  const router = useRouter();
  
  const { socket, registerUser, notifications, clearNotification } = useSocket();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token || userRole !== 'admin') {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        fetchDashboardData();
      } else {
        localStorage.clear();
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user && socket && typeof registerUser === 'function') {
      // Socket registration logic if needed
      // registerUser can be called here when implementing socket registration
    }
  }, [user, socket, registerUser]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    try {
      // Fetch users
      const usersResponse = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const usersData: Array<{ _id: string; name: string; email: string; role: string; phone?: string; specialty?: string }> = await usersResponse.json();
      
      const patientsList = usersData.filter((u) => u.role === 'patient');
      const doctorsList = usersData.filter((u) => u.role === 'doctor');
      
      setPatients(patientsList);
      setDoctors(doctorsList);

      // Fetch appointments
      const appointmentsResponse = await fetch(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const appointmentsData: Array<{ _id: string; date?: string; createdAt?: string }> = await appointmentsResponse.json();

      // Fetch reports
      const reportsResponse = await fetch(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const reportsData: Array<{ aiProcessed: boolean; _id: string; uploadDate: string; category?: string }> = await reportsResponse.json();

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointmentsData.filter((apt) => 
        apt.date?.split('T')[0] === today
      ).length;
      
      const pendingReports = reportsData.filter((rep) => 
        rep.aiProcessed === false
      ).length;

      setStats({
        totalPatients: patientsList.length,
        totalDoctors: doctorsList.length,
        totalAppointments: appointmentsData.length,
        totalReports: reportsData.length,
        todayAppointments,
        pendingReports,
      });

      // Generate recent activities
      const activities: RecentActivity[] = [
        ...appointmentsData.slice(0, 3).map((apt) => ({
          _id: apt._id,
          type: 'appointment',
          message: `New appointment scheduled`,
          time: new Date(apt.createdAt || Date.now()).toLocaleTimeString(),
          status: 'info'
        })),
        ...reportsData.slice(0, 2).map((rep) => ({
          _id: rep._id,
          type: 'report',
          message: `Report uploaded: ${rep.category || 'Medical'}`,
          time: new Date(rep.uploadDate || Date.now()).toLocaleTimeString(),
          status: rep.aiProcessed ? 'success' : 'pending'
        }))
      ].slice(0, 5);
      
      setRecentActivities(activities);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, role: string) => {
    if (!confirm(`Are you sure you want to delete this ${role}?`)) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAddUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setShowAddUserModal(false);
        setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'patient' });
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      icon: Stethoscope,
      color: 'bg-green-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'bg-purple-500',
      trend: `${stats.todayAppointments} today`,
      trendUp: stats.todayAppointments > 0,
    },
    {
      title: 'Reports Uploaded',
      value: stats.totalReports,
      icon: FileText,
      color: 'bg-orange-500',
      trend: `${stats.pendingReports} pending`,
      trendUp: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Hospital Management System</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 items-center gap-4">
              <NotificationBell notifications={notifications} onClear={clearNotification} />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;
            return (
              <div key={stat.title} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendIcon className={`h-4 w-4 ${stat.trendUp ? 'text-green-500' : 'text-gray-500'}`} />
                      <span className={`ml-1 ${stat.trendUp ? 'text-green-600' : 'text-gray-600'}`}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div className={`${stat.color} rounded-full p-3`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity._id} className="flex items-start gap-3">
                    <div className={`mt-1 ${
                      activity.status === 'success' ? 'bg-green-100' :
                      activity.status === 'pending' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    } rounded-full p-2`}>
                      {activity.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : activity.status === 'pending' ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

          {/* Patients List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Patients ({stats.totalPatients})</h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {patients.slice(0, 5).map((patient) => (
                    <tr key={patient._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleDeleteUser(patient._id, 'patient')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {patients.length > 5 && (
                <div className="mt-4 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View all {patients.length} patients
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Doctors List */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctors ({stats.totalDoctors})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.slice(0, 5).map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.specialty || 'General'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDeleteUser(doctor._id, 'doctor')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {doctors.length > 5 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View all {doctors.length} doctors
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddUserModal(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
