'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AuthShell from '@/components/AuthShell';
import { PasswordField, TextField } from '@/components/FormFields';
import { API_URL } from '@/lib/config';
import { setAuthToken, setUser } from '@/lib/auth';

const PORTALS = [
  { role: 'patient', label: 'Patient' },
  { role: 'doctor', label: 'Doctor' },
  { role: 'admin', label: 'Hospital staff' },
];

const HOME_BY_ROLE: Record<string, string> = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
  nurse: '/admin/dashboard',
  receptionist: '/admin/dashboard',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get('role');
  const role = PORTALS.some((portal) => portal.role === requested) ? (requested as string) : 'patient';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, role }),
      });
      const data = await response.json();

      if (data.success) {
        setAuthToken(data.data.token);
        setUser(data.data.user);
        toast.success('Signed in');
        router.push(HOME_BY_ROLE[data.data.user.role] || '/dashboard');
      } else if (data.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email first. Enter the code we sent you.');
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.data?.email || formData.email)}`);
      } else {
        toast.error(data.message || 'Sign in failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your CuraSync account.">
      <nav className="mb-6 grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1" aria-label="Choose your portal">
        {PORTALS.map((portal) => (
          <Link
            key={portal.role}
            href={`/auth/login?role=${portal.role}`}
            aria-current={portal.role === role ? 'page' : undefined}
            className={`rounded-md px-2 py-2 text-center text-sm font-medium transition-colors ${
              portal.role === role ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {portal.label}
          </Link>
        ))}
      </nav>

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com"
        />
        <div>
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <div className="mt-2 text-right text-sm">
            <Link href="/auth/forgot-password" className="text-link">Forgot your password?</Link>
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {role === 'patient' ? (
          <>New to CuraSync? <Link href="/auth/signup" className="text-link">Create an account</Link></>
        ) : (
          'Accounts for doctors and staff are created by your hospital administrator.'
        )}
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
