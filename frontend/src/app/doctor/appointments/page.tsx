'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';
import { 
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
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

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
    patientId?: string;
  };
  doctor: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  time: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export default function DoctorAppointments() {
  const [user, setUser] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const socketRegistered = useRef(false);

  // Initialize WebSocket connection
  const { socket, isConnected, notifications, registerUser, clearNotification } = useSocket();

  useEffect(() => {
    checkAuth();
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
        console.log('Received appointment notification:', data);
        // Refresh appointments when new appointment is received
        fetchAppointments();
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
        console.log('Fetched appointments:', appointmentsData);
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh appointments list
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    return today.toDateString() === appointmentDate.toDateString();
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    return appointmentDate > today && !isToday(dateString);
  };

  const isPast = (dateString: string) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    return appointmentDate < today && !isToday(dateString);
  };

  // Check if appointment is expired (past date and still scheduled)
  const isExpired = (appointment: Appointment) => {
    return isPast(appointment.date) && appointment.status === 'scheduled';
  };

  // Get effective status - show as expired if past date and not marked
  const getEffectiveStatus = (appointment: Appointment): string => {
    if (isExpired(appointment)) {
      return 'expired';
    }
    return appointment.status;
  };

  const todayAppointments = appointments.filter(apt => isToday(apt.date) && apt.status === 'scheduled');
  const upcomingAppointments = appointments.filter(apt => isUpcoming(apt.date) && apt.status === 'scheduled');
  const pastAppointments = appointments.filter(apt => isPast(apt.date));

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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Appointments</h1>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Live Updates' : 'Offline'}
              </div>
              {notifications.length > 0 && (
                <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  {notifications.length} New
                </div>
              )}
            </div>
            <p className="text-gray-600">Manage your patient appointments and schedule</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Today&apos;s Appointments</h3>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{todayAppointments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Upcoming</h3>
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{appointments.filter(a => a.status === 'completed').length}</p>
          </div>
        </div>

        {/* Today's Appointments Section */}
        {todayAppointments.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Today&apos;s Appointments</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {todayAppointments.map((appointment) => (
                <div key={appointment._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.patient?.name || 'Unknown Patient'}
                          </h3>
                          <p className="text-sm text-gray-600">{appointment.time}</p>
                        </div>
                      </div>
                      <div className="ml-13">
                        <p className="text-sm text-gray-700 mb-2">{appointment.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Mark Visited
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Appointments Section */}
        {upcomingAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.patient?.name || 'Unknown Patient'}
                          </h3>
                          <p className="text-sm text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
                        </div>
                      </div>
                      <div className="ml-13">
                        <p className="text-sm text-gray-700">{appointment.reason}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Appointments Section */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Appointments</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {pastAppointments.map((appointment) => {
                const patientName = appointment.patient?.name || 'Unknown Patient';
                const effectiveStatus = getEffectiveStatus(appointment);
                
                return (
                  <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            effectiveStatus === 'expired' ? 'bg-orange-100' : 'bg-gray-100'
                          }`}>
                            <User className={`h-5 w-5 ${
                              effectiveStatus === 'expired' ? 'text-orange-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{patientName}</h3>
                            <p className="text-sm text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
                          </div>
                        </div>
                        <div className="ml-13">
                          <p className="text-sm text-gray-700">{appointment.reason}</p>
                          {effectiveStatus === 'expired' && (
                            <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ Not marked - Auto-expired</p>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(effectiveStatus)}`}>
                        {getStatusIcon(effectiveStatus)}
                        <span className="text-sm font-medium capitalize">{effectiveStatus}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todayAppointments.length === 0 && upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">You don&apos;t have any appointments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
