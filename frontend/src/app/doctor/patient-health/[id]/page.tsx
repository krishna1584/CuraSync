'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_URL } from '@/lib/config';
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  FileText,
  Activity,
  Pill,
  Mail,
  Phone,
  Droplet,
  Heart,
  AlertCircle,
  Clock
} from 'lucide-react';

interface Patient {
  name: string;
  email: string;
  phone?: string;
  patientId: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

interface Prescription {
  _id: string;
  diagnosis: string;
  symptoms?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  vitalSigns?: {
    bloodPressure?: string;
    temperature?: string;
    pulse?: string;
    weight?: string;
    height?: string;
    oxygenSaturation?: string;
  };
  labTests?: string[];
  followUpDate?: string;
  notes?: string;
  status: string;
  createdAt: string;
  doctorId: {
    name: string;
    specialization?: string;
  };
}

interface Appointment {
  _id: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  notes?: string;
  doctorId: {
    name: string;
    specialization?: string;
  };
}

interface HealthSummary {
  patient: Patient;
  recentPrescriptions: Prescription[];
  recentAppointments: Appointment[];
  statistics: {
    totalPrescriptions: number;
    totalAppointments: number;
    activePrescriptions: number;
  };
}

export default function PatientHealthRecordsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id as string;

  const [healthData, setHealthData] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prescriptions' | 'appointments'>('overview');

  useEffect(() => {
    if (patientId) {
      fetchHealthSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchHealthSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/prescriptions/health-summary/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setHealthData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch health summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      scheduled: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { patient, recentPrescriptions, recentAppointments, statistics } = healthData;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-600 mt-1">Patient ID: {patient.patientId}</p>
            </div>
            <button
              onClick={() => router.push(`/doctor/create-prescription?patientId=${patientId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Pill className="h-5 w-5 mr-2" />
              Create Prescription
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Prescriptions</h3>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalPrescriptions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Prescriptions</h3>
              <Pill className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.activePrescriptions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Appointments</h3>
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalAppointments}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserIcon className="inline h-5 w-5 mr-2" />
                Patient Overview
              </button>
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'prescriptions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Pill className="inline h-5 w-5 mr-2" />
                Prescriptions
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="inline h-5 w-5 mr-2" />
                Appointments
              </button>
            </nav>
          </div>

          {/* Patient Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email
                      </label>
                      <p className="text-gray-900">{patient.email}</p>
                    </div>
                    {patient.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Phone className="inline h-4 w-4 mr-1" />
                          Phone
                        </label>
                        <p className="text-gray-900">{patient.phone}</p>
                      </div>
                    )}
                    {patient.dateOfBirth && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        <p className="text-gray-900">{formatDate(patient.dateOfBirth)}</p>
                      </div>
                    )}
                    {patient.gender && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <p className="text-gray-900 capitalize">{patient.gender}</p>
                      </div>
                    )}
                    {patient.bloodGroup && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Droplet className="inline h-4 w-4 mr-1" />
                          Blood Group
                        </label>
                        <p className="text-gray-900">{patient.bloodGroup}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-600" />
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allergies
                      </label>
                      <p className="text-gray-900">
                        {patient.allergies && patient.allergies.length > 0
                          ? patient.allergies.join(', ')
                          : 'None reported'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chronic Conditions
                      </label>
                      <p className="text-gray-900">
                        {patient.chronicConditions && patient.chronicConditions.length > 0
                          ? patient.chronicConditions.join(', ')
                          : 'None reported'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                {patient.emergencyContact && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {patient.emergencyContact.name && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <p className="text-gray-900">{patient.emergencyContact.name}</p>
                        </div>
                      )}
                      {patient.emergencyContact.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <p className="text-gray-900">{patient.emergencyContact.phone}</p>
                        </div>
                      )}
                      {patient.emergencyContact.relationship && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Relationship
                          </label>
                          <p className="text-gray-900">{patient.emergencyContact.relationship}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="p-6">
              {recentPrescriptions.length > 0 ? (
                <div className="space-y-4">
                  {recentPrescriptions.map((prescription) => (
                    <div key={prescription._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {prescription.diagnosis}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Dr. {prescription.doctorId.name}
                            {prescription.doctorId.specialization &&
                              ` - ${prescription.doctorId.specialization}`}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(prescription.createdAt)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                          {prescription.status}
                        </span>
                      </div>
                      
                      {prescription.symptoms && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                          <p className="text-sm text-gray-600">{prescription.symptoms}</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Medications:</p>
                        <div className="space-y-2">
                          {prescription.medications.map((med, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded">
                              <p className="text-sm font-medium text-gray-900">{med.name}</p>
                              <p className="text-xs text-gray-600">
                                {med.dosage} - {med.frequency} for {med.duration}
                              </p>
                              {med.instructions && (
                                <p className="text-xs text-gray-500 italic">{med.instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {prescription.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Notes:</p>
                          <p className="text-sm text-gray-600">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No prescriptions found</p>
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="p-6">
              {recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {recentAppointments.map((appointment) => (
                    <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {appointment.reason}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Dr. {appointment.doctorId.name}
                            {appointment.doctorId.specialization &&
                              ` - ${appointment.doctorId.specialization}`}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(appointment.date)} at {appointment.time}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No appointments found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
