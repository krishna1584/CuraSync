'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAuthToken, getUser } from '@/lib/auth';

const STAFF_ROLES = ['admin', 'nurse', 'receptionist'];

// Sends a signed-in user to their own dashboard, or to sign-in if they are not signed in.
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    let role: string | undefined;
    try {
      role = getAuthToken() ? getUser()?.role : undefined;
    } catch {
      role = undefined;
    }

    if (role === 'patient') router.replace('/patient/dashboard');
    else if (role === 'doctor') router.replace('/doctor/dashboard');
    else if (role && STAFF_ROLES.includes(role)) router.replace('/admin/dashboard');
    else router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
