'use client';

import { Calendar, FileText, Heart, LayoutDashboard, Pill, Settings, TestTube, User } from 'lucide-react';
import AppShell from '@/components/AppShell';

const ALLOWED_ROLES = ['patient'];

const navigation = [
  { name: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { name: 'Appointments', href: '/patient/appointments', icon: Calendar },
  { name: 'Upload Report', href: '/patient/upload-report', icon: FileText },
  { name: 'Prescriptions', href: '/patient/prescriptions', icon: Pill },
  { name: 'Medical Records', href: '/patient/records', icon: FileText },
  { name: 'Lab Results', href: '/patient/lab-results', icon: TestTube },
  { name: 'Profile', href: '/patient/profile', icon: User },
  { name: 'Settings', href: '/patient/settings', icon: Settings },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell allowedRoles={ALLOWED_ROLES} loginPortal="patient" navigation={navigation} areaLabel="Patient" brandIcon={Heart}>
      {children}
    </AppShell>
  );
}
