'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { 
  FileText, 
  Search, 
  Calendar,
  User,
  Pill,
  ArrowLeft,
  Plus,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Prescription {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  doctorId: {
    _id: string;
    name: string;
  };
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  diagnosis: string;
  notes?: string;
  createdAt: string;
}

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = prescriptions.filter(prescription =>
        prescription.patientId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPrescriptions(filtered);
    } else {
      setFilteredPrescriptions(prescriptions);
    }
  }, [searchTerm, prescriptions]);

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
        
        if (userData.role !== 'doctor') {
          router.push('/auth/login');
          return;
        }
      } else {
        localStorage.removeItem('token');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const userResponse = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!userResponse.ok) return;

      const userResult = await userResponse.json();
      const userData = userResult.data?.user || userResult.user || userResult;

      const response = await fetch(`${API_URL}/prescriptions/doctor/${userData._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const prescriptionsData = result.data || [];
        setPrescriptions(prescriptionsData);
        setFilteredPrescriptions(prescriptionsData);
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/doctor/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Prescriptions</h1>
              <p className="text-gray-600 mt-2">Manage patient prescriptions and medications</p>
            </div>
            <Link
              href="/doctor/patients"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Prescription
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by patient name or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Prescriptions</h3>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{prescriptions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Month</h3>
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {prescriptions.filter(p => {
                const prescDate = new Date(p.createdAt);
                const now = new Date();
                return prescDate.getMonth() === now.getMonth() && 
                       prescDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Week</h3>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {prescriptions.filter(p => {
                const prescDate = new Date(p.createdAt);
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return prescDate >= weekAgo;
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Unique Patients</h3>
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {new Set(prescriptions.map(p => p.patientId?._id)).size}
            </p>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Recent Prescriptions ({filteredPrescriptions.length})
            </h2>
          </div>
          
          {filteredPrescriptions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => (
                <div key={prescription._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {prescription.patientId?.name || 'Unknown Patient'}
                        </h3>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Diagnosis:</span>
                        <p className="text-gray-900">{prescription.diagnosis}</p>
                      </div>

                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Medications:</span>
                        <div className="mt-2 space-y-2">
                          {prescription.medications.map((med, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <Pill className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <span className="font-medium">{med.name}</span>
                                <span className="text-gray-600"> - {med.dosage}, {med.frequency} for {med.duration}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {prescription.notes && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Notes:</span>
                          <p className="text-sm text-gray-600 mt-1">{prescription.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                        <Calendar className="h-4 w-4" />
                        {new Date(prescription.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/doctor/prescriptions/${prescription._id}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first prescription'}
              </p>
              <Link
                href="/doctor/patients"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Prescription
              </Link>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Prescription Management</h4>
              <p className="text-sm text-blue-700">
                This feature is currently in development. You&apos;ll be able to create, manage, and track patient prescriptions here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
