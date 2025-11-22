'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavigationProps {
  showAuthButtons?: boolean;
  variant?: 'default' | 'dashboard';
}

export default function Navigation({ showAuthButtons = true, variant = 'default' }: NavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#about', label: 'About' },
    { href: '/#testimonials', label: 'Reviews' },
    { href: '/#contact', label: 'Contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.replace('/#', ''));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
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
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105 ${
                      isActive(link.href) ? 'text-blue-600' : ''
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </>
            )}
            
            {showAuthButtons && (
              <div className="flex items-center space-x-4">
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
                  {navLinks.map((link) => (
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}