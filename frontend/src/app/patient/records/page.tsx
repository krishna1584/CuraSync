'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { 
  FileText, 
  Download, 
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  Plus,
  Mail,
  Phone,
  MapPin,
  Clock,
  Heart,
  Edit2,
  Save,
  X,
  Droplet
} from 'lucide-react';
import toast from 'react-hot-toast';
import FileDropZone from '@/components/FileDropZone';
import { REPORT_TYPES, todayLocalDate } from '@/lib/reportFiles';
import { removeAuthToken } from '@/lib/auth';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  allergies?: string[];
  chronicConditions?: string[];
  createdAt: string;
}

interface EditFormData {
  name: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  allergies: string;
  chronicConditions: string;
}

interface Appointment {
  _id: string;
  doctorId: {
    name: string;
    specialization?: string;
  };
  appointmentDate: string;
  timeSlot: string;
  reason: string;
  status: string;
  notes?: string;
}

// Shape returned by GET /api/reports/my-reports
interface MedicalReport {
  _id: string;
  reportTitle: string;
  reportType: string;
  testDate: string;
  createdAt: string;
  cloudinaryUrl: string;
  fileType?: string;
  aiProcessed: boolean;
  aiProcessingError?: string;
  status: 'pending' | 'processed' | 'reviewed' | 'archived';
  uploadedBy?: { name: string; role: string };
  reviewedBy?: { name: string; role: string };
}

