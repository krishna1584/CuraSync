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
  Download,
  Upload,
  ArrowLeft,
  Filter,
  Eye,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MedicalRecord {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  recordType: string;
  date: string;
  title: string;
  description?: string;
  fileUrl?: string;
  createdAt: string;
}

export default function DoctorRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const router = useRouter();

  const recordTypes = ['all', 'lab-report', 'imaging', 'prescription', 'consultation', 'other'];

  useEffect(() => {
    checkAuth();
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.patientId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.recordType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(record => record.recordType === filterType);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, filterType, records]);

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

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Placeholder - replace with actual API call when available
      setRecords([]);
      setFilteredRecords([]);
    } catch (error) {
      console.error('Failed to fetch records:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lab-report':
        return 'bg-blue-100 text-blue-700';
      case 'imaging':
        return 'bg-purple-100 text-purple-700';
      case 'prescription':
        return 'bg-green-100 text-green-700';
      case 'consultation':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Medical Records</h1>
              <p className="text-gray-600 mt-2">Access and manage patient medical records</p>
            </div>
            <button
              onClick={() => toast.success('Upload feature will be available soon')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Record
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by patient name or record title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {recordTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Records</h3>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{records.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Lab Reports</h3>
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {records.filter(r => r.recordType === 'lab-report').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Imaging</h3>
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {records.filter(r => r.recordType === 'imaging').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Month</h3>
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {records.filter(r => {
                const recordDate = new Date(r.createdAt);
                const now = new Date();
                return recordDate.getMonth() === now.getMonth() && 
                       recordDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Medical Records ({filteredRecords.length})
            </h2>
          </div>
          
          {filteredRecords.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <div key={record._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeColor(record.recordType)}`}>
                          {record.recordType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Patient:</span>
                        {record.patientId?.name || 'Unknown'}
                      </div>

                      {record.description && (
                        <p className="text-sm text-gray-600 mb-3">{record.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs">
                          Uploaded: {new Date(record.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      <button
                        onClick={() => toast.success('View feature coming soon')}
                        className="flex items-center justify-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1 sm:flex-none"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        <span className="text-sm">View</span>
                      </button>
                      {record.fileUrl && (
                        <button
                          onClick={() => toast.success('Download feature coming soon')}
                          className="flex items-center justify-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-1 sm:flex-none"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          <span className="text-sm">Download</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'Medical records will appear here'}
              </p>
              <button
                onClick={() => toast.success('Upload feature will be available soon')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Record
              </button>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Medical Records Management</h4>
              <p className="text-sm text-blue-700">
                This feature is currently in development. You&apos;ll be able to view, upload, and manage patient medical records including lab reports, imaging results, and consultation notes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
