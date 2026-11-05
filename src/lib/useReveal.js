/* "Gilded sheen" reveals: opacity/transform only (no clip-path on observed elements). */
import { useEffect } from 'react';

export function useReveal(dep) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rv:not(.in)'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    // safety: never leave content hidden
    const t = setTimeout(() => els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    }), 1200);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [dep]);
}

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
