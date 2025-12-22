'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';
import { ArrowLeft, Pill, Calendar, User as UserIcon, FileText, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Prescription {
  _id: string;
  doctorId: {
    _id: string;
    name: string;
    specialization?: string;
    email: string;
  };
  diagnosis: string;
  symptoms?: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
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
  updatedAt: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function PatientPrescriptions() {
  const [user, setUser] = useState<UserData | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
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
        
        if (userData.role !== 'patient') {
          router.push('/auth/login');
          return;
        }
        
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

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
        setPrescriptions(prescriptionsData);
      } else {
        toast.error('Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/patient/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
                <p className="text-sm text-gray-600 mt-1">View all your medical prescriptions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Yet</h3>
            <p className="text-gray-600">Your prescriptions will appear here after doctor consultations</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Prescriptions List */}
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription._id}
                  onClick={() => setSelectedPrescription(prescription)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPrescription?._id === prescription._id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Dr. {prescription.doctorId?.name || 'Unknown'}
                        </h3>
                        {prescription.doctorId?.specialization && (
                          <p className="text-sm text-blue-600">{prescription.doctorId.specialization}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">Diagnosis:</span>
                        <p className="text-gray-600">{prescription.diagnosis}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <Pill className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">Medications:</span>
                        <p className="text-gray-600">{prescription.medications.length} prescribed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-3 pt-3 border-t">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(prescription.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prescription Details */}
            <div className="lg:sticky lg:top-4 h-fit">
              {selectedPrescription ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Prescription Details</h2>

                  {/* Doctor Info */}
                  <div className="mb-6 pb-6 border-b">
                    <div className="flex items-center gap-3 mb-3">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Dr. {selectedPrescription.doctorId?.name}
                        </h3>
                        {selectedPrescription.doctorId?.specialization && (
                          <p className="text-sm text-blue-600">{selectedPrescription.doctorId.specialization}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">{selectedPrescription.doctorId?.email}</p>
                  </div>

                  {/* Diagnosis */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Diagnosis
                    </h3>
                    <p className="text-gray-700 ml-7">{selectedPrescription.diagnosis}</p>
                  </div>

                  {/* Symptoms */}
                  {selectedPrescription.symptoms && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Symptoms
                      </h3>
                      <p className="text-gray-700 ml-7">{selectedPrescription.symptoms}</p>
                    </div>
                  )}

                  {/* Medications */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Pill className="h-5 w-5 text-blue-600" />
                      Medications
                    </h3>
                    <div className="ml-7 space-y-4">
                      {selectedPrescription.medications.map((med, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">{med.name}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Dosage:</span>
                              <p className="font-medium text-gray-900">{med.dosage}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Frequency:</span>
                              <p className="font-medium text-gray-900">{med.frequency}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <p className="font-medium text-gray-900">{med.duration}</p>
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600">Instructions:</span>
                              <p className="text-gray-700 mt-1">{med.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vital Signs */}
                  {selectedPrescription.vitalSigns && Object.values(selectedPrescription.vitalSigns).some(v => v) && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Vital Signs
                      </h3>
                      <div className="ml-7 grid grid-cols-2 gap-3 text-sm">
                        {selectedPrescription.vitalSigns.bloodPressure && (
                          <div>
                            <span className="text-gray-600">Blood Pressure:</span>
                            <p className="font-medium text-gray-900">{selectedPrescription.vitalSigns.bloodPressure}</p>
                          </div>
                        )}
                        {selectedPrescription.vitalSigns.temperature && (
                          <div>
                            <span className="text-gray-600">Temperature:</span>
                            <p className="font-medium text-gray-900">{selectedPrescription.vitalSigns.temperature}</p>
                          </div>
                        )}
                        {selectedPrescription.vitalSigns.pulse && (
                          <div>
                            <span className="text-gray-600">Pulse:</span>
                            <p className="font-medium text-gray-900">{selectedPrescription.vitalSigns.pulse}</p>
                          </div>
                        )}
                        {selectedPrescription.vitalSigns.weight && (
                          <div>
                            <span className="text-gray-600">Weight:</span>
                            <p className="font-medium text-gray-900">{selectedPrescription.vitalSigns.weight}</p>
                          </div>
                        )}
                        {selectedPrescription.vitalSigns.height && (
                          <div>
                            <span className="text-gray-600">Height:</span>
                            <p className="font-medium text-gray-900">{selectedPrescription.vitalSigns.height}</p>
                          </div>
                        )}
                        {selectedPrescription.vitalSigns.oxygenSaturation && (
                          <div>
                            <span className="text-gray-600">O2 Saturation:</span>
                            <p className="font-medium text-gray-900">{selectedPrescription.vitalSigns.oxygenSaturation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lab Tests */}
                  {selectedPrescription.labTests && selectedPrescription.labTests.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Lab Tests Recommended
                      </h3>
                      <ul className="ml-7 space-y-1">
                        {selectedPrescription.labTests.map((test, idx) => (
                          <li key={idx} className="text-gray-700 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{test}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up Date */}
                  {selectedPrescription.followUpDate && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Follow-up Date
                      </h3>
                      <p className="text-gray-700 ml-7">
                        {new Date(selectedPrescription.followUpDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedPrescription.notes && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Additional Notes
                      </h3>
                      <p className="text-gray-700 ml-7">{selectedPrescription.notes}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="pt-6 border-t text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Prescribed on:</span>
                      <span className="font-medium text-gray-700">
                        {new Date(selectedPrescription.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {selectedPrescription.updatedAt !== selectedPrescription.createdAt && (
                      <div className="flex justify-between mt-2">
                        <span>Last updated:</span>
                        <span className="font-medium text-gray-700">
                          {new Date(selectedPrescription.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a prescription to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
