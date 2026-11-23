'use client';

import { useInView } from './motion';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

// Fades and lifts its content into place the first time it scrolls into view.
export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>(true, 0.15);
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
