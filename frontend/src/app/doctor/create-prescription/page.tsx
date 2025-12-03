'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/config';
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  User as UserIcon,
  FileText,
  Activity,
  Pill
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  patientId: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

function CreatePrescriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(preselectedPatientId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: '',
    temperature: '',
    pulse: '',
    weight: '',
    height: '',
    oxygenSaturation: ''
  });
  const [labTests, setLabTests] = useState<string[]>(['']);
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data?.user || result.user || result;
        
        if (userData.role !== 'doctor') {
          router.push('/auth/login');
          return;
        }
        
        setUser(userData);
        fetchPatients();
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
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/patients`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setPatients(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const addLabTest = () => {
    setLabTests([...labTests, '']);
  };

  const removeLabTest = (index: number) => {
    if (labTests.length > 1) {
      setLabTests(labTests.filter((_, i) => i !== index));
    }
  };

  const updateLabTest = (index: number, value: string) => {
    const updated = [...labTests];
    updated[index] = value;
    setLabTests(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (!diagnosis.trim()) {
      toast.error('Diagnosis is required');
      return;
    }

    const validMedications = medications.filter(m => m.name.trim() && m.dosage.trim());
    if (validMedications.length === 0) {
      toast.error('At least one medication is required');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const prescriptionData = {
        patientId: selectedPatient,
        doctorId: user?._id,
        diagnosis: diagnosis.trim(),
        symptoms: symptoms.trim() || undefined,
        medications: validMedications,
        vitalSigns: Object.fromEntries(
          Object.entries(vitalSigns).filter(([_, v]) => v.trim())
        ),
        labTests: labTests.filter(test => test.trim()),
        followUpDate: followUpDate || undefined,
        notes: notes.trim() || undefined
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
        router.push('/doctor/prescriptions');
      } else {
        toast.error(result.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Create prescription error:', error);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Prescription</h1>
          <p className="text-gray-600 mt-2">Fill in the prescription details for your patient</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Patient Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} - {patient.patientId}
                  </option>
                ))}
              </select>
              {selectedPatient && (
                <button
                  type="button"
                  onClick={() => router.push(`/doctor/patient-health/${selectedPatient}`)}
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  View Patient Health Records
                </button>
              )}
            </div>
          </div>

          {/* Diagnosis & Symptoms */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Diagnosis & Symptoms
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Acute Bronchitis"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="List symptoms observed..."
                />
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Pill className="h-5 w-5 mr-2 text-blue-600" />
                Medications <span className="text-red-500 ml-1">*</span>
              </h2>
              <button
                type="button"
                onClick={addMedication}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Medication
              </button>
            </div>
            <div className="space-y-4">
              {medications.map((med, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medicine Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Amoxicillin"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosage <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 500mg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 3 times daily"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 7 days"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Take with food"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs (Optional)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={vitalSigns.bloodPressure}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                <input
                  type="text"
                  value={vitalSigns.temperature}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 98.6°F"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pulse</label>
                <input
                  type="text"
                  value={vitalSigns.pulse}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, pulse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 72 bpm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <input
                  type="text"
                  value={vitalSigns.weight}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 70 kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                <input
                  type="text"
                  value={vitalSigns.height}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, height: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 175 cm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">O2 Saturation</label>
                <input
                  type="text"
                  value={vitalSigns.oxygenSaturation}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, oxygenSaturation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 98%"
                />
              </div>
            </div>
          </div>

          {/* Lab Tests */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Lab Tests Recommended (Optional)</h2>
              <button
                type="button"
                onClick={addLabTest}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Test
              </button>
            </div>
            <div className="space-y-2">
              {labTests.map((test, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={test}
                    onChange={(e) => updateLabTest(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Complete Blood Count (CBC)"
                  />
                  {labTests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLabTest(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up & Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional instructions or observations..."
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
      <CreatePrescriptionForm />
    </Suspense>
  );
}
