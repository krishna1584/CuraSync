'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AuthShell from '@/components/AuthShell';
import { PasswordField, TextField } from '@/components/FormFields';
import { API_URL } from '@/lib/config';

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

  const subtitle = emailResetOn === false
    ? 'Please ask your hospital administrator to set a new password for your account.'
    : emailResetOn && codeSent
      ? `Enter the 6-digit code sent to ${email}.`
      : emailResetOn
        ? 'Enter your email and we’ll send you a reset code.'
        : undefined;

  return (
    <AuthShell title="Reset your password" subtitle={subtitle}>
      {emailResetOn && !codeSent && (
        <form onSubmit={requestCode} className="space-y-5">
          <TextField id="email" label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
      )}

      {emailResetOn && codeSent && (
        <form onSubmit={submitNewPassword} className="space-y-5">
          <TextField id="otp" label="Reset code" type="text" inputMode="numeric" required maxLength={6} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
          <PasswordField id="newPassword" label="New password" required minLength={6} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button type="submit" disabled={busy || otp.length !== 6} className="btn btn-primary w-full">
            {busy ? 'Saving…' : 'Change password'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="text-link">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
