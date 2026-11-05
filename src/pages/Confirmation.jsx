import { useMemo } from 'react';
import { Link } from '../lib/router.jsx';
import { BUSINESS, DEPOSIT, TIME_WINDOWS } from '../data/business.js';
import { fmtDate } from '../lib/time.js';
import crest from '../assets/crest.png';

export default function Confirmation() {
  const c = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('luxora-confirmation') || 'null'); } catch { return null; }
  }, []);

  if (!c) {
    return (
      <main className="conf" id="main">
        <div className="conf__card">
          <h1 className="conf__title">No booking to show</h1>
          <p>Looks like this page was opened directly. Ready to reserve your install?</p>
          <Link to="/book" className="btn btn--gold">Book Online</Link>
        </div>
      </main>
    );
  }
  const tw = TIME_WINDOWS.find((t) => t.id === c.time);
  const paid = c.payment_status === 'Paid';

  return (
    <main className="conf" id="main">
      <div className="conf__card">
        <span className="deco deco--tl" /><span className="deco deco--tr" /><span className="deco deco--bl" /><span className="deco deco--br" />
        <img src={crest} alt="" className="conf__crest" width="406" height="258" />
        <p className="eyebrow eyebrow--bars">Reservation confirmed</p>
        <h1 className="conf__title">You’re on the calendar, {c.name.split(' ')[0]}.</h1>
        <p className="conf__id">Booking ID <span>{c.id}</span></p>
        {c.conflict && (
          <p className="conf__warn" role="alert">Someone booked the same window moments before you. Your deposit is safe — we’ll call you to confirm a nearby time.</p>
        )}
        <dl className="conf__list">
          <div><dt>Install</dt><dd>{fmtDate(c.date, { weekday: 'long', month: 'long', day: 'numeric' })} · {tw ? `${tw.part}, ${tw.label}` : c.time}</dd></div>
          <div><dt>Lighting</dt><dd>{c.type} · {c.pkg} · {c.stories}</dd></div>
          <div><dt>Add-ons</dt><dd>{c.addons.length ? c.addons.join(', ') : 'None'}</dd></div>
          <div><dt>Estimate</dt><dd>{c.estimate}</dd></div>
          <div><dt>Deposit</dt><dd>{paid ? `$${DEPOSIT} paid — applied to your final invoice` : 'Pay at the visit'}</dd></div>
          <div><dt>Address</dt><dd>{c.address}</dd></div>
        </dl>
        <h2 className="conf__h">What happens next</h2>
        <ol className="conf__next">
          <li>We’ll reach out at {c.phone} or {c.email} to confirm your install details.</li>
          <li>On install day we walk the roofline with you and confirm the design and final price before anything goes up.</li>
          <li>Need to change something? Call <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a> and mention your booking ID.</li>
        </ol>
        <Link to="/" className="btn btn--line">Back to home</Link>
      </div>
    </main>
  );
}
