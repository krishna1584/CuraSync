'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Eye, EyeOff, User, Mail, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { API_URL } from '@/lib/config';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'patient';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialization: '', // For doctors
    licenseNumber: '', // For doctors
    department: '' // For staff
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'doctor':
        return { 
          title: 'Doctor Registration', 
          color: 'green', 
          bgColor: 'bg-green-50',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          gradientBg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100'
        };
      case 'admin':
        return { 
          title: 'Hospital Admin Registration', 
          color: 'purple',
          bgColor: 'bg-purple-50',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
          gradientBg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100'
        };
      default:
        return { 
          title: 'Patient Registration', 
          color: 'blue',
          bgColor: 'bg-blue-50',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          gradientBg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-100'
        };
    }
  };

  const roleInfo = getRoleInfo(role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          role
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Registration successful! You can now login with your credentials.');
        // COMMENTED OUT EMAIL VERIFICATION - Redirect to login instead
        router.push('/auth/login');
        // router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${roleInfo.gradientBg} relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>
      
      <Navigation showAuthButtons={false} />
      
      <div className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl animate-glow">
                <Heart className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold gradient-text mb-4">
              {roleInfo.title}
            </h2>
            <p className="text-lg text-gray-600">
              Join CuraSync for better healthcare management
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg py-8 px-6 shadow-2xl rounded-3xl border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1 relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
                <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
                />
                <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Role-specific fields */}
            {role === 'doctor' && (
              <>
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                    Specialization *
                  </label>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Cardiology, Pediatrics"
                  />
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                    Medical License Number *
                  </label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your license number"
                  />
                </div>
              </>
            )}

            {(role === 'admin' || role === 'nurse' || role === 'receptionist') && (
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your department"
                />
              </div>
            )}

            {/* Password fields */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Create a password (min. 6 characters)"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${roleInfo.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${roleInfo.color}-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href={`/auth/login?role=${role}`} 
                className={`font-medium text-${roleInfo.color}-600 hover:text-${roleInfo.color}-500`}
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Role switcher */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">Registering for a different role?</p>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/auth/signup?role=patient"
                className={`text-xs py-2 px-3 rounded ${
                  role === 'patient' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Patient
              </Link>
              <Link
                href="/auth/signup?role=doctor"
                className={`text-xs py-2 px-3 rounded ${
                  role === 'doctor' 
                    ? 'bg-green-100 text-green-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Doctor
              </Link>
              <Link
                href="/auth/signup?role=admin"
                className={`text-xs py-2 px-3 rounded ${
                  role === 'admin' 
                    ? 'bg-purple-100 text-purple-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Hospital
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}