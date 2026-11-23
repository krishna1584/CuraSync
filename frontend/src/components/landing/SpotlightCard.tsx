'use client';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

// A card with a soft light that follows the pointer, and a gentle lift on hover.
export default function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const follow = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`);
  };

  return (
    <div onMouseMove={follow} className={`spotlight-card ${className}`}>
      {children}
    </div>
  );
}
