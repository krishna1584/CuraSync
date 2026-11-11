import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="CuraSync home">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${inverted ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'}`}>
        <Heart className="h-5 w-5" />
      </span>
      <span className={`text-xl font-semibold tracking-tight ${inverted ? 'text-white' : 'text-gray-900'}`}>CuraSync</span>
    </Link>
  );
}
