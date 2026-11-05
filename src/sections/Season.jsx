import { useMemo } from 'react';
import { navigate } from '../lib/router.jsx';
import { TAKEDOWN } from '../data/business.js';
import { useAvailability, weekStats, earliestOpen } from '../lib/availability.js';
import { fmtDate, seasonYear } from '../lib/time.js';
import { updateDraft } from '../lib/draft.js';

const STATUS = { open: 'Open', filling: 'Filling', full: 'Full', passed: 'Passed' };

function Candle({ ratio, status }) {
  const h = status === 'passed' ? 14 : 14 + Math.round(70 * ratio);
  const top = 118 - h;
  return (
    <svg className={`candle candle--${status}`} viewBox="0 0 60 170" aria-hidden="true" focusable="false">
      {(status === 'open' || status === 'filling') && (
        <g className="candle__flame" style={{ transformOrigin: `30px ${top}px` }}>
          <ellipse cx="30" cy={top - 12} rx="14" ry="18" className="candle__halo" />
          <path d={`M30 ${top - (status === 'open' ? 26 : 16)} C 37 ${top - 12}, 36 ${top - 3}, 30 ${top - 2} C 24 ${top - 3}, 23 ${top - 12}, 30 ${top - (status === 'open' ? 26 : 16)} Z`} className="candle__fire" />
          <path d={`M30 ${top - 11} C 33 ${top - 6}, 32 ${top - 3}, 30 ${top - 3} C 28 ${top - 3}, 27 ${top - 6}, 30 ${top - 11} Z`} className="candle__core" />
        </g>
      )}
      {status === 'full' && <path className="candle__smoke" d={`M30 ${top - 4} c -6 -8, 6 -14, 0 -22 c -6 -8, 6 -14, 0 -22`} />}
      <line x1="30" y1={top} x2="30" y2={top - 4} className="candle__wick" />
      <rect x="21" y={top} width="18" height={h} rx="3" className="candle__wax" />
      <path d="M8 118 h44 l-6 8 H14 z" className="candle__dish" />
      <rect x="26" y="126" width="8" height="22" className="candle__stem" />
      <path d="M12 160 q18 -16 36 0 z" className="candle__base" />
    </svg>
  );
}

export default function Season() {
  const av = useAvailability();
  const weeks = useMemo(() => weekStats(av), [av]);
  const next = earliestOpen(av);
  const left = weeks.reduce((s, w) => s + w.open, 0);
  const year = seasonYear();

  const pick = (w) => {
    if (!w.first) return;
    updateDraft({ date: w.first, time: '' });
    navigate('/book');
  };

  return (
    <section className="sec season" id="season" aria-labelledby="season-h">
      <div className="container">
        <header className="sec__head rv">
          <p className="eyebrow eyebrow--bars">Season {year}</p>
          <h2 id="season-h" className="sec__title track">Book <em>early</em> — the candles burn down.</h2>
          <p className="sec__lede">Installs run Oct 20 – Dec 20, every day of the week. Each candle is one install week: the taller the wax, the more windows are left. Tap a lit candle to start booking its first open day.</p>
        </header>

        <dl className="readouts rv">
          <div><dt>Earliest open</dt><dd>{next ? fmtDate(next.date) : av.offline ? 'Call us' : av.loading ? 'Checking…' : 'Fully booked'}</dd></div>
          <div><dt>Windows left</dt><dd>{av.loading && !av.offline ? '—' : left}</dd></div>
          <div><dt>Takedown</dt><dd className="readouts__small">{TAKEDOWN}</dd></div>
        </dl>

        <ol className="candles rv" aria-label="Install weeks">
          {weeks.map((w) => {
            const disabled = !w.first;
            const ratio = w.cap ? w.open / w.cap : 0;
            const label = `Week of ${fmtDate(w.monday, { month: 'short', day: 'numeric' })}: ${STATUS[w.status]}, ${w.open} window${w.open === 1 ? '' : 's'} left${w.first ? `. Book ${fmtDate(w.first, { weekday: 'long', month: 'long', day: 'numeric' })}` : ''}`;
            return (
              <li key={w.monday} className={`candles__item is-${w.status} ${w.isNow ? 'is-now' : ''}`}>
                <button type="button" onClick={() => pick(w)} disabled={disabled} aria-label={label}>
                  {w.isNow && <span className="candles__now">This week</span>}
                  <Candle ratio={ratio} status={w.status} />
                  <span className="candles__wk">{fmtDate(w.monday, { month: 'short', day: 'numeric' })}</span>
                  <span className="candles__st">{STATUS[w.status]}</span>
                  <span className="candles__n">{w.status === 'passed' ? '—' : `${w.open} left`}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <ul className="legend rv" aria-label="Legend">
          <li><i className="lg lg--open" />Open</li>
          <li><i className="lg lg--filling" />Filling</li>
          <li><i className="lg lg--full" />Full</li>
          <li><i className="lg lg--passed" />Passed</li>
        </ul>
        {(av.offline || av.error) && (
          <p className="season__note">{av.offline ? 'Live availability appears once the booking system is connected.' : 'Live availability couldn’t load — the candles show the full season.'}</p>
        )}
      </div>
    </section>
  );
}
