import Link from 'next/link';
import { ArrowRight, Bell, Mail, MapPin, Pill, ShieldCheck, TestTube } from 'lucide-react';
import Logo from '@/components/Logo';
import Navigation from '@/components/Navigation';
import Reveal from '@/components/landing/Reveal';
import SpotlightCard from '@/components/landing/SpotlightCard';

// Sample data that only illustrates the cards; nothing here is a real record.
const SLOTS = [
  { time: '09:00', free: true },
  { time: '09:30', free: false },
  { time: '10:00', free: true },
  { time: '10:30', free: true },
  { time: '11:00', free: false },
  { time: '11:30', free: true },
  { time: '14:00', free: false },
  { time: '14:30', free: true },
];

const ALERTS = [
  { title: 'New booking', detail: 'Monday 10:30' },
  { title: 'Report ready', detail: 'Blood test' },
  { title: 'Lab test', detail: 'Sample collected' },
];

const REPORT_VALUES = [
  { label: 'Hemoglobin', value: '13.5 g/dL', width: '70%' },
  { label: 'Total cholesterol', value: '190 mg/dL', width: '58%' },
  { label: 'TSH', value: '2.1 mIU/L', width: '42%' },
];

const LAB_STEPS = ['Ordered', 'Sample collected', 'In progress', 'Completed'];
const STEP_DOT = ['bg-blue-600', 'anim-step-2 bg-gray-200', 'anim-step-3 bg-gray-200', 'anim-step-4 bg-gray-200'];

const ROLES = [
  { role: 'Patient', scope: 'own records only' },
  { role: 'Doctor', scope: 'their own patients' },
  { role: 'Staff', scope: 'the whole hospital' },
];

const STEPS = [
  { title: 'Create your account', text: 'Patients register in a minute. Doctors and staff are added by the hospital admin.' },
  { title: 'Book your care', text: 'Choose a doctor and time, or book the lab tests you need.' },
  { title: 'Keep it all together', text: 'Reports, prescriptions and appointments stay in one place for you and your doctor.' },
];

const PORTALS = [
  { role: 'patient', title: 'Patients', text: 'Book appointments, upload reports and view prescriptions.' },
  { role: 'doctor', title: 'Doctors', text: 'Manage your schedule, review reports and prescribe.' },
  { role: 'admin', title: 'Hospital staff', text: 'Book for patients, manage accounts and see activity.' },
];

