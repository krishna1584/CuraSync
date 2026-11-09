'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '@/lib/config';

const inputClasses = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500';
const buttonClasses = 'w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed';

export default function ForgotPasswordPage() {
  const router = useRouter();
  // null while we ask the server whether reset by email is switched on.
  const [emailResetOn, setEmailResetOn] = useState<boolean | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/auth/options`)
      .then((response) => response.json())
      .then((result) => setEmailResetOn(Boolean(result?.data?.passwordResetByEmail)))
      .catch(() => setEmailResetOn(false));
  }, []);

  const post = async (path: string, body: object) => {
    const response = await fetch(`${API_URL}/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok && result.success, message: result.message as string | undefined };
  };

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { ok, message } = await post('forgot-password', { email });
      if (ok) {
        toast.success(message || 'Check your email for a reset code');
        setCodeSent(true);
      } else {
        toast.error(message || 'Could not send a reset code');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    try {
      const { ok, message } = await post('reset-password', { email, otp, newPassword });
      if (ok) {
        toast.success(message || 'Password changed');
        router.push('/auth/login');
      } else {
        toast.error(message || 'Could not change your password');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center" aria-label="CuraSync home">
          <Heart className="h-12 w-12 text-blue-600" />
        </Link>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">Forgot your password?</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {emailResetOn === null ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" aria-label="Loading" />
          ) : !emailResetOn ? (
            <p className="text-sm text-gray-600 text-center">
              Please ask your hospital administrator to set a new password for your account.
            </p>
          ) : !codeSent ? (
            <form onSubmit={requestCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
              </div>
              <button type="submit" disabled={busy} className={buttonClasses}>
                {busy ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitNewPassword} className="space-y-6">
              <p className="text-sm text-gray-600">Enter the 6-digit code sent to <span className="font-medium break-all">{email}</span>.</p>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Reset code</label>
                <input id="otp" type="text" inputMode="numeric" required maxLength={6} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className={inputClasses} />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New password</label>
                <input id="newPassword" type="password" required minLength={6} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} />
              </div>
              <button type="submit" disabled={busy || otp.length !== 6} className={buttonClasses}>
                {busy ? 'Saving…' : 'Change password'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm">
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
