'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { API_URL } from '@/lib/config';
import { 
  TestTube, 
  Download, 
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Activity,
  Heart,
  Droplet,
  Thermometer,
  Weight
} from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';

// Helper function to get metric-specific information
const getMetricInfo = (key: string) => {
  const lowerKey = key.toLowerCase();
  
  if (lowerKey.includes('hemoglobin') || lowerKey.includes('rbc') || lowerKey.includes('wbc')) {
    return {
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      icon: <Droplet className="h-4 w-4 text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      iconBg: 'bg-red-100'
    };
  } else if (lowerKey.includes('sugar') || lowerKey.includes('glucose') || lowerKey.includes('hba1c')) {
    return {
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      icon: <Activity className="h-4 w-4 text-orange-600" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      iconBg: 'bg-orange-100'
    };
  } else if (lowerKey.includes('cholesterol') || lowerKey.includes('triglyceride') || lowerKey.includes('ldl') || lowerKey.includes('hdl')) {
    return {
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      icon: <Heart className="h-4 w-4 text-purple-600" />,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      iconBg: 'bg-purple-100'
    };
  } else if (lowerKey.includes('temperature') || lowerKey.includes('temp')) {
    return {
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      icon: <Thermometer className="h-4 w-4 text-yellow-600" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      iconBg: 'bg-yellow-100'
    };
  } else if (lowerKey.includes('weight') || lowerKey.includes('bmi')) {
    return {
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      icon: <Weight className="h-4 w-4 text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      iconBg: 'bg-green-100'
    };
  } else {
    return {
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      icon: <Activity className="h-4 w-4 text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      iconBg: 'bg-blue-100'
    };
  }
};

// Helper function to categorize extracted data
const categorizeExtractedData = (data: Record<string, string | number | boolean>) => {
  const categories: Record<string, Array<[string, string | number | boolean]>> = {
    'Patient Information': [],
    'Test Details': [],
    'Blood Parameters': [],
    'Liver Function': [],
    'Kidney Function': [],
    'Lipid Profile': [],
    'Thyroid Function': [],
    'Other Parameters': []
  };

  Object.entries(data).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('patient') || lowerKey.includes('name') || lowerKey.includes('age') || lowerKey.includes('gender')) {
      categories['Patient Information'].push([key, value]);
    } else if (lowerKey.includes('date') || lowerKey.includes('time') || lowerKey.includes('test')) {
      categories['Test Details'].push([key, value]);
    } else if (lowerKey.includes('hemoglobin') || lowerKey.includes('rbc') || lowerKey.includes('wbc') || 
               lowerKey.includes('platelet') || lowerKey.includes('hematocrit')) {
      categories['Blood Parameters'].push([key, value]);
    } else if (lowerKey.includes('sgot') || lowerKey.includes('sgpt') || lowerKey.includes('bilirubin') || 
               lowerKey.includes('liver') || lowerKey.includes('alt') || lowerKey.includes('ast')) {
      categories['Liver Function'].push([key, value]);
    } else if (lowerKey.includes('creatinine') || lowerKey.includes('urea') || lowerKey.includes('uric') || 
               lowerKey.includes('kidney') || lowerKey.includes('bun')) {
      categories['Kidney Function'].push([key, value]);
    } else if (lowerKey.includes('cholesterol') || lowerKey.includes('triglyceride') || 
               lowerKey.includes('ldl') || lowerKey.includes('hdl') || lowerKey.includes('lipid')) {
      categories['Lipid Profile'].push([key, value]);
    } else if (lowerKey.includes('tsh') || lowerKey.includes('t3') || lowerKey.includes('t4') || lowerKey.includes('thyroid')) {
      categories['Thyroid Function'].push([key, value]);
    } else {
      categories['Other Parameters'].push([key, value]);
    }
  });

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([, items]) => items.length > 0)
  );
};

// Helper function to format field names
const formatFieldName = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


interface Report {
  _id: string;
  reportType: string;
  reportTitle: string;
  testDate: string;
  cloudinaryUrl: string;
  aiProcessed: boolean;
  extractedData: Record<string, string | number | boolean>;
  metrics: Record<string, string>;
  summary?: string;
  status: string;
  createdAt: string;
  aiProcessingError?: string;
}

type LabTestStatus = 'ordered' | 'sample-collected' | 'in-progress' | 'completed' | 'cancelled';

interface BookedLabTest {
  _id: string;
  testName: string;
  testCategory?: string;
  status: LabTestStatus;
  scheduledDate?: string;
  timeSlot?: string;
  cost: number;
  doctorId?: { name: string; specialization?: string } | null;
}

