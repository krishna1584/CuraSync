'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';
import { getUser, isAuthenticated, logout } from '@/lib/auth';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#about', label: 'How it works' },
  { href: '#portals', label: 'Portals' },
  { href: '#contact', label: 'Contact' },
];

const dashboardFor = (role?: string) => {
  if (role === 'patient') return '/patient/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  return '/admin/dashboard';
};

// Header for the public landing page.
export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState<string | undefined>();
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    setSignedIn(isAuthenticated());
    setRole(getUser()?.role);
  }, []);

  // Highlight the section currently on screen.
  useEffect(() => {
    const sections = NAV_LINKS
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
        else setActiveSection((current) => (current === entry.target.id ? '' : current));
      });
    }, { rootMargin: '-96px 0px -60% 0px' });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const account = signedIn ? (
    <>
      <Link href={dashboardFor(role)} onClick={closeMenu} className="btn btn-outline">Dashboard</Link>
      <button type="button" onClick={() => logout()} className="btn btn-primary">Sign out</button>
    </>
  ) : (
    <>
      <Link href="/auth/login" onClick={closeMenu} className="btn btn-outline">Sign in</Link>
      <Link href="/auth/signup" onClick={closeMenu} className="btn btn-primary">Get started</Link>
    </>
  );

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 border-b border-gray-200 ${menuOpen ? 'bg-white' : 'bg-white/90 backdrop-blur'}`} aria-label="Main">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeSection === link.href.slice(1) ? 'true' : undefined}
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${activeSection === link.href.slice(1) ? 'text-blue-600' : 'text-gray-600'}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">{account}</div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 px-4 pt-2 pb-4 shadow-lg md:hidden">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu} className="block rounded-lg px-3 py-3 font-medium text-gray-700 hover:bg-gray-50">
              {link.label}
            </a>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-3">{account}</div>
        </div>
      )}
    </nav>
  );
}
