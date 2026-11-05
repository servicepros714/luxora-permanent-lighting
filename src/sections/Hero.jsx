import { useEffect, useRef } from 'react';
import { Link, navigate } from '../lib/router.jsx';
import { BUSINESS, DEPOSIT } from '../data/business.js';
import Scene from '../components/Scene.jsx';
import { useAvailability, earliestOpen } from '../lib/availability.js';
import { fmtDate } from '../lib/time.js';
import { reducedMotion } from '../lib/useReveal.js';

const LOOP = 16000;
const ss = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lin = (a, b, t) => Math.min(1, Math.max(0, (t - a) / (b - a)));

function frame(t, n) {
  const back = t >= 0.9;
  const day = back ? ss(0.9, 1, t) : 1 - ss(0.08, 0.35, t);
  const dusk = back ? ss(0.9, 0.97, t) : 1 - ss(0.35, 0.58, t);
  const night = back ? 1 - ss(0.9, 0.98, t) : ss(0.3, 0.6, t);
  const win = back ? 1 - ss(0.9, 0.96, t) : ss(0.3, 0.45, t);
  const lit = back ? n * (1 - lin(0.9, 0.94, t)) : n * lin(0.42, 0.56, t);
  return { day, dusk, night, win, lit };
}

function clock(t) {
  const mins = 16 * 60 + 38 + Math.round((Math.min(t, 0.9) / 0.9) * 52);
  const h = Math.floor(mins / 60) - 12;
  return `${h}:${String(mins % 60).padStart(2, '0')} PM`;
}
const label = (t) => (t < 0.42 ? 'Golden hour' : t < 0.56 ? 'Timer on · powering up' : t < 0.9 ? 'Tonight’s look · Warm gold' : 'Next evening…');

export default function Hero() {
  const svgRef = useRef(null);
  const clockRef = useRef(null);
  const labelRef = useRef(null);
  const av = useAvailability();
  const next = earliestOpen(av);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const n = +svg.dataset.bulbs || 40;
    const apply = (t) => {
      const f = frame(t, n);
      svg.style.setProperty('--day', f.day.toFixed(3));
      svg.style.setProperty('--dusk', f.dusk.toFixed(3));
      svg.style.setProperty('--night', f.night.toFixed(3));
      svg.style.setProperty('--win', f.win.toFixed(3));
      svg.style.setProperty('--lit', f.lit.toFixed(2));
      if (clockRef.current) clockRef.current.textContent = clock(t);
      if (labelRef.current) labelRef.current.textContent = label(t);
    };
    if (reducedMotion()) { apply(0.7); return undefined; }
    let raf = 0;
    let visible = true;
    let start = performance.now();
    let last = 0;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden || now - last < 70) return;
      last = now;
      apply(((now - start) % LOOP) / LOOP);
    };
    apply(0);
    raf = requestAnimationFrame(tick);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(svg);
    return () => { cancelAnimationFrame(raf); io.disconnect(); start = 0; };
  }, []);

  const nextText = next
    ? fmtDate(next.date, { weekday: 'short', month: 'short', day: 'numeric' })
    : av.loading && !av.offline ? 'Checking…' : 'Call to schedule';

  return (
    <section className="hero" id="top">
      <div className="hero__head container">
        <p className="eyebrow eyebrow--bars">Permanent lighting · {BUSINESS.city}</p>
        <h1 className="hero__title">
          Your home,<br /><em className="foil-text">gilded</em> in light.
        </h1>
        <p className="hero__lede">
          Permanent roofline lighting and seasonal Christmas installs — designed, hung and looked after by {BUSINESS.short}.
        </p>
        <div className="hero__ctas">
          <Link to="/book" className="btn btn--gold btn--lg">Book your install</Link>
          <a href="/#packages" className="btn btn--line btn--lg" onClick={(e) => { e.preventDefault(); navigate('/#packages'); }}>See packages</a>
        </div>
      </div>

      <div className="container">
        <figure className="gframe">
          <span className="deco deco--tl" /><span className="deco deco--tr" /><span className="deco deco--bl" /><span className="deco deco--br" />
          <div className="gframe__stage">
            <Scene hero svgRef={svgRef} shape="gable" colors={['#FFD27A', '#FDE7A0']} spacing={20} extras={['wreath']} title="Illustrated home going from golden hour to night as the roofline lights switch on" />
            <div className="gframe__read" aria-hidden="true">
              <span className="gframe__clock" ref={clockRef}>4:38 PM</span>
              <span className="gframe__label" ref={labelRef}>Golden hour</span>
            </div>
            <span className="tag-preview">Design preview</span>
          </div>
        </figure>

        <dl className="plate">
          <div className="plate__item">
            <dt>Install season</dt>
            <dd>Oct 20 – Dec 20</dd>
          </div>
          <div className="plate__item">
            <dt>Earliest open</dt>
            <dd>{nextText}</dd>
          </div>
          <div className="plate__item">
            <dt>Reserve with</dt>
            <dd>${DEPOSIT} <small>applied to invoice</small></dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
