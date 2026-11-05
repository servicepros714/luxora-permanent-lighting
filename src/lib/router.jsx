/* Tiny history router (no react-router-dom). Scrolls to top on every route change. */
import { useSyncExternalStore } from 'react';

const subs = new Set();
const emit = () => subs.forEach((f) => f());
if (typeof window !== 'undefined') window.addEventListener('popstate', emit);

const snapshot = () => window.location.pathname + window.location.search + window.location.hash;
export function useLocation() {
  const href = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, snapshot, () => '/');
  const u = new URL(href, 'https://x.local');
  return { path: u.pathname.replace(/\/+$/, '') || '/', search: u.searchParams, hash: u.hash };
}

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scrollToId(id, attempt = 0) {
  const el = document.getElementById(id);
  if (!el) {
    if (attempt < 10) setTimeout(() => scrollToId(id, attempt + 1), 60);
    return;
  }
  const off = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 80;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off() + 2, behavior: prefersReduced() ? 'auto' : 'smooth' });
  // re-correct once the scroll has settled, in case content above shifted (fonts, live data)
  let last = -1;
  let ticks = 0;
  const settle = () => {
    ticks += 1;
    if (window.scrollY !== last) { last = window.scrollY; if (ticks < 20) setTimeout(settle, 160); return; }
    const d = el.getBoundingClientRect().top - off() + 2;
    if (Math.abs(d) > 6) window.scrollBy({ top: d, behavior: 'auto' });
  };
  setTimeout(settle, 160);
}

export function navigate(to, { replace = false } = {}) {
  const u = new URL(to, window.location.origin);
  const samePath = u.pathname === window.location.pathname;
  if (samePath && u.hash && !u.search) {
    if (window.location.hash !== u.hash) window.history.replaceState({}, '', u.pathname + u.hash);
    scrollToId(u.hash.slice(1));
    return;
  }
  window.history[replace ? 'replaceState' : 'pushState']({}, '', u.pathname + u.search + u.hash);
  emit();
  if (u.hash) scrollToId(u.hash.slice(1));
  else window.scrollTo({ top: 0, behavior: 'auto' });
}

export function Link({ to, onClick, children, ...rest }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (/^(tel:|mailto:|https?:)/.test(to)) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
