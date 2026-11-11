'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AuthShell from '@/components/AuthShell';
import { PasswordField, TextField } from '@/components/FormFields';
import { API_URL } from '@/lib/config';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'patient';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const update = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((current) => ({ ...current, [field]: e.target.value }));

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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'patient',
        }),
      });
      const data = await response.json();

      if (data.success) {
        // If a verification code was emailed, confirm it now; otherwise go straight to sign in.
        if (data.data?.emailSent) {
          toast.success('Account created. Check your email for a verification code.');
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
        } else {
          toast.success('Account created. You can now sign in.');
          router.push('/auth/login?role=patient');
        }
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Only patients create their own accounts.
  if (role !== 'patient') {
    return (
      <AuthShell
        title="Accounts for doctors and staff"
        subtitle="Doctor and hospital staff accounts are created by your hospital administrator. Please contact them for your login details."
      >
        <div className="space-y-3">
          <Link href={`/auth/login?role=${role === 'doctor' ? 'doctor' : 'admin'}`} className="btn btn-primary w-full">
            Go to sign in
          </Link>
          <Link href="/auth/signup" className="btn btn-outline w-full">
            I&apos;m a patient
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Register as a patient to book care and manage your records.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField id="name" label="Full name" type="text" autoComplete="name" required value={formData.name} onChange={update('name')} />
        <TextField id="email" label="Email" type="email" autoComplete="email" required value={formData.email} onChange={update('email')} placeholder="you@example.com" />
        <TextField id="phone" label="Phone" hint="(optional)" type="tel" autoComplete="tel" value={formData.phone} onChange={update('phone')} />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField id="password" label="Password" autoComplete="new-password" required minLength={6} value={formData.password} onChange={update('password')} placeholder="At least 6 characters" />
          <PasswordField id="confirmPassword" label="Confirm password" autoComplete="new-password" required value={formData.confirmPassword} onChange={update('confirmPassword')} />
        </div>
        <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already registered? <Link href="/auth/login?role=patient" className="text-link">Sign in</Link>
      </p>
      <p className="mt-2 text-center text-sm text-gray-500">
        Doctors and staff get their accounts from the hospital administrator.
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
