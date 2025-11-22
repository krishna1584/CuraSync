import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function SimpleNavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3 animate-slide-left">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl animate-glow">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">CuraSync</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 animate-slide-right">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105">
              Home
            </Link>
            <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105">
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 animate-glow"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
