'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Mail, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Email verified successfully!');
        router.push('/auth/login');
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type: 'email-verification' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('OTP sent successfully!');
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <Heart className="h-12 w-12 text-blue-600" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We&apos;ve sent a verification code to
        </p>
        <p className="text-center text-sm font-medium text-blue-600">
          {email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Email Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-center">
                Enter 6-digit verification code
              </label>
              <div className="mt-4">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="appearance-none block w-full px-3 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>

          {/* Resend Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the code?{' '}
              <button
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend code'}
              </button>
            </p>
          </div>

          {/* Security Note */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Security Notice</p>
                <p className="text-gray-600 mt-1">
                  For your security, this code will expire in 10 minutes. If you don&apos;t verify your email, 
                  you won&apos;t be able to access your account.
                </p>
              </div>
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}