'use client';

import { useState } from 'react';
import { 
  TestTube, 
  Download, 
  Search,
  Filter,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function LabResults() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');

  const categories = [
    'All Tests',
    'Blood Tests',
    'Urine Tests',
    'Lipid Profile',
    'Liver Function',
    'Kidney Function',
    'Diabetes Panel',
    'Thyroid Function'
  ];

  const timeframes = [
    'All Time',
    'Last 30 Days',
    'Last 3 Months',
    'Last 6 Months',
    'Last Year'
  ];

  const labResults = [
    {
      id: 1,
      testName: 'Complete Blood Count (CBC)',
      category: 'Blood Tests',
      date: '2024-01-15',
      doctor: 'Dr. Sarah Johnson',
      status: 'completed',
      results: [
        { parameter: 'Hemoglobin', value: '14.5', unit: 'g/dL', range: '12.0-15.5', status: 'normal' },
        { parameter: 'White Blood Cells', value: '7.2', unit: '10³/μL', range: '4.0-10.0', status: 'normal' },
        { parameter: 'Platelets', value: '180', unit: '10³/μL', range: '150-450', status: 'normal' },
        { parameter: 'Hematocrit', value: '42.1', unit: '%', range: '36.0-46.0', status: 'normal' }
      ]
    },
    {
      id: 2,
      testName: 'Lipid Profile',
      category: 'Lipid Profile',
      date: '2024-01-10',
      doctor: 'Dr. Michael Chen',
      status: 'completed',
      results: [
        { parameter: 'Total Cholesterol', value: '220', unit: 'mg/dL', range: '<200', status: 'high' },
        { parameter: 'LDL Cholesterol', value: '145', unit: 'mg/dL', range: '<100', status: 'high' },
        { parameter: 'HDL Cholesterol', value: '45', unit: 'mg/dL', range: '>40', status: 'normal' },
        { parameter: 'Triglycerides', value: '180', unit: 'mg/dL', range: '<150', status: 'high' }
      ]
    },
    {
      id: 3,
      testName: 'Liver Function Tests',
      category: 'Liver Function',
      date: '2024-01-08',
      doctor: 'Dr. Emily Rodriguez',
      status: 'completed',
      results: [
        { parameter: 'ALT', value: '35', unit: 'U/L', range: '7-56', status: 'normal' },
        { parameter: 'AST', value: '28', unit: 'U/L', range: '10-40', status: 'normal' },
        { parameter: 'Bilirubin Total', value: '1.2', unit: 'mg/dL', range: '0.3-1.2', status: 'normal' },
        { parameter: 'Alkaline Phosphatase', value: '85', unit: 'U/L', range: '44-147', status: 'normal' }
      ]
    },
    {
      id: 4,
      testName: 'Fasting Blood Glucose',
      category: 'Diabetes Panel',
      date: '2024-01-05',
      doctor: 'Dr. James Wilson',
      status: 'completed',
      results: [
        { parameter: 'Glucose', value: '95', unit: 'mg/dL', range: '70-100', status: 'normal' },
        { parameter: 'HbA1c', value: '5.8', unit: '%', range: '<5.7', status: 'normal' }
      ]
    },
    {
      id: 5,
      testName: 'Vitamin D Test',
      category: 'Blood Tests',
      date: '2024-01-03',
      doctor: 'Dr. Sarah Johnson',
      status: 'pending',
      results: []
    }
  ];

  const filteredResults = labResults.filter(result => {
    const matchesSearch = result.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All Tests' ||
                           result.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'high':
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'high':
        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <TestTube className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lab Results</h1>
          <p className="text-gray-600 mt-2">View and track your laboratory test results</p>
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
                {timeframes.map((timeframe) => (
                  <option key={timeframe} value={timeframe}>
                    {timeframe}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lab Results */}
        <div className="space-y-6">
          {filteredResults.map((test) => (
            <div key={test.id} className="bg-white rounded-lg shadow-sm border">
              {/* Test Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getTestStatusIcon(test.status)}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{test.testName}</h3>
                      <p className="text-blue-600 font-medium">{test.category}</p>
                      
                      <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(test.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{test.doctor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      test.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {test.status}
                    </span>
                    {test.status === 'completed' && (
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Download className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Test Results */}
              {test.status === 'completed' && test.results.length > 0 && (
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {test.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <p className="font-medium text-gray-900">{result.parameter}</p>
                            <p className="text-sm text-gray-600">Reference: {result.range}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {result.value}
                            </span>
                            <span className="text-sm text-gray-600">{result.unit}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {test.status === 'pending' && (
                <div className="p-6">
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Results are being processed</p>
                    <p className="text-sm text-gray-400 mt-1">You will be notified when ready</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lab results found</h3>
            <p className="text-gray-500">Try adjusting your search terms or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
}