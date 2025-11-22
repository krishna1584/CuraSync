'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { 
  Heart, 
  Stethoscope, 
  Calendar, 
  FileText, 
  Users, 
  Shield, 
  Clock, 
  Award,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Star,
  Zap,
  Globe,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: <Calendar className="h-10 w-10 text-white" />,
      title: "Smart Scheduling",
      description: "AI-powered appointment booking that finds the perfect time for you and your doctor.",
      gradient: "from-blue-500 to-cyan-500",
      delay: "animate-delay-100"
    },
    {
      icon: <FileText className="h-10 w-10 text-white" />,
      title: "Digital Health Records",
      description: "Secure, instant access to your complete medical history with advanced analytics.",
      gradient: "from-emerald-500 to-teal-500",
      delay: "animate-delay-200"
    },
    {
      icon: <Shield className="h-10 w-10 text-white" />,
      title: "Bank-Level Security",
      description: "Military-grade encryption keeps your sensitive health data completely protected.",
      gradient: "from-purple-500 to-indigo-500",
      delay: "animate-delay-300"
    },
    {
      icon: <Zap className="h-10 w-10 text-white" />,
      title: "Lightning Fast",
      description: "Get results instantly with our optimized platform built for speed and reliability.",
      gradient: "from-orange-500 to-red-500",
      delay: "animate-delay-400"
    },
    {
      icon: <Globe className="h-10 w-10 text-white" />,
      title: "Global Access",
      description: "Access your health information from anywhere in the world, anytime you need it.",
      gradient: "from-pink-500 to-rose-500",
      delay: "animate-delay-500"
    },
    {
      icon: <Award className="h-10 w-10 text-white" />,
      title: "Award Winning",
      description: "Recognized by healthcare professionals worldwide for excellence and innovation.",
      gradient: "from-violet-500 to-purple-500",
      delay: "animate-delay-600"
    }
  ];

  const stats = [
    { number: "50K+", label: "Happy Patients", icon: <Heart className="h-6 w-6" /> },
    { number: "1,200+", label: "Expert Doctors", icon: <Stethoscope className="h-6 w-6" /> },
    { number: "24/7", label: "Support Available", icon: <Clock className="h-6 w-6" /> },
    { number: "99.9%", label: "Uptime Guarantee", icon: <Shield className="h-6 w-6" /> }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Cardiologist",
      text: "CuraSync has revolutionized how I manage patient care. The interface is intuitive and the security is top-notch.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Patient",
      text: "Booking appointments and accessing my records has never been easier. This platform is a game-changer!",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Family Medicine",
      text: "The comprehensive features and seamless workflow have significantly improved our practice efficiency.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-left">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="h-6 w-6 text-yellow-400" />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  #1 Healthcare Platform
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
                <span className="text-gray-900">Your Health,</span>
                <br />
                <span className="gradient-text">Our Innovation</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed mb-10">
                Experience the future of healthcare with CuraSync&apos;s cutting-edge platform. 
                Connect with top doctors, manage records seamlessly, and take control of your health journey.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link 
                  href="/auth/signup" 
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center animate-glow"
                >
                  Start Your Journey
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/auth/login" 
                  className="group glass border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-bold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center justify-center"
                >
                  Sign In
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">HIPAA Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <span className="text-sm font-medium text-gray-600">24/7 Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <span className="text-sm font-medium text-gray-600">AI Powered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                  <span className="text-sm font-medium text-gray-600">Global Access</span>
                </div>
              </div>
            </div>

            <div className="relative animate-slide-right">
              <div className="relative">
                {/* Main hero card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 relative z-10 animate-float">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Health Dashboard</h3>
                      <p className="text-gray-500 text-sm">Live Health Monitoring</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-gray-700">Latest Checkup</span>
                      </div>
                      <span className="text-green-600 font-bold">Excellent</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <span className="font-medium text-gray-700">Next Appointment</span>
                      </div>
                      <span className="text-blue-600 font-bold">Tomorrow</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-purple-500" />
                        <span className="font-medium text-gray-700">Security Status</span>
                      </div>
                      <span className="text-purple-600 font-bold">Protected</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center shadow-lg animate-float" style={{animationDelay: '1s'}}>
                  <Star className="h-8 w-8 text-white" />
                </div>
                
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-float" style={{animationDelay: '2s'}}>
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards - Enhanced Design */}
      <section id="quick-access" className="py-32 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Choose Your Portal
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Secure, lightning-fast access designed for every healthcare role
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Patient Card */}
            <Link href="/auth/login?role=patient" className="group block animate-fade-up">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Patient Portal</h3>
                  <p className="text-white/90 mb-6 leading-relaxed">
                    Book appointments, access medical records, and track your health journey with ease.
                  </p>
                  <div className="flex items-center text-white group-hover:translate-x-2 transition-transform">
                    <span className="font-semibold">Get Started</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Doctor Card */}
            <Link href="/auth/login?role=doctor" className="group block animate-fade-up animate-delay-200">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Doctor Portal</h3>
                  <p className="text-white/90 mb-6 leading-relaxed">
                    Manage patients, consultations, and provide world-class healthcare services.
                  </p>
                  <div className="flex items-center text-white group-hover:translate-x-2 transition-transform">
                    <span className="font-semibold">Access Portal</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Admin Card */}
            <Link href="/auth/login?role=admin" className="group block animate-fade-up animate-delay-400">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Admin Portal</h3>
                  <p className="text-white/90 mb-6 leading-relaxed">
                    System management, analytics, and comprehensive administrative control.
                  </p>
                  <div className="flex items-center text-white group-hover:translate-x-2 transition-transform">
                    <span className="font-semibold">Manage System</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-up">
            <h2 className="text-5xl md:text-6xl font-bold gradient-text mb-6">
              Loved by Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what healthcare professionals and patients say about CuraSync
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 animate-fade-up animate-delay-${(index + 1) * 200}`}
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
                  &quot;{testimonial.text}&quot;
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className={`text-center animate-scale-in animate-delay-${(index + 1) * 100}`}>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-600 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fade-up">
            <h2 className="text-5xl md:text-6xl font-bold gradient-text mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience healthcare innovation with cutting-edge tools designed for the modern world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 animate-fade-up ${feature.delay} hover:-translate-y-2`}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Revolutionizing Healthcare Management
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                CuraSync is built on the foundation of modern technology and healthcare expertise. 
                Our platform bridges the gap between patients and healthcare providers, ensuring 
                seamless communication and efficient care delivery.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Email Verification System</h4>
                    <p className="text-gray-600">Advanced OTP-based email verification with secure token management</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Role-Based Access Control</h4>
                    <p className="text-gray-600">Granular permissions for patients, doctors, nurses, and administrators</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Comprehensive Lab Management</h4>
                    <p className="text-gray-600">Digital lab results with trend analysis and secure document storage</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Why Choose CuraSync?</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5" />
                  <span>Enterprise-grade security & HIPAA compliance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5" />
                  <span>Real-time updates & notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5" />
                  <span>Multi-platform accessibility</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5" />
                  <span>Certified healthcare professionals</span>
                </div>
              </div>

              <div className="mt-8">
                <Link 
                  href="/auth/signup" 
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Ready to transform your healthcare experience? Contact us today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Phone className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
              <p className="text-sm text-gray-500 mt-1">24/7 Emergency Support</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600">support@curasync.com</p>
              <p className="text-sm text-gray-500 mt-1">Response within 2 hours</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-600">123 Healthcare Ave</p>
              <p className="text-sm text-gray-500 mt-1">Medical District, NY 10001</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">CuraSync</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Transforming healthcare through innovative technology and compassionate care.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/auth/login" className="block text-gray-400 hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/auth/signup" className="block text-gray-400 hover:text-white transition-colors">
                  Sign Up
                </Link>
                <a href="#features" className="block text-gray-400 hover:text-white transition-colors">
                  Features
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Portals</h4>
              <div className="space-y-2">
                <Link href="/auth/login?role=patient" className="block text-gray-400 hover:text-white transition-colors">
                  Patient Portal
                </Link>
                <Link href="/auth/login?role=doctor" className="block text-gray-400 hover:text-white transition-colors">
                  Doctor Portal
                </Link>
                <Link href="/auth/login?role=admin" className="block text-gray-400 hover:text-white transition-colors">
                  Admin Portal
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <p className="text-gray-400">support@curasync.com</p>
                <p className="text-gray-400">+1 (555) 123-4567</p>
                <p className="text-gray-400">24/7 Emergency</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 CuraSync Hospital Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}