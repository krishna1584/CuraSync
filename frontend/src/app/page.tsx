import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Mail,
  MapPin,
  Pill,
  ShieldCheck,
  Stethoscope,
  TestTube,
  User,
} from 'lucide-react';
import Logo from '@/components/Logo';
import Navigation from '@/components/Navigation';

const FEATURES = [
  { icon: Calendar, title: 'Appointments', text: 'See each doctor’s open times and book a slot that is actually free.' },
  { icon: FileText, title: 'Medical reports', text: 'Upload reports as PDF or image. AI reads the key values so they’re easy to review.' },
  { icon: Pill, title: 'Prescriptions', text: 'Doctors write prescriptions online and patients can see them straight away.' },
  { icon: TestTube, title: 'Lab tests', text: 'Book tests, choose a date and follow each test’s status.' },
  { icon: Bell, title: 'Live alerts', text: 'Get notified when an appointment changes or a report is ready.' },
  { icon: ShieldCheck, title: 'Private by role', text: 'Patients, doctors and staff each see only what their role allows.' },
];

const STEPS = [
  { title: 'Create your account', text: 'Patients register in a minute. Doctors and staff are added by the hospital admin.' },
  { title: 'Book your care', text: 'Choose a doctor and time, or book the lab tests you need.' },
  { title: 'Keep it all together', text: 'Reports, prescriptions and appointments stay in one place for you and your doctor.' },
];

const PORTALS = [
  { role: 'patient', icon: User, title: 'Patients', text: 'Book appointments, upload reports and view prescriptions.' },
  { role: 'doctor', icon: Stethoscope, title: 'Doctors', text: 'Manage your schedule, review reports and prescribe.' },
  { role: 'admin', icon: Building2, title: 'Hospital staff', text: 'Book for patients, manage accounts and see activity.' },
];

const PREVIEW = [
  { icon: Calendar, label: 'Next appointment', value: 'Monday, 10:30' },
  { icon: FileText, label: 'Blood test report', value: 'Values ready' },
  { icon: Pill, label: 'Prescription', value: 'Active' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="px-4 pt-28 pb-16 sm:px-6 md:pt-36 md:pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-gray-900 md:text-5xl">
              Your hospital care, organised in one place.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
              CuraSync connects patients, doctors and hospital staff, from booking an appointment to reviewing the report.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="btn btn-primary h-12 px-6">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/auth/login" className="btn btn-outline h-12 px-6">Sign in</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6" aria-hidden="true">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Your dashboard</p>
              <ul className="mt-4 divide-y divide-gray-100">
                {PREVIEW.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-center justify-between gap-4 py-3.5">
                    <span className="flex items-center gap-3 text-gray-700">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      {label}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 bg-gray-50 px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Everything in one system</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-white p-6">
                <Icon className="h-6 w-6 text-blue-600" />
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map(({ title, text }) => (
              <li key={title}>
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="portals" className="border-t border-gray-100 bg-gray-50 px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Choose your portal</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PORTALS.map(({ role, icon: Icon, title, text }) => (
              <Link key={role} href={`/auth/login?role=${role}`} className="group rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-blue-600">
                <Icon className="h-6 w-6 text-blue-600" />
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
                  Sign in <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Get in touch</h2>
          <div className="mt-8 flex flex-col gap-4 text-gray-700 sm:flex-row sm:gap-12">
            <a href="mailto:krishnaydv1584@gmail.com" className="flex items-center gap-3 break-all hover:text-blue-600">
              <Mail className="h-5 w-5 flex-shrink-0 text-blue-600" />
              krishnaydv1584@gmail.com
            </a>
            <p className="flex items-center gap-3">
              <MapPin className="h-5 w-5 flex-shrink-0 text-blue-600" />
              Panchkula, India 160102
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} CuraSync Hospital Management System</p>
        </div>
      </footer>
    </div>
  );
}