const eyebrow = 'text-[13px] font-semibold tracking-[0.08em] text-blue-600 uppercase';
const sectionTitle = 'mt-2.5 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl';
const card = 'rounded-3xl border border-gray-200 bg-white p-6 sm:p-8';
const iconTile = 'flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600';

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navigation />

      <section className="hero-dots px-4 pt-28 pb-20 sm:px-6 md:pt-36 md:pb-24">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-14">
          <div className="anim-rise min-w-0 flex-[1_1_480px]">
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Your hospital care, organised{' '}
              <span className="relative isolate inline-block text-blue-600">
                in one place.
                <span className="anim-underline absolute inset-x-0 bottom-0.5 -z-10 h-1.5 rounded-full bg-blue-200" aria-hidden="true" />
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
              CuraSync connects patients, doctors and hospital staff, from booking an appointment to reviewing the report.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="btn btn-primary h-12 px-6 shadow-lg shadow-blue-600/30">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/auth/login" className="btn btn-outline h-12 px-6">Sign in</Link>
            </div>
          </div>

          <HeroPreview />
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className={eyebrow}>Features</p>
            <h2 className={sectionTitle}>Everything in one system</h2>
          </Reveal>

          <div className="mt-10 flex flex-wrap gap-4">
            <Reveal className="flex flex-[2_1_560px]">
              <SpotlightCard className={`${card} flex w-full flex-col gap-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={eyebrow}>Appointments</p>
                    <h3 className="mt-2.5 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Only free slots. No double bookings.</h3>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[13px] font-semibold text-blue-700">Monday</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm font-medium sm:gap-2.5 sm:text-[15px]" aria-hidden="true">
                  {SLOTS.map((slot, index) => {
                    const freeIndex = SLOTS.slice(0, index).filter((s) => s.free).length;
                    return slot.free ? (
                      <span key={slot.time} className="anim-slot rounded-xl border border-gray-200 bg-white py-3.5 text-gray-900" style={{ animationDelay: `${freeIndex * 1.6}s` }}>
                        {slot.time}
                      </span>
                    ) : (
                      <span key={slot.time} className="rounded-xl bg-gray-100 py-3.5 text-gray-400 line-through">{slot.time}</span>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500">Taken times are crossed out, so two patients can never book the same slot.</p>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={100} className="flex flex-[1_1_280px]">
              <SpotlightCard className="flex w-full flex-col gap-6 rounded-3xl border border-blue-600 bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/30 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
                    <Bell className="anim-bell h-5 w-5" aria-hidden="true" />
                    <Ping className="top-1.5 right-2" outer="bg-orange-400" inner="bg-orange-600" />
                  </span>
                  <h3 className="text-xl font-semibold">Live alerts</h3>
                </div>
                <ul className="flex flex-col gap-2 text-[13px]" aria-hidden="true">
                  {ALERTS.map((alert, index) => (
                    <li key={alert.title} className="anim-alert rounded-xl bg-white px-3.5 py-3 text-gray-900 shadow-md shadow-blue-900/30" style={{ animationDelay: `${index * 0.5}s` }}>
                      <strong className="font-semibold">{alert.title}</strong>
                      <span className="text-gray-600"> · {alert.detail}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm leading-relaxed text-blue-50">Doctors hear about new bookings instantly. Patients know when a report is ready.</p>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={0} className="flex flex-[1_1_280px]">
              <SpotlightCard className="flex w-full flex-col gap-5 rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-blue-900">Reports, read for you</h3>
                  <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">AI</span>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-white p-4 text-sm shadow-lg shadow-blue-600/15" aria-hidden="true">
                  <span className="anim-scan absolute inset-x-0 top-0 h-0.5 bg-blue-500 shadow-[0_0_12px_3px_rgb(59_130_246/0.45)]" />
                  <div className="flex flex-col gap-3">
                    {REPORT_VALUES.map((row, index) => (
                      <div key={row.label}>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-600">{row.label}</span>
                          <strong className="font-semibold text-gray-900">{row.value}</strong>
                        </div>
                        <div className="mt-1.5 h-1 rounded-full bg-blue-50">
                          <div className="anim-bar h-1 rounded-full bg-blue-600" style={{ width: row.width, animationDelay: `${index * 0.2}s` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-blue-800">Upload a PDF or photo and the key values appear.</p>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={100} className="flex flex-[1_1_280px]">
              <SpotlightCard className={`${card} flex w-full flex-col gap-4`}>
                <span className={iconTile}><Pill className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="text-xl font-semibold text-gray-900">Prescriptions</h3>
                <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-gray-300 p-3.5 text-[13px]" aria-hidden="true">
                  <span className="anim-allergy self-start rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 font-semibold text-orange-800">Allergy · Penicillin</span>
                  <span className="anim-rx font-medium text-gray-900" style={{ animationDelay: '0.4s' }}>Paracetamol 500 mg · twice daily</span>
                  <span className="anim-rx text-gray-600" style={{ animationDelay: '0.9s' }}>Cetirizine 10 mg · at night</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">Written online, with the patient’s allergies shown first.</p>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={200} className="flex flex-[1_1_280px]">
              <SpotlightCard className={`${card} flex w-full flex-col gap-4`}>
                <span className={iconTile}><TestTube className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="text-xl font-semibold text-gray-900">Lab tests</h3>
                <div className="flex flex-col gap-2.5" aria-hidden="true">
                  <div className="relative h-1 rounded-full bg-gray-200">
                    <div className="anim-progress absolute inset-0 rounded-full bg-blue-600" />
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[11px] leading-tight text-gray-600">
                    {LAB_STEPS.map((step, index) => (
                      <span key={step} className="flex flex-col gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${STEP_DOT[index]}`} />
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">Pick tests, choose a time, follow the status.</p>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={100} className="flex flex-[2_1_560px]">
              <SpotlightCard className={`${card} flex w-full flex-wrap items-center gap-7`}>
                <div className="min-w-0 flex-[1_1_240px]">
                  <span className={iconTile}><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">Private by role</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">Each person sees only what their role allows.</p>
                </div>
                <ul className="flex min-w-0 flex-[1_1_260px] flex-col gap-2 text-sm">
                  {ROLES.map((item, index) => (
                    <li key={item.role} className="anim-role rounded-xl bg-gray-50 px-4 py-3 text-gray-700" style={{ animationDelay: `${index * 2}s` }}>
                      <strong className="font-semibold">{item.role}</strong> · {item.scope}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-20 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className={eyebrow}>How it works</p>
            <h2 className={sectionTitle}>Three steps to organised care</h2>
          </Reveal>
          <div className="relative mt-10">
            <div className="anim-dash absolute inset-x-10 top-[52px] hidden h-0.5 md:block" aria-hidden="true" />
            <ol className="relative grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <Reveal delay={index * 120} className="h-full">
                    <SpotlightCard className="h-full rounded-3xl border border-gray-200 bg-white p-7">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">{index + 1}</span>
                      <h3 className="mt-5 text-lg font-semibold text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.text}</p>
                    </SpotlightCard>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="portals" className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className={eyebrow}>Portals</p>
            <h2 className={sectionTitle}>Choose your portal</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PORTALS.map((portal, index) => {
              const featured = portal.role === 'doctor';
              return (
                <Reveal key={portal.role} delay={index * 120} className="h-full">
                  <Link
                    href={`/auth/login?role=${portal.role}`}
                    className={`spotlight-card group flex h-full flex-col gap-2.5 rounded-3xl border p-7 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none ${featured ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-2xl font-semibold">{portal.title}</span>
                      <ArrowRight className={`portal-arrow h-6 w-6 ${featured ? 'text-white' : 'text-blue-600'}`} aria-hidden="true" />
                    </span>
                    <span className={`text-sm leading-relaxed ${featured ? 'text-blue-50' : 'text-gray-600'}`}>{portal.text}</span>
                    <span className={`mt-auto pt-2 text-sm font-semibold ${featured ? 'text-white' : 'text-blue-600'}`}>Sign in</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 py-16 sm:px-6 md:py-20">
        <Reveal className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">Get in touch</h2>
              <p className="mt-2 text-gray-600">Questions about CuraSync? Write to us.</p>
            </div>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="mailto:krishnaydv1584@gmail.com" className="btn btn-primary h-12 min-w-0 px-5 break-all">
                <Mail className="mr-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                krishnaydv1584@gmail.com
              </a>
              <p className="flex h-12 items-center rounded-lg border border-blue-100 bg-white px-5 text-sm text-gray-700">
                <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-blue-600" aria-hidden="true" />
                Panchkula, India 160102
              </p>
            </div>
          </div>
        </Reveal>
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

function Ping({ className, outer, inner }: { className: string; outer: string; inner: string }) {
  return (
    <span className={`absolute h-2 w-2 ${className}`} aria-hidden="true">
      <span className={`anim-ping absolute inset-0 rounded-full ${outer}`} />
      <span className={`absolute inset-0 rounded-full ${inner}`} />
    </span>
  );
}

// Three floating cards beside the headline; purely decorative.
function HeroPreview() {
  return (
    <div className="relative h-[380px] w-full min-w-0 flex-[1_1_400px] max-sm:h-[420px]" aria-hidden="true">
      <div className="anim-float absolute top-2.5 left-0 w-[min(300px,90%)] rounded-2xl border border-gray-200 bg-white p-4.5 shadow-2xl shadow-gray-900/10">
        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Next appointment</p>
        <p className="mt-2 text-xl font-semibold text-gray-900">Monday, 10:30</p>
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-xs font-medium">
          <span className="rounded-md border border-gray-200 py-1.5 text-gray-900">09:30</span>
          <span className="rounded-md bg-blue-600 py-1.5 text-white">10:30</span>
          <span className="rounded-md bg-gray-100 py-1.5 text-gray-400 line-through">11:00</span>
          <span className="rounded-md border border-gray-200 py-1.5 text-gray-900">11:30</span>
        </div>
      </div>

      <div className="anim-float absolute top-[130px] right-0 flex w-[min(260px,85%)] items-start gap-3 rounded-2xl bg-blue-600 px-4.5 py-4 text-white shadow-2xl shadow-blue-600/40 [animation-delay:-2s]">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white text-blue-600">
          <Bell className="anim-bell h-[18px] w-[18px]" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Report ready</span>
          <span className="mt-0.5 block text-[13px] text-blue-50">Blood test values are in</span>
        </span>
      </div>

      <div className="anim-float absolute bottom-0 left-[12%] w-[min(280px,88%)] rounded-2xl border border-blue-100 bg-blue-50 px-4.5 py-4 [animation-delay:-4s]">
        <p className="text-xs font-semibold tracking-wider text-blue-700 uppercase">Prescription · Active</p>
        <p className="mt-2 text-[15px] font-semibold text-gray-900">Paracetamol 500 mg</p>
        <p className="mt-0.5 text-[13px] text-gray-600">Twice daily after meals</p>
      </div>
    </div>
  );
}
