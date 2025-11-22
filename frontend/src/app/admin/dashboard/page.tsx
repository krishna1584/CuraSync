'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Stethoscope, 
  UserPlus, 
  Trash2, 
  User, 
  LogOut, 
  Calendar, 
  Upload, 
  BarChart3,
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
  role: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialty?: string;
  role: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveAppointmentCount, setLiveAppointmentCount] = useState(0);
  const router = useRouter();
  
  // Initialize WebSocket connection
  const { socket, isConnected, notifications, registerUser, clearNotification } = useSocket();

  useEffect(() => {
    checkAuth();
    fetchUsers();
  }, []);

  // Register user with WebSocket when user data is available
  useEffect(() => {
    if (user && socket && isConnected && !user._socketRegistered) {
      registerUser({
        userId: user._id,
        role: user.role,
        name: user.name
      });
      // Mark as registered to prevent re-registration
      setUser({ ...user, _socketRegistered: true });
    }
  }, [user?._id, socket, isConnected]);

  // Listen for appointment updates to update live counter
  useEffect(() => {
    if (socket) {
      socket.on('appointment_update', (data) => {
        if (data.type === 'appointment_created') {
          setLiveAppointmentCount(prev => prev + 1);
        }
      });

      return () => {
        socket.off('appointment_update');
      };
    }
  }, [socket]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data?.user || result;
        if (userData.role !== 'admin') {
          router.push('/auth/login');
          return;
        }
        setUser(userData);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const users = result.data || result; // Handle both API response formats
        setPatients(users.filter((u: Patient) => u.role === 'patient'));
        setDoctors(users.filter((u: Doctor) => u.role === 'doctor'));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const deleteUser = async (userId: string, userType: 'patient' | 'doctor') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (userType === 'patient') {
          setPatients(patients.filter(p => p._id !== userId));
        } else {
          setDoctors(doctors.filter(d => d._id !== userId));
        }
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Notifications */}
        <NotificationBell notifications={notifications} onClear={clearNotification} />

        <div className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Hospital Admin Dashboard</h1>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Live Updates Active' : 'Offline'}
              </div>
              {liveAppointmentCount > 0 && (
                <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  {liveAppointmentCount} New Appointments
                </div>
              )}
            </div>
            <p className="text-gray-600">Welcome, {user?.name}! Manage patients and doctors in the hospital system.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/book-for-patient" className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 mr-3" />
                <div>
                  <h3 className="font-semibold">Book for Patient</h3>
                  <p className="text-sm text-blue-100">Schedule appointments and tests</p>
                </div>
              </div>
            </Link>
            
            <Link href="/upload-report" className="bg-green-600 text-white rounded-lg p-4 hover:bg-green-700 transition-colors">
              <div className="flex items-center">
                <Upload className="h-6 w-6 mr-3" />
                <div>
                  <h3 className="font-semibold">Upload Report</h3>
                  <p className="text-sm text-green-100">Upload patient reports</p>
                </div>
              </div>
            </Link>
            
            <div className="bg-purple-600 text-white rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 mr-3" />
                <div>
                  <h3 className="font-semibold">View Reports</h3>
                  <p className="text-sm text-purple-100">Analytics and insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                <p className="text-gray-600">Total Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
                <p className="text-gray-600">Total Doctors</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {patients.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No patients registered yet.</p>
              ) : (
                patients.map((patient) => (
                  <div key={patient._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.email} • {patient.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteUser(patient._id, 'patient')}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Delete patient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Doctors</h2>
              <p className="text-sm text-gray-500">Doctors will appear here when they register</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {doctors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No doctors registered yet.</p>
              ) : (
                doctors.map((doctor) => (
                  <div key={doctor._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Stethoscope className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{doctor.name}</p>
                        <p className="text-sm text-gray-600">{doctor.specialty || 'General Medicine'} • {doctor.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteUser(doctor._id, 'doctor')}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Delete doctor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