const LAB_STATUS_STYLES: Record<LabTestStatus, string> = {
  ordered: 'bg-blue-100 text-blue-800',
  'sample-collected': 'bg-indigo-100 text-indigo-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const LAB_STATUS_LABELS: Record<LabTestStatus, string> = {
  ordered: 'Booked',
  'sample-collected': 'Sample collected',
  'in-progress': 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function LabResults() {
  const confirmAction = useConfirm();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');
  const [bookedTests, setBookedTests] = useState<BookedLabTest[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookedTests = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/lab-tests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setBookedTests(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch booked lab tests:', error);
      toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
    }
  }, []);

  useEffect(() => {
    fetchBookedTests();
  }, [fetchBookedTests]);

  const cancelLabTest = async (id: string) => {
    if (!(await confirmAction({ title: 'Cancel this lab test?', confirmLabel: 'Cancel test', danger: true }))) return;
    const token = localStorage.getItem('token');
    setCancellingId(id);
    try {
      const response = await fetch(`${API_URL}/lab-tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        toast.success('Lab test cancelled');
        fetchBookedTests();
      } else {
        toast.error(result.message || 'Could not cancel this test');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const checkAuthAndFetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/reports/my-reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const reportsData = result.data || result;
        setReports(reportsData);
      } else if (response.status === 401) {
        router.push('/auth/login');
      } else {
        toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Some information could not be loaded. Please refresh the page.', { id: 'load-error' });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndFetchReports();
  }, [checkAuthAndFetchReports]);

  const categories = ['All Tests', ...Array.from(new Set(reports.map(r => r.reportType)))];

  const filteredResults = reports.filter(report => {
    const matchesSearch = report.reportTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All Tests' ||
                           report.reportType === selectedCategory;
    
    // Filter by timeframe
    if (selectedTimeframe && selectedTimeframe !== '') {
      const testDate = new Date(report.testDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (selectedTimeframe) {
        case 'Last 30 Days':
          if (daysDiff > 30) return false;
          break;
        case 'Last 3 Months':
          if (daysDiff > 90) return false;
          break;
        case 'Last 6 Months':
          if (daysDiff > 180) return false;
          break;
        case 'Last Year':
          if (daysDiff > 365) return false;
          break;
      }
    }
    
    return matchesSearch && matchesCategory;
  });




  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lab Results</h1>
          <p className="text-gray-600 mt-2">View and track your laboratory test results</p>
        </div>

        {/* Booked lab tests */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <TestTube className="h-5 w-5 mr-2 text-blue-600" />
              Booked tests
            </h2>
            <Link
              href="/patient/book-lab-test"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Book a test
            </Link>
          </div>
          {bookedTests.length === 0 ? (
            <p className="text-sm text-gray-500">You have no booked lab tests.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {bookedTests.map((test) => (
                <li key={test._id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{test.testName}</p>
                    <p className="text-sm text-gray-500">
                      {test.scheduledDate ? new Date(test.scheduledDate).toLocaleDateString() : 'Date to be confirmed'}
                      {test.timeSlot ? ` · ${test.timeSlot}` : ''}
                      {test.doctorId?.name ? ` · Dr. ${test.doctorId.name}` : ''}
                      {` · ₹${test.cost}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${LAB_STATUS_STYLES[test.status] || 'bg-gray-100 text-gray-700'}`}>
                      {LAB_STATUS_LABELS[test.status] || test.status}
                    </span>
                    {test.status === 'ordered' && (
                      <button
                        onClick={() => cancelLabTest(test._id)}
                        disabled={cancellingId === test._id}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {cancellingId === test._id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search tests, doctors..."
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
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Time</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 3 Months">Last 3 Months</option>
                <option value="Last 6 Months">Last 6 Months</option>
                <option value="Last Year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading lab results...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lab results found</h3>
            <p className="text-gray-500 mb-4">Upload your medical reports to see AI-extracted lab results</p>
            <a
              href="/patient/upload-report"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload Report
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResults.map((report) => (
              <div key={report._id} className="bg-white rounded-lg shadow-sm border">
                {/* Test Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start space-x-4 min-w-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">{report.reportTitle}</h3>
                        <p className="text-blue-600 font-medium">{report.reportType}</p>
                        
                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(report.testDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.aiProcessed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.aiProcessed ? 'Processed' : report.aiProcessingError ? 'Not extracted' : 'Processing'}
                      </span>
                      <a
                        href={report.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                {report.aiProcessed && report.summary && (
                  <div className="px-6 pt-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="font-medium text-blue-900 mb-2">AI Summary:</p>
                      <p className="text-blue-800 text-sm">{report.summary}</p>
                    </div>
                  </div>
                )}

                {/* Test Results - Metrics */}
                {report.aiProcessed && report.metrics && Object.keys(report.metrics).length > 0 && (
                  <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-green-600" />
                      Key Health Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(report.metrics).map(([key, value]) => {
                        // Determine icon and color based on metric type
                        const metricInfo = getMetricInfo(key);
                        return (
                          <div key={key} className={`p-4 ${metricInfo.bgColor} border-l-4 ${metricInfo.borderColor} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                  {metricInfo.label}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">{value}</p>
                              </div>
                              <div className={`p-2 ${metricInfo.iconBg} rounded-lg`}>
                                {metricInfo.icon}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Extracted Data - Organized by Categories */}
                {report.aiProcessed && report.extractedData && Object.keys(report.extractedData).length > 0 && (
                  <div className="px-6 pb-6">
                    <details className="group" open>
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold text-lg flex items-center py-3 border-b border-gray-200">
                        <FileText className="h-5 w-5 mr-2" />
                        <span>Detailed Report Information</span>
                        <svg className="w-5 h-5 ml-auto transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-6 space-y-6">
                        {/* Categorize data */}
                        {(() => {
                          const categorized = categorizeExtractedData(report.extractedData);
                          return Object.entries(categorized).map(([category, items]) => (
                            <div key={category} className="space-y-3">
                              <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wide flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                {category}
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {items.map(([key, value]) => (
                                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between items-start gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-gray-700 font-medium capitalize flex-1">
                                      {formatFieldName(key)}:
                                    </span>
                                    <span className="text-gray-900 font-semibold sm:ml-4 sm:text-right flex-1">
                                      {String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </details>
                  </div>
                )}

                {!report.aiProcessed && report.aiProcessingError && (
                  <div className="p-6">
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                      <p className="text-gray-700">We couldn&apos;t read the values from this report automatically.</p>
                      <p className="text-sm text-gray-500 mt-1">You can still open the original file with the download button.</p>
                    </div>
                  </div>
                )}

                {!report.aiProcessed && !report.aiProcessingError && (
                  <div className="p-6">
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">AI is extracting data from your report</p>
                      <p className="text-sm text-gray-400 mt-1">This usually takes 30-60 seconds</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}