'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAuthenticated, getUser, logout } from '@/lib/auth';

interface NavigationProps {
  showAuthButtons?: boolean;
  variant?: 'default' | 'dashboard';
}

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#about', label: 'About' },
  { href: '/#testimonials', label: 'Reviews' },
  { href: '/#contact', label: 'Contact' },
];

export default function Navigation({ showAuthButtons = true, variant = 'default' }: NavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    setIsAuth(isAuthenticated());
    const user = getUser();
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  // Highlight the section currently on screen (landing page only).
  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }
    const sections = NAV_LINKS
      .map((link) => document.getElementById(link.href.replace('/#', '')))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
        else setActiveSection((current) => (current === entry.target.id ? '' : current));
      });
    }, { rootMargin: '-96px 0px -60% 0px' });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (href: string) => activeSection === href.replace('/#', '');

  // Hospital staff (admin, nurse, receptionist) all use the admin area.
  const dashboardHref = userRole === 'patient'
    ? '/patient/dashboard'
    : userRole === 'doctor'
      ? '/doctor/dashboard'
      : '/admin/dashboard';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b border-white/20 ${isMobileMenuOpen ? 'bg-white shadow-lg' : 'glass'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 animate-slide-left">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl animate-glow">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">CuraSync</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 animate-slide-right">
            {variant === 'default' && (
              <>
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? 'true' : undefined}
                    className={`hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105 ${
                      isActive(link.href) ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </>
            )}
            
            {showAuthButtons && (
              <div className="flex items-center space-x-4">
                {isAuth ? (
                  <>
                    <Link 
                      href={dashboardHref} 
                      className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => logout()}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 animate-glow"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/auth/login" 
                      className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/auth/signup" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 animate-glow"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 animate-fade-up">
            <div className="flex flex-col space-y-4">
              {variant === 'default' && (
                <>
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`text-gray-700 hover:text-blue-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-blue-50 ${
                        isActive(link.href) ? 'text-blue-600 bg-blue-50' : ''
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </>
              )}
              
              {showAuthButtons && (
                <div className="flex flex-col space-y-3 px-4 pt-4 border-t border-gray-200">
                  {isAuth ? (
                    <>
                      <Link 
                        href={dashboardHref} 
                        className="text-center text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button 
                        onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-semibold text-center hover:shadow-lg transition-all duration-300"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/auth/login" 
                        className="text-center text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link 
                        href="/auth/signup" 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold text-center hover:shadow-lg transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}