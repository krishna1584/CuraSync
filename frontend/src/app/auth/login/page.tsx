'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { API_URL } from '@/lib/config';
import { setAuthToken, setUser } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'patient';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'doctor':
        return { 
          title: 'Doctor Login', 
          color: 'green', 
          bgColor: 'bg-green-50',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          gradientBg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100'
        };
      case 'admin':
        return { 
          title: 'Hospital Admin Login', 
          color: 'purple',
          bgColor: 'bg-purple-50',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
          gradientBg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100'
        };
      default:
        return { 
          title: 'Patient Login', 
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
    setIsLoading(true);

    try {
      console.log('🔐 Attempting login to:', `${API_URL}/auth/login`);
      console.log('📧 Email:', formData.email);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies in cross-origin requests
        body: JSON.stringify(formData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        // Store token and user in localStorage using auth utilities
        setAuthToken(data.data.token);
        setUser(data.data.user);
        
        toast.success('Login successful!');
        
        // Redirect based on role
        switch (data.data.user.role) {
          case 'patient':
            router.push('/patient/dashboard');
            break;
          case 'doctor':
            router.push('/doctor/dashboard');
            break;
          case 'admin':
          case 'nurse':
          case 'receptionist':
            router.push('/admin/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        console.error('❌ Login failed:', data.message);
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Network error:', error);
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
      
      <div className="flex flex-col justify-center py-32 sm:px-6 lg:px-8 relative">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl animate-glow">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-center text-4xl font-bold gradient-text mb-4">
            {roleInfo.title}
          </h2>
          <p className="text-center text-lg text-gray-600">
            Access your CuraSync account
          </p>
        </div>

        <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 backdrop-blur-lg py-12 px-8 shadow-2xl rounded-3xl border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full px-4 py-4 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="appearance-none block w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-6 w-6 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link 
                    href="/auth/forgot-password" 
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-glow"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to CuraSync?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/auth/signup?role=${role}`}
                className={`w-full flex justify-center py-2 px-4 border border-${roleInfo.color}-600 rounded-md shadow-sm text-sm font-medium text-${roleInfo.color}-600 bg-white hover:bg-${roleInfo.color}-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${roleInfo.color}-500`}
              >
                Create new account
              </Link>
            </div>
          </div>

          {/* Role switcher */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">Looking for a different portal?</p>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/auth/login?role=patient"
                className={`text-xs py-2 px-3 rounded ${
                  role === 'patient' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Patient
              </Link>
              <Link
                href="/auth/login?role=doctor"
                className={`text-xs py-2 px-3 rounded ${
                  role === 'doctor' 
                    ? 'bg-green-100 text-green-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Doctor
              </Link>
              <Link
                href="/auth/login?role=admin"
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}