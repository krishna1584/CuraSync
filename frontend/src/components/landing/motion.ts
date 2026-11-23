'use client';

import { useEffect, useRef, useState } from 'react';

// True once the element has scrolled into view (or while it is in view, when `once` is false).
export function useInView<T extends Element>(once = false, threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once) observer.disconnect();
      } else if (!once) {
        setInView(false);
      }
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  return [ref, inView] as const;
}
