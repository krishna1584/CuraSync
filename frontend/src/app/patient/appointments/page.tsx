'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User as UserType } from '../../../types';
import { API_URL } from '@/lib/config';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  ArrowLeft,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { NotificationBell } from '@/components/NotificationBell';

interface Appointment {
  _id: string;
  doctor: {
    name: string;
    email: string;
    specialization?: string;
    doctorId?: string;
  };
  date: string;
  time: string;
  reason: string;
  status: string;
  type: string;
  createdAt: string;
}

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { socket, isConnected, notifications, registerUser, clearNotification } = useSocket();
  const [user, setUser] = useState<UserType | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const socketRegistered = useRef(false);

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register user with socket when authenticated (only once per user)
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

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Verify user first
      const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (verifyResponse.ok) {
        const result = await verifyResponse.json();
        const userData = result.data?.user || result.user || result;
        setUser(userData);
      }

      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Handle both array and object responses
        const appointmentsData = result.data || result.appointments || result;
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      } else {
        console.error('Failed to fetch appointments:', response.statusText);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = (appointments || []).filter(appointment => {
    if (statusFilter === 'all') return true;
    return appointment.status === statusFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NotificationBell notifications={notifications} onClear={clearNotification} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/patient/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600 mt-2">View and manage your medical appointments</p>
            </div>
            <Link 
              href="/patient/book-appointment"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book New Appointment
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Appointments</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Stethoscope className="h-5 w-5 text-blue-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">{appointment.doctor?.name || 'Unknown Doctor'}</h3>
                      <span className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    {appointment.doctor?.specialization && (
                      <p className="text-blue-600 text-sm mb-2">{appointment.doctor.specialization}</p>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(appointment.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{appointment.time}</span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Type: </span>
                      <span className="text-sm text-gray-600 capitalize">{appointment.type}</span>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Reason: </span>
                      <span className="text-sm text-gray-600">{appointment.reason}</span>
                    </div>

                    {appointment.doctor?.doctorId && (
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        Doctor ID: {appointment.doctor.doctorId}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getStatusIcon(appointment.status)}
                    <span className="text-xs text-gray-500">
                      Booked on {new Date(appointment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No Appointments Found' : `No ${statusFilter} Appointments`}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all' 
                ? "You haven't booked any appointments yet. Start by booking your first appointment."
                : `You don't have any ${statusFilter} appointments.`
              }
            </p>
            <Link 
              href="/patient/book-appointment"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book Your First Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
