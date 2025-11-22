'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Search,
  User,
  Plus,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  patientId?: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  doctorId?: string;
  consultationFee?: number;
}

export default function AdminBookingPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointment' | 'labtest'>('appointment');

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  useEffect(() => {
    fetchPatientsAndDoctors();
  }, []);

  const fetchPatientsAndDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const [patientsResponse, doctorsResponse] = await Promise.all([
        fetch('/api/users/patients', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/users/doctors', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (patientsResponse.ok && doctorsResponse.ok) {
        const patientsResult = await patientsResponse.json();
        const doctorsResult = await doctorsResponse.json();
        setPatients(patientsResult.data || patientsResult);
        setDoctors(doctorsResult.data || doctorsResult);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setBooking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          doctorId: selectedDoctor._id,
          appointmentDate: selectedDate,
          timeSlot: selectedTime,
          reason: reason.trim(),
          type: appointmentType
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Appointment booked successfully!');
        // Reset form
        setSelectedPatient(null);
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedTime('');
        setReason('');
        setAppointmentType('consultation');
      } else {
        toast.error(data.message || 'Failed to book appointment');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.email.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (patient.patientId && patient.patientId.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.email.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    (doctor.specialization && doctor.specialization.toLowerCase().includes(doctorSearch.toLowerCase()))
  );

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Booking Portal</h1>
          <p className="text-gray-600 mt-2">Book appointments and lab tests for patients</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('appointment')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'appointment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Book Appointment
              </button>
              <button
                onClick={() => setActiveTab('labtest')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'labtest'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Book Lab Test
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'appointment' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patient Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Patient</h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search patients..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPatient?._id === patient._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {patient.email}
                      </div>
                      {patient.phone && (
                        <div className="flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {patient.phone}
                        </div>
                      )}
                      {patient.patientId && (
                        <div className="flex items-center mt-1">
                          <User className="h-3 w-3 mr-1" />
                          ID: {patient.patientId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Doctor</h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Search doctors..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedDoctor?._id === doctor._id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                    {doctor.specialization && (
                      <p className="text-sm text-green-600">{doctor.specialization}</p>
                    )}
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {doctor.email}
                      </div>
                      {doctor.phone && (
                        <div className="flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {doctor.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>
              
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Time
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for appointment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Summary */}
                {selectedPatient && selectedDoctor && selectedDate && selectedTime && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Patient:</strong> {selectedPatient.name}</p>
                      <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
                      <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {selectedTime}</p>
                      <p><strong>Type:</strong> {appointmentType}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime || !reason.trim() || booking}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {booking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'labtest' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lab Test Booking</h2>
            <p className="text-gray-600">Lab test booking functionality will be implemented here.</p>
            <Link 
              href="/patient/book-lab-test"
              className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Use Patient Lab Test Booking
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}