'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, User as UserIcon, X, type LucideIcon } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { NotificationBell } from '@/components/NotificationBell';
import { getUser, logout } from '@/lib/auth';

export interface ShellLink {
  name: string;
  href: string;
  icon: LucideIcon;
}

const ACCENTS = {
  blue: {
    brand: 'text-blue-600',
    active: 'bg-blue-100 border-blue-500 text-blue-700',
    avatar: 'bg-blue-100 text-blue-600',
  },
  green: {
    brand: 'text-green-600',
    active: 'bg-green-100 border-green-500 text-green-700',
    avatar: 'bg-green-100 text-green-600',
  },
};

interface ShellConfig {
  navigation: ShellLink[];
  areaLabel: string;
  brandIcon: LucideIcon;
  accent?: keyof typeof ACCENTS;
}

interface AppShellProps extends ShellConfig {
  allowedRoles: string[];
  loginPortal: 'patient' | 'doctor' | 'admin';
  children: React.ReactNode;
}

function Shell({ navigation, areaLabel, brandIcon: BrandIcon, accent = 'blue', children }: ShellConfig & { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [person, setPerson] = useState<{ name: string; reference: string } | null>(null);
  const colors = ACCENTS[accent];

  useEffect(() => {
    // RoleGuard has just stored the verified user.
    const user = getUser() as (ReturnType<typeof getUser> & { patientId?: string; doctorId?: string; staffId?: string }) | null;
    if (user) setPerson({ name: user.name, reference: user.patientId || user.doctorId || user.staffId || '' });
  }, []);

  // Close the phone menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const links = (
    <nav className="mt-5 flex-1 space-y-1 px-2" aria-label={`${areaLabel} navigation`}>
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={`${active ? colors.active : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'} flex items-center rounded-md border-l-4 px-2 py-2.5 text-base font-medium transition-colors md:py-2 md:text-sm`}
          >
            <Icon className="mr-3 h-6 w-6 flex-shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="flex flex-shrink-0 items-center border-t border-gray-200 p-4">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colors.avatar}`}>
        <UserIcon className="h-6 w-6" />
      </div>
      <div className="ml-3 min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-700">{person?.name || ''}</p>
        <p className="truncate text-xs text-gray-500">{person?.reference || areaLabel}</p>
      </div>
      <button
        type="button"
        onClick={() => logout()}
        aria-label="Sign out"
        title="Sign out"
        className="ml-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );

  const brand = (
    <>
      <BrandIcon className={`h-8 w-8 flex-shrink-0 ${colors.brand}`} />
      <span className="ml-2 text-xl font-bold text-gray-900">CuraSync</span>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-100">
      {/* Phone menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fixed inset-0 bg-gray-600/75" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          {/* Narrower than the screen so the close button is always visible. */}
          <div className="relative flex w-[calc(100%-3.5rem)] max-w-xs flex-col bg-white">
            <div className="absolute right-0 top-2 -mr-12">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4 pt-5">
              <div className="flex flex-shrink-0 items-center px-4">{brand}</div>
              {links}
            </div>
            {account}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col md:bg-white md:shadow">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4 pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            {brand}
            <span className="ml-2 text-sm text-gray-500">{areaLabel}</span>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>
          {links}
        </div>
        {account}
      </div>

      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        {/* Phone header */}
        <div className="relative z-10 flex h-16 flex-shrink-0 bg-white shadow md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-between px-4">
            <div className="flex min-w-0 items-center">{brand}</div>
            <NotificationBell />
          </div>
        </div>

        <main className="relative flex-1 overflow-y-auto focus:outline-none">{children}</main>
      </div>
    </div>
  );
}

// Page frame for the patient, doctor and staff areas.
export default function AppShell({ allowedRoles, loginPortal, children, ...config }: AppShellProps) {
  return (
    <RoleGuard allowedRoles={allowedRoles} loginPortal={loginPortal}>
      <Shell {...config}>{children}</Shell>
    </RoleGuard>
  );
}
