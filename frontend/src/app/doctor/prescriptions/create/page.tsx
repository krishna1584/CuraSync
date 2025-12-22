'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/config';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Patient {
  _id: string;
  name: string;
  email: string;
  patientId: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

function CreatePrescriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState('');

  const [formData, setFormData] = useState({
    diagnosis: '',
    symptoms: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }] as Medication[],
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: ''
    },
    labTests: '',
    followUpDate: '',
    notes: ''
  });

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
        
        if (userData.role !== 'doctor') {
          router.push('/auth/login');
          return;
        }
        
        setDoctorId(userData._id);
      } else {
        localStorage.removeItem('token');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (patientId && doctorId) {
      fetchPatientDetails();
    }
  }, [patientId, doctorId]);

  const fetchPatientDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setPatient(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch patient:', error);
      toast.error('Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedication = (index: number) => {
    const newMedications = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: newMedications });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const newMedications = [...formData.medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setFormData({ ...formData, medications: newMedications });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }

    const validMedications = formData.medications.filter(med => med.name.trim() !== '');
    if (validMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const prescriptionData = {
        patientId,
        doctorId,
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms || undefined,
        medications: validMedications,
        vitalSigns: formData.vitalSigns,
        labTests: formData.labTests || undefined,
        followUpDate: formData.followUpDate || undefined,
        notes: formData.notes || undefined
      };

      const response = await fetch(`${API_URL}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(prescriptionData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Prescription created successfully!');
        setTimeout(() => {
          router.push('/doctor/prescriptions');
        }, 1500);
      } else {
        toast.error(result.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Patient not found</p>
          <button
            onClick={() => router.push('/doctor/patients')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/doctor/prescriptions')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Prescriptions
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Prescription</h1>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Patient ID</p>
              <p className="font-medium text-gray-900">{patient.patientId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Blood Group</p>
              <p className="font-medium text-gray-900">{patient.bloodGroup || 'Not specified'}</p>
            </div>
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-600">Allergies</p>
                <p className="font-medium text-red-600">{patient.allergies.join(', ')}</p>
              </div>
            )}
            {patient.chronicConditions && patient.chronicConditions.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-600">Chronic Conditions</p>
                <p className="font-medium text-orange-600">{patient.chronicConditions.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Prescription Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Diagnosis */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis</h2>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter diagnosis..."
              required
            />
          </div>

          {/* Symptoms */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptoms</h2>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe symptoms..."
            />
          </div>

          {/* Medications */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Medications</h2>
              <button
                type="button"
                onClick={addMedication}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>

            <div className="space-y-4">
              {formData.medications.map((med, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Medication {index + 1}</h3>
                    {formData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Paracetamol"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 500mg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Twice daily"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 7 days"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Take after meals"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={formData.vitalSigns.bloodPressure}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate</label>
                <input
                  type="text"
                  value={formData.vitalSigns.heartRate}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitalSigns: { ...formData.vitalSigns, heartRate: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 72 bpm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                <input
                  type="text"
                  value={formData.vitalSigns.temperature}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitalSigns: { ...formData.vitalSigns, temperature: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 98.6°F"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <input
                  type="text"
                  value={formData.vitalSigns.weight}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitalSigns: { ...formData.vitalSigns, weight: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 70 kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                <input
                  type="text"
                  value={formData.vitalSigns.height}
                  onChange={(e) => setFormData({
                    ...formData,
                    vitalSigns: { ...formData.vitalSigns, height: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 175 cm"
                />
              </div>
            </div>
          </div>

          {/* Lab Tests & Follow-up */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab Tests Recommended</label>
                <textarea
                  value={formData.labTests}
                  onChange={(e) => setFormData({ ...formData, labTests: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CBC, Blood Sugar, Lipid Profile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes or instructions..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/doctor/prescriptions')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Creating...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreatePrescriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CreatePrescriptionContent />
    </Suspense>
  );
}
