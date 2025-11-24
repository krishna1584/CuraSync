'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload, 
  File, 
  Calendar, 
  User, 
  Tag,
  X,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';

interface Patient {
  _id: string;
  name: string;
  email: string;
  patientId?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UploadReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    reportType: 'Lab Report',
    reportDate: '',
    tags: [] as string[],
    isPublic: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const reportTypes = [
    'Lab Report',
    'X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
    'ECG',
    'Blood Test',
    'Urine Test',
    'Prescription',
    'Discharge Summary',
    'Medical Certificate',
    'Vaccination Record',
    'Other'
  ];

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

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data?.user || result;
        setUser(userData);
        
        // If admin/doctor/staff, fetch patients list
        if (['admin', 'doctor', 'nurse', 'receptionist'].includes(userData.role)) {
          fetchPatients();
        } else if (userData.role === 'patient') {
          // For patients, they can only upload for themselves
          setSelectedPatient({
            _id: userData.id,
            name: userData.name,
            email: userData.email
          });
        }
      } else {
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
      const response = await fetch('/api/users/patients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPatients(result.data || result);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, Word documents, and images are allowed');
        return;
      }

      setSelectedFile(file);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !reportData.tags.includes(tagInput.trim())) {
      setReportData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setReportData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patientId', selectedPatient._id);
      formData.append('title', reportData.title);
      formData.append('description', reportData.description);
      formData.append('reportType', reportData.reportType);
      formData.append('reportDate', reportData.reportDate);
      formData.append('tags', JSON.stringify(reportData.tags));
      formData.append('isPublic', reportData.isPublic.toString());

      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Report uploaded successfully!');
        // Reset form
        setReportData({
          title: '',
          description: '',
          reportType: 'Lab Report',
          reportDate: '',
          tags: [],
          isPublic: false
        });
        setSelectedFile(null);
        if (user?.role === 'patient') {
          router.push('/patient/records');
        } else {
          // Reset for staff to upload another
          setSelectedPatient(null);
        }
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getBackLink = () => {
    switch (user?.role) {
      case 'patient':
        return '/patient/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'admin':
      case 'nurse':
      case 'receptionist':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
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
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={getBackLink()} className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Upload Medical Report</h1>
          <p className="text-gray-600 mt-2">
            Upload medical reports, test results, and other documents
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Selection (for staff only) */}
          {user?.role !== 'patient' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Patient</h2>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {patients.map((patient) => (
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
                    <p className="text-sm text-gray-600">{patient.email}</p>
                    {patient.patientId && (
                      <p className="text-sm text-blue-600">ID: {patient.patientId}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Form */}
          <div className={`bg-white rounded-lg shadow p-6 ${user?.role === 'patient' ? 'md:col-span-2' : ''}`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="h-4 w-4 inline mr-2" />
                  Select File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex items-center justify-center">
                        <File className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900">Click to upload file</p>
                        <p className="text-sm text-gray-500">PDF, Word, or Image files (max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type *
                </label>
                <select
                  value={reportData.reportType}
                  onChange={(e) => setReportData(prev => ({ ...prev, reportType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reportTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  value={reportData.title}
                  onChange={(e) => setReportData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter report title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Report Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Report Date *
                </label>
                <input
                  type="date"
                  value={reportData.reportDate}
                  onChange={(e) => setReportData(prev => ({ ...prev, reportDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional notes or description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4 inline mr-2" />
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Add
                  </button>
                </div>
                {reportData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reportData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Patient Info */}
              {selectedPatient && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Uploading for Patient
                  </h3>
                  <p className="text-sm text-gray-700">{selectedPatient.name}</p>
                  <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                </div>
              )}

              {/* Submit Button */}
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