'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Upload, User as UserIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FileDropZone from '@/components/FileDropZone';
import { API_URL } from '@/lib/config';
import { getUser } from '@/lib/auth';
import { REPORT_TYPES, todayLocalDate } from '@/lib/reportFiles';

interface Patient {
  _id: string;
  name: string;
  email: string;
  patientId?: string;
}

const EMPTY_REPORT = { title: '', description: '', reportType: REPORT_TYPES[0], reportDate: '' };

const dashboardFor = (role?: string) => {
  if (role === 'patient') return '/patient/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  return '/admin/dashboard';
};

const inputClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

// The one report upload form, used by the patient, doctor and hospital staff areas.
export default function ReportUploadForm() {
  const router = useRouter();
  const [role, setRole] = useState<string | undefined>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [reportData, setReportData] = useState(EMPTY_REPORT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // The surrounding layout has already confirmed who is signed in.
    const user = getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setRole(user.role);

    if (user.role === 'patient') {
      setSelectedPatient({ _id: user._id, name: user.name, email: user.email });
      return;
    }

    const loadPatients = async () => {
      setPatientsLoading(true);
      try {
        const response = await fetch(`${API_URL}/users/patients`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok) {
          setPatients(Array.isArray(result.data) ? result.data : []);
        } else {
          toast.error(result.message || 'Could not load patients');
        }
      } catch {
        toast.error('Could not load patients');
      } finally {
        setPatientsLoading(false);
      }
    };
    loadPatients();
  }, [router]);

  const isPatient = role === 'patient';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    if (!reportData.title.trim() || !reportData.reportDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('reportFile', selectedFile);
      formData.append('patientId', selectedPatient._id);
      formData.append('reportTitle', reportData.title.trim());
      formData.append('reportType', reportData.reportType);
      formData.append('testDate', reportData.reportDate);
      formData.append('notes', reportData.description.trim());

      const response = await fetch(`${API_URL}/reports/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        toast.success('Report uploaded! AI is extracting the values...');
        setReportData(EMPTY_REPORT);
        setSelectedFile(null);
        if (isPatient) {
          router.push('/patient/lab-results');
        } else {
          setSelectedPatient(null);
        }
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={dashboardFor(role)} className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4">Upload Medical Report</h1>
          <p className="text-gray-600 mt-2">Upload medical reports and test results</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {role && !isPatient && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Patient</h2>
              {patientsLoading ? (
                <p className="text-sm text-gray-500">Loading patients…</p>
              ) : patients.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {role === 'doctor'
                    ? 'You can upload reports for patients who have an appointment with you. None yet.'
                    : 'No patients found.'}
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient._id}
                      type="button"
                      onClick={() => setSelectedPatient(patient)}
                      aria-pressed={selectedPatient?._id === patient._id}
                      className={`w-full text-left p-3 border rounded-lg transition-all ${
                        selectedPatient?._id === patient._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <span className="block font-semibold text-gray-900">{patient.name}</span>
                      <span className="block text-sm text-gray-600 break-all">{patient.email}</span>
                      {patient.patientId && (
                        <span className="block text-sm text-blue-600">ID: {patient.patientId}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={`bg-white rounded-lg shadow p-6 ${isPatient ? 'md:col-span-2' : ''}`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">File *</p>
                <FileDropZone file={selectedFile} onFileChange={setSelectedFile} disabled={uploading} />
              </div>

              <div>
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type *
                </label>
                <select
                  id="reportType"
                  value={reportData.reportType}
                  onChange={(e) => setReportData((prev) => ({ ...prev, reportType: e.target.value }))}
                  className={inputClasses}
                >
                  {REPORT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reportTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title *
                </label>
                <input
                  id="reportTitle"
                  type="text"
                  maxLength={200}
                  value={reportData.title}
                  onChange={(e) => setReportData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Complete blood count, March"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Test Date *
                </label>
                <input
                  id="reportDate"
                  type="date"
                  max={todayLocalDate()}
                  value={reportData.reportDate}
                  onChange={(e) => setReportData((prev) => ({ ...prev, reportDate: e.target.value }))}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="reportDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="reportDescription"
                  rows={3}
                  value={reportData.description}
                  onChange={(e) => setReportData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Anything the doctor should know about this report"
                  className={inputClasses}
                />
              </div>

              {!isPatient && selectedPatient && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    <UserIcon className="h-4 w-4 inline mr-2" />
                    Uploading for
                  </h3>
                  <p className="text-sm text-gray-700">{selectedPatient.name}</p>
                  <p className="text-sm text-gray-600 break-all">{selectedPatient.email}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || !selectedPatient || !reportData.title.trim() || !reportData.reportDate || uploading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
