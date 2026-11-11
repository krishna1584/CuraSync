'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AuthShell from '@/components/AuthShell';
import { API_URL } from '@/lib/config';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const post = async (path: string, body: object) => {
    const response = await fetch(`${API_URL}/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const data = await post('verify-email', { email, otp });
      if (data.success) {
        toast.success('Email verified');
        router.push('/auth/login');
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const data = await post('resend-otp', { email });
      if (data.success) {
        toast.success(data.message || 'A new code has been sent.');
      } else {
        toast.error(data.message || 'Could not send a new code');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={<>We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>. It expires in 10 minutes.</>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="otp" className="field-label">Verification code</label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="field-input text-center text-xl tracking-[0.4em]"
          />
        </div>
        <button type="submit" disabled={isLoading || otp.length !== 6} className="btn btn-primary w-full">
          {isLoading ? 'Verifying…' : 'Verify email'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Didn&apos;t get it?{' '}
        <button type="button" onClick={handleResendOtp} disabled={resendLoading} className="text-link disabled:opacity-50">
          {resendLoading ? 'Sending…' : 'Send a new code'}
        </button>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/auth/login" className="text-link">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
