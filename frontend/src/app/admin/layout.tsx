'use client';

import { BarChart3, Calendar, FileText, Heart, LayoutDashboard, Settings, Upload } from 'lucide-react';
import AppShell from '@/components/AppShell';

const ALLOWED_ROLES = ['admin', 'nurse', 'receptionist'];

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Book Appointment', href: '/admin/book-for-patient', icon: Calendar },
  { name: 'Upload Report', href: '/admin/upload-report', icon: Upload },
  { name: 'All Reports', href: '/admin/reports', icon: FileText },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell allowedRoles={ALLOWED_ROLES} loginPortal="admin" navigation={navigation} areaLabel="Admin" brandIcon={Heart}>
      {children}
    </AppShell>
  );
}
