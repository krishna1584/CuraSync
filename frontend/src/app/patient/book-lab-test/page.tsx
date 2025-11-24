'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Search,
  ArrowLeft,
  IndianRupee
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';

interface LabTest {
  id: string;
  name: string;
  category: string;
  code: string;
  description: string;
  price: number;
  duration: string;
  preparationRequired: boolean;
  fastingRequired: boolean;
  sampleType: string;
}

const labTests: LabTest[] = [
  // Blood Tests
  { id: '1', name: 'Complete Blood Count (CBC)', category: 'Blood Tests', code: 'CBC001', description: 'Comprehensive blood analysis including RBC, WBC, platelets', price: 400, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '2', name: 'Blood Glucose (Fasting)', category: 'Diabetes Tests', code: 'GLU001', description: 'Measures blood sugar levels after fasting', price: 200, duration: '2-4 hours', preparationRequired: true, fastingRequired: true, sampleType: 'Blood' },
  { id: '3', name: 'HbA1c (Glycated Hemoglobin)', category: 'Diabetes Tests', code: 'HBA001', description: 'Average blood sugar over 2-3 months', price: 600, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Lipid Profile
  { id: '4', name: 'Lipid Profile', category: 'Lipid Profile', code: 'LIP001', description: 'Cholesterol, HDL, LDL, Triglycerides', price: 800, duration: '4-6 hours', preparationRequired: true, fastingRequired: true, sampleType: 'Blood' },
  { id: '5', name: 'Total Cholesterol', category: 'Lipid Profile', code: 'CHO001', description: 'Total cholesterol levels in blood', price: 300, duration: '2-4 hours', preparationRequired: true, fastingRequired: true, sampleType: 'Blood' },
  
  // Liver Function Tests
  { id: '6', name: 'Liver Function Test (LFT)', category: 'Liver Function Tests', code: 'LFT001', description: 'Complete liver enzyme panel', price: 900, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '7', name: 'SGPT/ALT', category: 'Liver Function Tests', code: 'ALT001', description: 'Alanine aminotransferase enzyme test', price: 250, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '8', name: 'SGOT/AST', category: 'Liver Function Tests', code: 'AST001', description: 'Aspartate aminotransferase enzyme test', price: 250, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Kidney Function Tests
  { id: '9', name: 'Kidney Function Test (KFT)', category: 'Kidney Function Tests', code: 'KFT001', description: 'Complete kidney function assessment', price: 700, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '10', name: 'Serum Creatinine', category: 'Kidney Function Tests', code: 'CRE001', description: 'Kidney function marker', price: 300, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '11', name: 'Blood Urea Nitrogen (BUN)', category: 'Kidney Function Tests', code: 'BUN001', description: 'Kidney function and protein metabolism', price: 250, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Thyroid Tests
  { id: '12', name: 'Thyroid Function Test (TFT)', category: 'Thyroid Tests', code: 'TFT001', description: 'TSH, T3, T4 complete panel', price: 1200, duration: '6-8 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '13', name: 'TSH (Thyroid Stimulating Hormone)', category: 'Thyroid Tests', code: 'TSH001', description: 'Primary thyroid function marker', price: 400, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '14', name: 'T3 (Triiodothyronine)', category: 'Thyroid Tests', code: 'T3001', description: 'Active thyroid hormone', price: 450, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '15', name: 'T4 (Thyroxine)', category: 'Thyroid Tests', code: 'T4001', description: 'Main thyroid hormone', price: 450, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Cardiac Tests
  { id: '16', name: 'ECG (Electrocardiogram)', category: 'Cardiac Tests', code: 'ECG001', description: 'Heart rhythm and electrical activity', price: 500, duration: '30 minutes', preparationRequired: false, fastingRequired: false, sampleType: 'None' },
  { id: '17', name: 'Troponin I', category: 'Cardiac Tests', code: 'TRP001', description: 'Heart attack marker', price: 800, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '18', name: 'CK-MB', category: 'Cardiac Tests', code: 'CKMB001', description: 'Heart muscle enzyme', price: 600, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Urine Tests
  { id: '19', name: 'Urine Routine & Microscopy', category: 'Urine Tests', code: 'URI001', description: 'Complete urine analysis', price: 300, duration: '2-4 hours', preparationRequired: true, fastingRequired: false, sampleType: 'Urine' },
  { id: '20', name: 'Urine Culture & Sensitivity', category: 'Urine Tests', code: 'UCS001', description: 'Bacterial infection and antibiotic sensitivity', price: 600, duration: '24-48 hours', preparationRequired: true, fastingRequired: false, sampleType: 'Urine' },
  
  // Imaging Tests
  { id: '21', name: 'Chest X-Ray', category: 'Imaging Tests', code: 'CXR001', description: 'Chest and lung examination', price: 800, duration: '30 minutes', preparationRequired: false, fastingRequired: false, sampleType: 'None' },
  { id: '22', name: 'Abdominal Ultrasound', category: 'Imaging Tests', code: 'USG001', description: 'Abdominal organs examination', price: 1500, duration: '30-45 minutes', preparationRequired: true, fastingRequired: true, sampleType: 'None' },
  { id: '23', name: 'CT Scan (Head)', category: 'Imaging Tests', code: 'CT001', description: 'Detailed brain imaging', price: 4000, duration: '30 minutes', preparationRequired: false, fastingRequired: false, sampleType: 'None' },
  
  // Vitamin & Mineral Tests
  { id: '24', name: 'Vitamin D (25-OH)', category: 'Vitamin & Mineral Tests', code: 'VD001', description: 'Vitamin D deficiency screening', price: 1000, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '25', name: 'Vitamin B12', category: 'Vitamin & Mineral Tests', code: 'VB12001', description: 'B12 deficiency screening', price: 800, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '26', name: 'Iron Studies', category: 'Vitamin & Mineral Tests', code: 'IRN001', description: 'Iron, TIBC, Ferritin panel', price: 1200, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Infection Tests
  { id: '27', name: 'HIV 1 & 2', category: 'Infection Tests', code: 'HIV001', description: 'HIV screening test', price: 600, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '28', name: 'Hepatitis B Surface Antigen', category: 'Infection Tests', code: 'HBS001', description: 'Hepatitis B screening', price: 400, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '29', name: 'Hepatitis C Antibody', category: 'Infection Tests', code: 'HCV001', description: 'Hepatitis C screening', price: 800, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' }
];

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function BookLabTestPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [booking, setBooking] = useState(false);

  const categories = ['All', ...Array.from(new Set(labTests.map(test => test.category)))];
  
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTests = labTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleTestSelection = (test: LabTest) => {
    setSelectedTests(prev => {
      const isSelected = prev.find(t => t.id === test.id);
      if (isSelected) {
        return prev.filter(t => t.id !== test.id);
      } else {
        return [...prev, test];
      }
    });
  };

  const getTotalCost = () => {
    return selectedTests.reduce((total, test) => total + test.price, 0);
  };

  const handleBookTests = async () => {
    if (selectedTests.length === 0 || !selectedDate || !selectedTime) {
      toast.error('Please select tests, date, and time');
      return;
    }

    if (!user) {
      toast.error('Please login to book tests');
      return;
    }

    setBooking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/lab-tests/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: user._id,
          tests: selectedTests.map(test => ({
            testName: test.name,
            testCategory: test.category,
            testCode: test.code,
            cost: test.price
          })),
          scheduledDate: selectedDate,
          timeSlot: selectedTime
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Lab tests booked successfully!');
        router.push('/patient/lab-results');
      } else {
        toast.error(data.message || 'Failed to book tests');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/patient/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Book Lab Tests</h1>
          <p className="text-gray-600 mt-2">Select from our comprehensive range of diagnostic tests</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters & Search */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Tests</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or code..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Selected Tests Summary */}
              {selectedTests.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Tests ({selectedTests.length})</h4>
                  <div className="space-y-1 text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {selectedTests.map(test => (
                      <div key={test.id} className="flex justify-between">
                        <span className="truncate">{test.name}</span>
                        <span>₹{test.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>Total:</span>
                      <span>₹{getTotalCost()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Proceed to Book
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tests List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Available Tests ({filteredTests.length})</h3>
              </div>
              
              <div className="divide-y max-h-96 overflow-y-auto">
                {filteredTests.map(test => (
                  <div key={test.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedTests.some(t => t.id === test.id)}
                            onChange={() => toggleTestSelection(test)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <h4 className="font-medium text-gray-900">{test.name}</h4>
                            <p className="text-sm text-blue-600 mb-1">{test.category} • {test.code}</p>
                            <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                            
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                              <span>Duration: {test.duration}</span>
                              <span>Sample: {test.sampleType}</span>
                              {test.fastingRequired && <span className="text-orange-600">Fasting Required</span>}
                              {test.preparationRequired && <span className="text-blue-600">Preparation Required</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="flex items-center text-lg font-semibold text-gray-900">
                          <IndianRupee className="h-4 w-4" />
                          {test.price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Schedule Your Tests</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Select Time
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose time slot</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Booking Summary</h4>
                  <div className="text-sm space-y-1">
                    <p>Tests: {selectedTests.length}</p>
                    <p>Total Cost: ₹{getTotalCost()}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookTests}
                    disabled={!selectedDate || !selectedTime || booking}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {booking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}