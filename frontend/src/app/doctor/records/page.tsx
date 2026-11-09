'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import {
  FileText,
  Search,
  Calendar,
  User,
  Upload,
  ArrowLeft,
  Filter,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

// Shape returned by GET /api/reports (doctors only receive their own patients' reports)
interface PatientReport {
  _id: string;
  reportTitle: string;
  reportType: string;
  testDate: string;
  createdAt: string;
  cloudinaryUrl: string;
  notes?: string;
  summary?: string;
  aiProcessed: boolean;
  aiProcessingError?: string;
  status: 'pending' | 'processed' | 'reviewed' | 'archived';
  reviewNotes?: string;
  patient?: { _id: string; name: string; email?: string; patientId?: string };
  patientName?: string;
  uploadedBy?: { name: string; role: string };
  reviewedBy?: { name: string; role: string };
}

const STATUS_STYLES: Record<PatientReport['status'], { label: string; className: string }> = {
  pending: { label: 'Awaiting AI', className: 'bg-gray-100 text-gray-700' },
  processed: { label: 'Needs review', className: 'bg-yellow-100 text-yellow-800' },
  reviewed: { label: 'Reviewed', className: 'bg-green-100 text-green-800' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-500' },
};

export default function DoctorRecords() {
  const [records, setRecords] = useState<PatientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [reviewing, setReviewing] = useState<PatientReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const router = useRouter();

  const fetchRecords = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?role=doctor');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        router.push('/auth/login?role=doctor');
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setRecords(Array.isArray(result.data) ? result.data : []);
        setLoadError('');
      } else {
        setLoadError(result.message || 'Failed to load records');
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const recordTypes = useMemo(
    () => ['all', ...Array.from(new Set(records.map(r => r.reportType).filter(Boolean)))],
    [records]
  );

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return records.filter(record => {
      const patientName = record.patient?.name || record.patientName || '';
      const matchesSearch = !term ||
        patientName.toLowerCase().includes(term) ||
        record.patient?.patientId?.toLowerCase().includes(term) ||
        record.reportTitle.toLowerCase().includes(term) ||
        record.reportType.toLowerCase().includes(term);
      const matchesType = filterType === 'all' || record.reportType === filterType;
      return matchesSearch && matchesType;
    });
  }, [records, searchTerm, filterType]);

  const openReview = (record: PatientReport) => {
    setReviewing(record);
    setReviewNotes(record.reviewNotes || '');
  };

  const submitReview = async () => {
    if (!reviewing) return;
    const token = localStorage.getItem('token');
    setSavingReview(true);
    try {
      const response = await fetch(`${API_URL}/reports/${reviewing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'reviewed', reviewNotes }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        toast.success('Report marked as reviewed');
        setReviewing(null);
        fetchRecords();
      } else {
        toast.error(result.message || 'Could not save the review');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSavingReview(false);
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

  const now = new Date();

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
              <p className="text-gray-600 mt-2">Reports from patients who have appointments with you</p>
            </div>
            <Link
              href="/doctor/upload-report"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Record
            </Link>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {loadError}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by patient, patient ID or report title..."
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
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Records</h3>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{records.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Needs Review</h3>
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {records.filter(r => r.status === 'processed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Reviewed</h3>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {records.filter(r => r.status === 'reviewed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Month</h3>
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {records.filter(r => {
                const recordDate = new Date(r.createdAt);
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
              {filteredRecords.map((record) => {
                const status = STATUS_STYLES[record.status] || STATUS_STYLES.pending;
                return (
                  <div key={record._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 break-words">{record.reportTitle}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {record.reportType}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Patient:</span>
                          {record.patient?._id ? (
                            <Link href={`/doctor/patient-health/${record.patient._id}`} className="text-blue-600 hover:underline">
                              {record.patient.name}
                            </Link>
                          ) : (
                            record.patientName || 'Unknown'
                          )}
                          {record.patient?.patientId && <span className="text-gray-400">({record.patient.patientId})</span>}
                        </div>

                        {(record.summary || record.notes) && (
                          <p className="text-sm text-gray-600 mb-3">{record.summary || record.notes}</p>
                        )}
                        {record.reviewNotes && (
                          <p className="text-sm text-green-800 bg-green-50 rounded p-2 mb-3">
                            Review{record.reviewedBy?.name ? ` by Dr. ${record.reviewedBy.name}` : ''}: {record.reviewNotes}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Test date: {new Date(record.testDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs">
                            Uploaded {new Date(record.createdAt).toLocaleDateString()}
                            {record.uploadedBy?.name ? ` by ${record.uploadedBy.name}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2">
                        <a
                          href={record.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1 sm:flex-none"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="text-sm">Open file</span>
                        </a>
                        <button
                          onClick={() => openReview(record)}
                          className="flex items-center justify-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-1 sm:flex-none"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">{record.status === 'reviewed' ? 'Edit review' : 'Review'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Reports uploaded for your patients will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 id="review-title" className="text-lg font-semibold text-gray-900">Review report</h3>
                <p className="text-sm text-gray-500">{reviewing.reportTitle}</p>
              </div>
              <button onClick={() => setReviewing(null)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700 mb-2">Review notes</label>
            <textarea
              id="reviewNotes"
              rows={4}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Findings, advice or follow-up for the patient"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setReviewing(null)}
                disabled={savingReview}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={savingReview}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {savingReview ? 'Saving…' : 'Mark reviewed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
