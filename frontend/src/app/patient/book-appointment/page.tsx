'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User as UserType } from '../../../types';
import { API_URL } from '@/lib/config';
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  ArrowLeft,
  CheckCircle,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSocket } from '@/contexts/SocketContext';
import { removeAuthToken } from '@/lib/auth';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  doctorId?: string;
  consultationFee?: number;
  availability?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

// "YYYY-MM-DD" for the given moment in the browser's own time zone.
const toLocalDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function BookAppointmentPage() {
  const router = useRouter();
  const { socket, isConnected, registerUser } = useSocket();
  const [user, setUser] = useState<UserType | null>(null);
  const socketRegistered = useRef(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');

  // Load the doctor's real free/booked slots whenever doctor or date changes.
  useEffect(() => {
    setSelectedTime('');
    if (!selectedDoctor || !selectedDate) {
      setTimeSlots([]);
      setSlotsMessage('');
      return;
    }

    let cancelled = false;
    const loadSlots = async () => {
      setSlotsLoading(true);
      setSlotsMessage('');
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({ doctorId: selectedDoctor._id, date: selectedDate });
        const response = await fetch(`${API_URL}/appointments/available-slots?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok || !result.success) {
          setTimeSlots([]);
          setSlotsMessage(result.message || 'Could not load available times');
          return;
        }
        const now = new Date();
        const isToday = selectedDate === toLocalDateString(now);
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const slots: TimeSlot[] = (result.data.slots as TimeSlot[]).map((slot) => ({
          time: slot.time,
          // Times that have already passed today cannot be booked.
          available: slot.available && (!isToday || slot.time > currentTime)
        }));
        setTimeSlots(slots);
        if (result.data.reason) setSlotsMessage(result.data.reason);
        else if (slots.length > 0 && slots.every((slot) => !slot.available)) {
          setSlotsMessage('All times are taken on this day. Please choose another date.');
        }
      } catch {
        if (!cancelled) {
          setTimeSlots([]);
          setSlotsMessage('Could not load available times');
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    checkAuth();
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

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
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
        const userData = result.data?.user || result.user || result;
        
        if (!userData || !userData.role) {
          removeAuthToken();
          router.push('/auth/login');
          return;
        }
        
        if (userData.role !== 'patient') {
          router.push('/auth/login');
          return;
        }
        
        setUser(userData);
        fetchDoctors();
      } else if (response.status === 401) {
        removeAuthToken();
        router.push('/auth/login');
      } else {
        toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/users/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const users = result.data || result;
        const doctorsList = users.filter((user: UserType) => user.role === 'doctor');
        setDoctors(doctorsList);
      }
    } catch (_error) {
      console.error('Failed to fetch doctors:', _error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setBooking(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          patientId: user._id,
          doctorId: selectedDoctor._id,
          appointmentDate: selectedDate,
          timeSlot: selectedTime,
          reason: reason.trim(),
          type: appointmentType
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Appointment booked successfully!');
        // Wait a moment to show notification before redirecting
        setTimeout(() => {
          router.push('/patient/appointments');
        }, 1500);
      } else {
        toast.error(data.message || 'Failed to book appointment');
        if (response.status === 409) {
          // Someone else took the slot: reload the times for this day.
          const current = selectedDate;
          setSelectedDate('');
          setTimeout(() => setSelectedDate(current), 0);
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setBooking(false);
    }
  };

  const getMinDate = () => toLocalDateString(new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/patient/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Book Appointment</h1>
          <p className="text-gray-600 mt-2">Schedule an appointment with our medical professionals</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Doctor Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Doctor</h2>
            
            {doctors.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedDoctor?._id === doctor._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                        {doctor.specialization && (
                          <p className="text-sm text-blue-600 mt-1">{doctor.specialization}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {doctor.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-2" />
                            <span className="min-w-0 break-all">{doctor.email}</span>
                          </div>
                          )}
                          {doctor.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-2" />
                              {doctor.phone}
                            </div>
                          )}
                          {doctor.doctorId && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Stethoscope className="h-3 w-3 mr-2" />
                              ID: {doctor.doctorId}
                            </div>
                          )}
                        </div>
                        {doctor.consultationFee && (
                          <div className="mt-2 text-sm font-medium text-green-600">
                            Consultation Fee: ₹{doctor.consultationFee}
                          </div>
                        )}
                      </div>
                      {selectedDoctor?._id === doctor._id && (
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No doctors available</p>
              </div>
            )}
          </div>

          {/* Appointment Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>
            
            <div className="space-y-6">
              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type
                </label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Select Time
                </label>
                {!selectedDoctor || !selectedDate ? (
                  <p className="text-sm text-gray-500">Choose a doctor and date to see available times.</p>
                ) : slotsLoading ? (
                  <p className="text-sm text-gray-500">Loading available times…</p>
                ) : (
                  <>
                    {slotsMessage && <p className="text-sm text-amber-700 mb-2">{slotsMessage}</p>}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          aria-pressed={selectedTime === slot.time}
                          title={slot.available ? undefined : 'Not available'}
                          className={`p-2 text-sm rounded-lg border transition-colors ${
                            selectedTime === slot.time
                              ? 'bg-blue-600 text-white border-blue-600'
                              : slot.available
                              ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50 line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe your symptoms or reason for the appointment..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Summary */}
              {selectedDoctor && selectedDate && selectedTime && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Appointment Summary</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
                    <p><strong>Date:</strong> {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {selectedTime}</p>
                    <p><strong>Type:</strong> {appointmentType}</p>
                    {selectedDoctor.consultationFee && (
                      <p><strong>Fee:</strong> ₹{selectedDoctor.consultationFee}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBookAppointment}
                disabled={!selectedDoctor || !selectedDate || !selectedTime || !reason.trim() || booking}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {booking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : (
                  'Book Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}