const reportStatus = (report: MedicalReport) => {
  if (report.status === 'reviewed') return { label: 'Reviewed by doctor', className: 'bg-green-100 text-green-800' };
  if (report.aiProcessed) return { label: 'Values extracted', className: 'bg-blue-100 text-blue-800' };
  if (report.aiProcessingError) return { label: 'Could not extract values', className: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Processing', className: 'bg-gray-100 text-gray-700' };
};

export default function MedicalRecords() {
  const [user, setUser] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'appointments'>('profile');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    recordName: '',
    category: 'Blood Test',
    date: ''
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    allergies: '',
    chronicConditions: ''
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
        
        if (userData.role !== 'patient') {
          router.push('/auth/login');
          return;
        }
        
        setUser(userData);
      } else if (response.status === 401) {
        removeAuthToken();
        router.push('/auth/login');
      } else {
        toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/reports/my-reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setReports(Array.isArray(result.data) ? result.data : []);
      } else {
        toast.error('Could not load your medical documents');
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Could not load your medical documents');
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      const response = await fetch(`${API_URL}/appointments/patient/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const raw: Array<Record<string, unknown>> = Array.isArray(result.data) ? result.data : [];
        // The API returns { doctor, date, time }; this page uses the model's field names.
        setAppointments(raw.map((item) => ({
          ...item,
          doctorId: (item.doctorId || item.doctor) as Appointment['doctorId'],
          appointmentDate: (item.appointmentDate || item.date) as string,
          timeSlot: (item.timeSlot || item.time) as string,
        }) as Appointment));
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
    }
  };

  const handleEditClick = () => {
    if (!user) return;
    
    // Populate form with current user data
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user.gender || '',
      address: user.address || '',
      bloodGroup: user.bloodGroup || '',
      emergencyContactName: user.emergencyContact?.name || '',
      emergencyContactPhone: user.emergencyContact?.phone || '',
      emergencyContactRelationship: user.emergencyContact?.relationship || '',
      allergies: user.allergies?.join(', ') || '',
      chronicConditions: user.chronicConditions?.join(', ') || ''
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({
      name: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      bloodGroup: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      allergies: '',
      chronicConditions: ''
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        router.push('/auth/login');
        return;
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        name: editFormData.name,
        phone: editFormData.phone,
        dateOfBirth: editFormData.dateOfBirth || undefined,
        gender: editFormData.gender || undefined,
        address: editFormData.address || undefined,
        bloodGroup: editFormData.bloodGroup || undefined,
        emergencyContact: {
          name: editFormData.emergencyContactName || undefined,
          phone: editFormData.emergencyContactPhone || undefined,
          relationship: editFormData.emergencyContactRelationship || undefined
        },
        allergies: editFormData.allergies ? editFormData.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
        chronicConditions: editFormData.chronicConditions ? editFormData.chronicConditions.split(',').map(c => c.trim()).filter(Boolean) : []
      };

      const response = await fetch(`${API_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Profile updated successfully!');
        // Update user state with new data
        setUser(result.data);
        setIsEditMode(false);
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['All Records', ...REPORT_TYPES];

  const filteredRecords = reports.filter(report => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = report.reportTitle.toLowerCase().includes(term) ||
                         report.reportType.toLowerCase().includes(term) ||
                         (report.uploadedBy?.name || '').toLowerCase().includes(term);
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All Records' ||
                           report.reportType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType?: string) => {
    if (fileType?.startsWith('image/')) {
      return <Eye className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const resetUploadForm = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadFormData({ recordName: '', category: 'Blood Test', date: '' });
  };

  const handleUploadRecord = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    if (!uploadFormData.recordName || !uploadFormData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('reportFile', selectedFile);
      formData.append('patientId', user?._id || '');
      formData.append('reportTitle', uploadFormData.recordName);
      formData.append('reportType', uploadFormData.category);
      formData.append('testDate', uploadFormData.date);
      formData.append('notes', '');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        toast.success('Report uploaded! AI is extracting the values...');
        resetUploadForm();
        fetchReports();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <Heart className="inline h-8 w-8 text-blue-600 mr-2" />
              My Health Profile
            </h1>
            <p className="text-gray-600 mt-2">View your complete medical information and history</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto whitespace-nowrap space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="inline h-5 w-5 mr-2" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="inline h-5 w-5 mr-2" />
              Appointment History ({appointments.length})
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && user && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              {!isEditMode ? (
                <button
                  onClick={handleEditClick}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>

            {!isEditMode ? (
              // View Mode
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-2" />
                      Full Name
                    </label>
                    <p className="text-gray-900 font-medium">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email
                    </label>
                    <p className="text-gray-900 break-all">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Phone Number
                    </label>
                    <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      Date of Birth
                    </label>
                    <p className="text-gray-900">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-2" />
                      Gender
                    </label>
                    <p className="text-gray-900 capitalize">{user.gender || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Droplet className="inline h-4 w-4 mr-2" />
                      Blood Group
                    </label>
                    <p className="text-gray-900">{user.bloodGroup || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      Address
                    </label>
                    <p className="text-gray-900">{user.address || 'Not provided'}</p>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <p className="text-gray-900">{user.emergencyContact?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <p className="text-gray-900">{user.emergencyContact?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                      <p className="text-gray-900">{user.emergencyContact?.relationship || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                      <p className="text-gray-900">{user.allergies && user.allergies.length > 0 ? user.allergies.join(', ') : 'None reported'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Conditions</label>
                      <p className="text-gray-900">{user.chronicConditions && user.chronicConditions.length > 0 ? user.chronicConditions.join(', ') : 'None reported'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-2" />
                    Member Since
                  </label>
                  <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (read-only)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={editFormData.gender}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      value={editFormData.bloodGroup}
                      onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={editFormData.emergencyContactName}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={editFormData.emergencyContactPhone}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                      <input
                        type="text"
                        value={editFormData.emergencyContactRelationship}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactRelationship: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allergies <span className="text-gray-500 text-xs">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.allergies}
                        onChange={(e) => setEditFormData({ ...editFormData, allergies: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Penicillin, Peanuts"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chronic Conditions <span className="text-gray-500 text-xs">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.chronicConditions}
                        onChange={(e) => setEditFormData({ ...editFormData, chronicConditions: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Diabetes, Hypertension"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Appointment History</h2>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          Dr. {appointment.doctorId?.name || 'Unknown'}
                        </h3>
                        {appointment.doctorId?.specialization && (
                          <p className="text-sm text-blue-600">{appointment.doctorId.specialization}</p>
                        )}
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {appointment.timeSlot}
                          </p>
                          <p className="mt-2 text-gray-700">{appointment.reason}</p>
                          {appointment.notes && (
                            <p className="mt-2 text-gray-600 italic bg-gray-50 p-2 rounded">
                              Notes: {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : appointment.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-700'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No appointment history found</p>
                <Link
                  href="/patient/book-appointment"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Book your first appointment
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Documents Section - Keep the original upload functionality */}
        {activeTab === 'profile' && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Medical Documents</h2>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Upload Document</span>
              </button>
            </div>

            {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search records, doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Records Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredRecords.map((record) => {
            const status = reportStatus(record);
            return (
              <div key={record._id} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-4 min-w-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600">
                      {getFileIcon(record.fileType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 break-words">{record.reportTitle}</h3>
                      <p className="text-blue-600 font-medium">{record.reportType}</p>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Test date: {new Date(record.testDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>
                            Uploaded by {record.uploadedBy?.role === 'patient' ? 'you' : record.uploadedBy?.name || 'hospital staff'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        {record.reviewedBy?.name && (
                          <span className="text-sm text-gray-500">Reviewed by Dr. {record.reviewedBy.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={record.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Download className="h-4 w-4" />
                      Open file
                    </a>
                    {record.aiProcessed && (
                      <Link
                        href="/patient/lab-results"
                        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        View values
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {reportsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {reports.length === 0 ? 'No medical documents yet' : 'No records match your search'}
            </h3>
            <p className="text-gray-500">
              {reports.length === 0 ? 'Upload a report and it will appear here.' : 'Try adjusting your search terms or filter.'}
            </p>
          </div>
        )}

          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90dvh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Medical Record</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record Name
                  </label>
                  <input
                    type="text"
                    value={uploadFormData.recordName}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, recordName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter record name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select 
                    value={uploadFormData.category}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    max={todayLocalDate()}
                    value={uploadFormData.date}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-2">File</p>
                  <FileDropZone file={selectedFile} onFileChange={setSelectedFile} disabled={uploading} />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={resetUploadForm}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadRecord}
                  disabled={uploading || !selectedFile || !uploadFormData.recordName || !uploadFormData.date}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}