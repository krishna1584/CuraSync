'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User as UserType } from '../../../types';
import { API_URL } from '@/lib/config';
import { 
  Users, 
  ClipboardList, 
  User,
  Calendar,
  LogOut,
  Phone,
  Mail,
  Heart,
  Wifi,
  WifiOff,
  Bell
} from 'lucide-react';
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
  patientId?: string;
}

interface Appointment {
  _id: string;
  patient: {
    name: string;
    email: string;
    patientId?: string;
  };
  date: string;
  time: string;
  reason: string;
  status: string;
  type: string;
}

export default function DoctorDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const router = useRouter();
  const socketRegistered = useRef(false);

  // Initialize WebSocket connection
  const { socket, isConnected, notifications, registerUser, clearNotification } = useSocket();

  useEffect(() => {
    checkAuth();
    fetchPatients();
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register user with WebSocket when user data is available
  useEffect(() => {
    if (user && socket && isConnected && !socketRegistered.current) {
      registerUser({
        userId: user._id,
        role: user.role,
        name: user.name
      });
      socketRegistered.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, socket, isConnected]);

  // Listen for new appointments to refresh the list
  useEffect(() => {
    if (socket) {
      socket.on('appointment_notification', (data) => {
        if (data.type === 'new_appointment') {
          // Refresh appointments when new appointment is received
          fetchAppointments();
        }
      });

      return () => {
        socket.off('appointment_notification');
      };
    }
  }, [socket]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Auth verify result:', result);
        const userData = result.data?.user || result.user || result;
        console.log('User data:', userData);
        
        if (!userData || !userData.role) {
          console.log('Invalid user data structure');
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }
        
        if (userData.role !== 'doctor') {
          console.log('User is not a doctor, role:', userData.role);
          router.push('/auth/login');
          return;
        }
        
        setUser(userData);
      } else {
        console.log('Auth verify failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.log('Error data:', errorData);
        localStorage.removeItem('token');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const users = result.data || result;
        const patientsList = users.filter((user: UserType) => user.role === 'patient');
        setPatients(patientsList);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setPatientsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/appointments/my-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const appointmentsData = result.data || result;
        console.log('Doctor appointments:', appointmentsData);
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Notifications */}
        <NotificationBell notifications={notifications} onClear={clearNotification} />

        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Live Notifications' : 'Offline'}
              </div>
              {notifications.length > 0 && (
                <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  {notifications.length} New
                </div>
              )}
            </div>
            <p className="text-gray-600">Welcome, Dr. {user?.name}! Manage your patients and medical practice.</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* See Patients */}
          <Link href="/doctor/patients" className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">See Patients</h3>
            <p className="text-gray-600 text-sm">View patient records and medical history</p>
          </Link>

          {/* Add Prescription */}
          <Link href="/doctor/prescriptions" className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Prescription</h3>
            <p className="text-gray-600 text-sm">Create and manage patient prescriptions</p>
          </Link>

          {/* Profile & Settings */}
          <Link href="/doctor/profile" className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile & Settings</h3>
            <p className="text-gray-600 text-sm">Manage your profile and preferences</p>
          </Link>
        </div>

        {/* Today&apos;s Schedule */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Today&apos;s Appointments</h2>
          {appointmentsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading appointments...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((appointment) => {
                const patientName = appointment.patient?.name || 'Unknown Patient';
                const appointmentTime = appointment.time || 'N/A';
                return (
                <div key={appointment._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded gap-2 sm:gap-0">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <span className="font-medium text-gray-900">{patientName}</span>
                      <span className="text-gray-600 ml-2">- {appointmentTime}</span>
                      <p className="text-sm text-gray-500">{appointment.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No appointments scheduled for today</p>
            </div>
          )}
        </div>

        {/* My Patients */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">My Patients</h2>
          {patientsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading patients...</p>
            </div>
          ) : patients.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {patients.map((patient) => (
                <div key={patient._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {patient.email}
                        </div>
                        {patient.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {patient.phone}
                          </div>
                        )}
                        {patient.patientId && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Heart className="h-4 w-4 mr-2" />
                            ID: {patient.patientId}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                        View Records
                      </button>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No patients registered yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}