'use client';

import { Calendar, ClipboardList, FileText, LayoutDashboard, Settings, Stethoscope, User, Users } from 'lucide-react';
import AppShell from '@/components/AppShell';

const ALLOWED_ROLES = ['doctor'];

const navigation = [
  { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { name: 'Appointments', href: '/doctor/appointments', icon: Calendar },
  { name: 'Patients', href: '/doctor/patients', icon: Users },
  { name: 'Prescriptions', href: '/doctor/prescriptions', icon: ClipboardList },
  { name: 'Medical Records', href: '/doctor/records', icon: FileText },
  { name: 'Profile', href: '/doctor/profile', icon: User },
  { name: 'Settings', href: '/doctor/settings', icon: Settings },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell allowedRoles={ALLOWED_ROLES} loginPortal="doctor" navigation={navigation} areaLabel="Doctor" brandIcon={Stethoscope} accent="green">
      {children}
    </AppShell>
  );
}
