import { useEffect, useRef, useState } from 'react';
import { Link, navigate } from '../lib/router.jsx';
import { BUSINESS } from '../data/business.js';
import Icon, { Crest } from './Icon.jsx';
import logo from '../assets/logo.png';
import logoLight from '../assets/logo-light.png';

export const NAV = [
  { id: 'how', label: 'How it works' },
  { id: 'packages', label: 'Packages' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'area', label: 'Service area' },
  { id: 'season', label: 'Season' },
  { id: 'faq', label: 'FAQ' },
];

function useScrollSpy(ids) {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-42% 0px -52% 0px' },
    );
    const t = setTimeout(() => ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); }), 50);
    const top = () => { if (window.scrollY < 200) setActive(''); };
    window.addEventListener('scroll', top, { passive: true });
    return () => { clearTimeout(t); io.disconnect(); window.removeEventListener('scroll', top); };
  }, [ids]);
  return active;
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useScrollSpy(NAV.map((n) => n.id));
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // `inert` set on the DOM node (works the same on React 18 and 19)
  useEffect(() => {
    const m = menuRef.current;
    if (!m) return undefined;
    if (open) {
      m.removeAttribute('inert');
      document.documentElement.classList.add('menu-open');
      setTimeout(() => closeRef.current?.focus(), 60);
      const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    m.setAttribute('inert', '');
    document.documentElement.classList.remove('menu-open');
    return undefined;
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1081px)');
    const f = () => mq.matches && setOpen(false);
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, []);

  const go = (id) => (e) => { e.preventDefault(); setOpen(false); navigate(`/#${id}`); };
  const close = () => { setOpen(false); btnRef.current?.focus(); };

  return (
    <>
      <header className={`hdr ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="hdr__in">
          <Link to="/" className="hdr__logo" aria-label={`${BUSINESS.name} home`}>
            <img src={logo} alt={BUSINESS.name} width="1000" height="377" />
          </Link>
          <nav className="hdr__nav" aria-label="Main">
            <ul>
              {NAV.map((n) => (
                <li key={n.id} className={active === n.id ? 'is-active' : ''}>
                  <a href={`/#${n.id}`} onClick={go(n.id)} aria-current={active === n.id ? 'true' : undefined}>
                    <Crest size={18} className="hdr__mark" />
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a className="hdr__phone" href={BUSINESS.phoneHref} aria-label={`Call ${BUSINESS.phone}`}>
            <Icon name="phone" size={18} />
            <span>{BUSINESS.phone}</span>
          </a>
          <Link to="/book" className="hdr__ribbon">
            <span>Book</span>
            <span>Online</span>
          </Link>
          <button ref={btnRef} type="button" className="hdr__menuBtn" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
            <span className="hdr__menuLines" aria-hidden="true"><i /><i /></span>
            Menu
          </button>
        </div>
      </header>

      <div id="site-menu" ref={menuRef} className={`fold ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="fold__panel fold__panel--1">
          <div className="fold__top">
            <img src={logo} alt={BUSINESS.name} className="fold__logo" />
            <button ref={closeRef} type="button" className="fold__close" onClick={close} aria-label="Close menu">
              <Icon name="close" size={22} />
            </button>
          </div>
          <p className="eyebrow eyebrow--bars">Menu</p>
        </div>
        <nav className="fold__panel fold__panel--2" aria-label="Menu links">
          <ol>
            {NAV.map((n, i) => (
              <li key={n.id}>
                <a href={`/#${n.id}`} onClick={go(n.id)}>
                  <span className="fold__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="fold__label">{n.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="fold__panel fold__panel--3">
          <p className="fold__meta">{BUSINESS.hours}<br />{BUSINESS.city}, {BUSINESS.state}</p>
          <div className="actionbar">
            <a className="btn btn--line" href={BUSINESS.phoneHref}><Icon name="phone" size={18} />Call Now</a>
            <Link to="/book" className="btn btn--gold" onClick={() => setOpen(false)}>Book Online</Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* Focused header for /book, /checkout and /confirmation */
export function FocusHeader() {
  return (
    <header className="fhdr">
      <div className="fhdr__in">
        <Link to="/" className="fhdr__home"><Icon name="left" size={18} /><span>Home</span></Link>
        <Link to="/" className="fhdr__logo" aria-label={`${BUSINESS.name} home`}>
          <img src={logoLight} alt={BUSINESS.name} width="1000" height="377" />
        </Link>
        <div className="fhdr__right">
          <span className="fhdr__secure"><Icon name="lock" size={15} />Secure booking</span>
          <a className="fhdr__phone" href={BUSINESS.phoneHref} aria-label={`Call ${BUSINESS.phone}`}><Icon name="phone" size={17} /><span>{BUSINESS.phone}</span></a>
        </div>
      </div>
    </header>
  );
}

export function MobileBar({ show }) {
  return (
    <div className={`mbar ${show ? 'is-on' : ''}`} aria-hidden={!show}>
      <a className="btn btn--line" href={BUSINESS.phoneHref} tabIndex={show ? 0 : -1}><Icon name="phone" size={18} />Call Now</a>
      <Link to="/book" className="btn btn--gold" tabIndex={show ? 0 : -1}>Book Online</Link>
    </div>
  );
}
