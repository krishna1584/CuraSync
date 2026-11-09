'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';
import { getAuthToken, removeAuthToken, setUser } from '@/lib/auth';
import { useSocket } from '@/contexts/SocketContext';

const STAFF_ROLES = ['admin', 'nurse', 'receptionist'];

const homeForRole = (role?: string) => {
  if (role === 'patient') return '/patient/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  if (role && STAFF_ROLES.includes(role)) return '/admin/dashboard';
  return '/auth/login';
};

interface RoleGuardProps {
  allowedRoles: string[];
  loginPortal: 'patient' | 'doctor' | 'admin';
  children: React.ReactNode;
}

/**
 * Renders its children only after the server confirms the stored token belongs
 * to a user with one of `allowedRoles`. Signed-out users go to the login page;
 * signed-in users with another role go to their own dashboard.
 * The backend still enforces every permission; this keeps the UI consistent.
 */
export default function RoleGuard({ allowedRoles, loginPortal, children }: RoleGuardProps) {
  const router = useRouter();
  const { registerUser } = useSocket();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loginUrl = `/auth/login?role=${loginPortal}`;

    const check = async () => {
      const token = getAuthToken();
      if (!token) {
        router.replace(loginUrl);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          removeAuthToken();
          router.replace(loginUrl);
          return;
        }

        const data = await response.json();
        const user = data?.data?.user;
        if (!user) {
          removeAuthToken();
          router.replace(loginUrl);
          return;
        }

        setUser(user);

        if (!allowedRoles.includes(user.role)) {
          router.replace(homeForRole(user.role));
          return;
        }

        if (!cancelled) {
          setAuthorized(true);
          // Receive live notifications on every page of this area, not just a few.
          registerUser({ userId: user._id, role: user.role, name: user.name });
        }
      } catch {
        // Network failure: send the user to log in again rather than show protected UI.
        router.replace(loginUrl);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [allowedRoles, loginPortal, router, registerUser]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-label="Checking access" />
      </div>
    );
  }

  return <>{children}</>;
}
