'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar,
  Clock,
  User,
  FileText,
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
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const router = useRouter();

  // Initialize WebSocket connection
  const { socket, isConnected, notifications, registerUser, clearNotification } = useSocket();

  useEffect(() => {
    checkAuth();
    fetchAppointments();
  }, []);

  // Register user with WebSocket when user data is available
  useEffect(() => {
    if (user && socket && isConnected && !user._socketRegistered) {
      registerUser({
        userId: user._id,
        role: user.role,
        name: user.name
      });
      // Mark as registered (note: we can't setUser here as it's read-only in this component)
    }
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

      const response = await fetch('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

      const response = await fetch('http://localhost:5000/api/appointments/my-appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    filter === 'all' ? true : apt.status === filter
  );

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

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
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
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'scheduled' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Scheduled ({appointments.filter(a => a.status === 'scheduled').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completed ({appointments.filter(a => a.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'cancelled' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancelled ({appointments.filter(a => a.status === 'cancelled').length})
          </button>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow">
          {filteredAppointments.length > 0 ? (
            <div className="divide-y">
              {filteredAppointments.map((appointment) => {
                // Safety check for patient data
                const patientName = appointment.patient?.name || 'Unknown Patient';
                const patientEmail = appointment.patient?.email || 'No email';
                const patientId = appointment.patient?.patientId || '';
                
                return (
                  <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Patient Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {patientName}
                            </h3>
                            <p className="text-sm text-gray-600">{patientEmail}</p>
                            {patientId && (
                              <p className="text-xs text-gray-500">ID: {patientId}</p>
                            )}
                          </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="grid grid-cols-2 gap-4 ml-13">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{formatDate(appointment.date)}</span>
                          </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{appointment.time}</span>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="mt-3 ml-13">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Reason for visit:</p>
                            <p className="text-sm text-gray-600">{appointment.reason}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="text-sm font-medium capitalize">{appointment.status}</span>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'You don\'t have any appointments yet.'
                  : `No ${filter} appointments found.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
