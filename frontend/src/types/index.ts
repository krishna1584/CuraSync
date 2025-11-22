// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin' | 'receptionist';
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  profileImage?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Patient specific data
export interface Patient extends User {
  role: 'patient';
  patientId: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    validUntil: Date;
  };
}

// Doctor specific data
export interface Doctor extends User {
  role: 'doctor';
  doctorId: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string[];
  experience: number;
  consultationFee: number;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  department: string;
}

// Staff (Nurse, Receptionist, etc.)
export interface Staff extends User {
  role: 'nurse' | 'receptionist';
  staffId: string;
  department: string;
  shiftSchedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

// Appointment Types
export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  timeSlot: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'consultation' | 'follow-up' | 'emergency';
  reason: string;
  notes?: string;
  prescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Medical Record Types
export interface MedicalRecord {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: Date;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  prescription: {
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  labReports?: {
    testName: string;
    result: string;
    normalRange: string;
    date: Date;
    reportUrl?: string;
  }[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Test/Lab Types
export interface LabTest {
  _id: string;
  patientId: string;
  doctorId: string;
  testName: string;
  testType: 'blood' | 'urine' | 'imaging' | 'other';
  status: 'ordered' | 'sample-collected' | 'in-progress' | 'completed' | 'cancelled';
  orderDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  results?: {
    parameters: {
      name: string;
      value: string;
      normalRange: string;
      status: 'normal' | 'abnormal' | 'critical';
    }[];
    interpretation: string;
    reportUrl?: string;
  };
  cost: number;
  createdAt: Date;
  updatedAt: Date;
}

// Room/Bed Management
export interface Room {
  _id: string;
  roomNumber: string;
  type: 'general' | 'private' | 'icu' | 'emergency' | 'operation';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentPatientId?: string;
  floor: number;
  department: string;
  amenities: string[];
  dailyRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// Billing Types
export interface Bill {
  _id: string;
  patientId: string;
  billNumber: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category: 'consultation' | 'medicine' | 'test' | 'room' | 'procedure' | 'other';
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'partially-paid' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'insurance' | 'online';
  paidAmount: number;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory Types
export interface Medicine {
  _id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  unitPrice: number;
  category: string;
  prescriptionRequired: boolean;
  sideEffects?: string[];
  contraindications?: string[];
  storageConditions: string;
  createdAt: Date;
  updatedAt: Date;
}

// OTP and Authentication
export interface OTPRecord {
  _id: string;
  email: string;
  otp: string;
  type: 'email-verification' | 'password-reset' | 'login';
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingTests: number;
  availableRooms: number;
  revenue: {
    today: number;
    thisMonth: number;
    thisYear: number;
  };
}