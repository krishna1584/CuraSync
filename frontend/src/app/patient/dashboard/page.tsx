'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '../../../types';
import { API_URL } from '@/lib/config';
import { 
  Calendar, 
  Upload, 
  TestTube,
  LogOut,
  Stethoscope,
  Phone,
  Mail,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useSocket } from '../../../contexts/SocketContext';
import { NotificationBell } from '../../../components/NotificationBell';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  doctorId?: string;
}

export default function PatientDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const router = useRouter();
  const socketRegistered = useRef(false);
  
  // Initialize WebSocket connection
  const { socket, isConnected, notifications, registerUser, clearNotification } = useSocket();

  useEffect(() => {
    checkAuth();
    fetchDoctors();
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
        
        if (userData.role !== 'patient') {
          console.log('User is not a patient, role:', userData.role);
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

  const fetchDoctors = async () => {
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
        const doctorsList = users.filter((user: User) => user.role === 'doctor');
        setDoctors(doctorsList);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setDoctorsLoading(false);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Notifications */}
        <NotificationBell notifications={notifications} onClear={clearNotification} />

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <p className="text-gray-600">Welcome back, {user?.name}! Manage your healthcare needs.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Book Doctor */}
          <Link href="/patient/book-appointment" className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Doctor</h3>
            <p className="text-gray-600 text-sm">Schedule an appointment with a doctor</p>
          </Link>

          {/* Book Test */}
          <Link href="/patient/book-lab-test" className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TestTube className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Test</h3>
            <p className="text-gray-600 text-sm">Schedule lab tests and medical screenings</p>
          </Link>

          {/* Upload Report */}
          <Link href="/upload-report" className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Report</h3>
            <p className="text-gray-600 text-sm">Upload medical reports and documents</p>
          </Link>
        </div>

        {/* Available Doctors */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Doctors</h2>
          {doctorsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading doctors...</p>
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                      {doctor.specialization && (
                        <p className="text-sm text-blue-600 mb-2">{doctor.specialization}</p>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {doctor.email}
                        </div>
                        {doctor.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {doctor.phone}
                          </div>
                        )}
                        {doctor.doctorId && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Stethoscope className="h-4 w-4 mr-2" />
                            ID: {doctor.doctorId}
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href = '/patient/book-appointment'}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No doctors available at the moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}