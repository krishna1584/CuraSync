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
  WifiOff,
  User as UserIcon,
  Settings,
  Pill
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

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
  };
  doctor: {
    _id: string;
    name: string;
    specialization?: string;
  };
  date: string;
  time: string;
  reason: string;
  status: string;
  type: string;
}

interface Prescription {
  _id: string;
  doctorId: {
    _id: string;
    name: string;
    specialization?: string;
  };
  diagnosis: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  createdAt: string;
  status: string;
}

export default function PatientDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(true);
  const router = useRouter();
  const socketRegistered = useRef(false);
  
  // Initialize WebSocket connection
  const { socket, isConnected, notifications, registerUser, clearNotification } = useSocket();

  useEffect(() => {
    checkAuth();
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchPrescriptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  // Listen for prescription notifications and auto-refresh
  useEffect(() => {
    if (socket && isConnected) {
      const handlePrescriptionNotification = () => {
        console.log('📨 Prescription notification received, refreshing prescriptions...');
        fetchPrescriptions();
      };

      socket.on('prescription_notification', handlePrescriptionNotification);

      return () => {
        socket.off('prescription_notification', handlePrescriptionNotification);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, user]);

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

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      const response = await fetch(`${API_URL}/appointments/patient/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const appointmentsData = result.data || result;
        console.log('Patient appointments:', appointmentsData);
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      const response = await fetch(`${API_URL}/prescriptions/patient/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const prescriptionsData = result.data || result;
        console.log('Patient prescriptions:', prescriptionsData);
        setPrescriptions(prescriptionsData);
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'no-show':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient Dashboard</h1>
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
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

          {/* My Profile */}
          <Link href="/patient/profile" className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <UserIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
            <p className="text-gray-600 text-sm">View and edit your personal information</p>
          </Link>

          {/* Settings */}
          <Link href="/patient/settings" className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600 text-sm">Manage account and preferences</p>
          </Link>
        </div>

        {/* My Appointments */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">My Appointments</h2>
          {appointmentsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading appointments...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">Dr. {appointment.doctor?.name || 'Unknown'}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      {appointment.doctor?.specialization && (
                        <p className="text-sm text-blue-600 mb-2">{appointment.doctor.specialization}</p>
                      )}
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(appointment.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="ml-6">Time: {appointment.time}</p>
                        <p className="ml-6">Reason: {appointment.reason}</p>
                        {appointment.type && <p className="ml-6">Type: {appointment.type}</p>}
                      </div>
                    </div>
                    <Link
                      href="/patient/appointments"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No appointments scheduled yet</p>
              <Link
                href="/patient/book-appointment"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Book your first appointment
              </Link>
            </div>
          )}
        </div>

        {/* My Prescriptions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Prescriptions</h2>
            <Link href="/patient/prescriptions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          {prescriptionsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading prescriptions...</p>
            </div>
          ) : prescriptions.length > 0 ? (
            <div className="space-y-4">
              {prescriptions.slice(0, 3).map((prescription) => (
                <div key={prescription._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">
                          Dr. {prescription.doctorId?.name || 'Unknown'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          prescription.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {prescription.status}
                        </span>
                      </div>
                      {prescription.doctorId?.specialization && (
                        <p className="text-sm text-blue-600 mb-2">{prescription.doctorId.specialization}</p>
                      )}
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-medium text-gray-900">Diagnosis: {prescription.diagnosis}</p>
                        <p className="mt-2 font-medium">Medications:</p>
                        <ul className="ml-4 space-y-1">
                          {prescription.medications.slice(0, 2).map((med, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{med.name} - {med.dosage} ({med.frequency})</span>
                            </li>
                          ))}
                          {prescription.medications.length > 2 && (
                            <li className="text-blue-600 ml-4">+{prescription.medications.length - 2} more</li>
                          )}
                        </ul>
                        <p className="mt-2 text-xs text-gray-500">
                          Prescribed on {new Date(prescription.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No prescriptions yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Your prescriptions will appear here after doctor consultations
              </p>
            </div>
          )}
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