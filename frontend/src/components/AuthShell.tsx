import { Calendar, FileText, Pill } from 'lucide-react';
import Logo from '@/components/Logo';

const HIGHLIGHTS = [
  { icon: Calendar, text: 'Book appointments and lab tests online' },
  { icon: FileText, text: 'Keep your medical reports in one place' },
  { icon: Pill, text: 'See your prescriptions whenever you need them' },
];

interface AuthShellProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

// Shared frame for sign in, register, verification and password reset.
export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh bg-white">
      <aside className="hidden flex-col justify-between bg-blue-700 p-12 text-white lg:flex lg:w-[44%]">
        <Logo inverted />
        <div>
          <h2 className="max-w-md text-3xl leading-tight font-semibold tracking-tight">
            Your hospital care, organised in one place.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-blue-50">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-blue-200">CuraSync Hospital Management System</p>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="px-5 pt-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
