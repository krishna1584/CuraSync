'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Temporary redirect component for demo purposes
// In a real app, this would check authentication status and redirect accordingly
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and get their role
    const userRole = localStorage.getItem('userRole');
    
    if (!userRole) {
      toast.error('Please log in first');
      router.push('/auth/login');
      return;
    }

    // Redirect based on role
    switch (userRole) {
      case 'patient':
        router.push('/patient/dashboard');
        break;
      case 'doctor':
        router.push('/doctor/dashboard');
        break;
      case 'admin':
        router.push('/admin/dashboard');
        break;
      default:
        toast.error('Invalid user role');
        router.push('/auth/login');
    }
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