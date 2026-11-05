/* Shared booking UI: sunburst progress + concierge-card summary */
import { DEPOSIT, TIME_WINDOWS } from '../data/business.js';
import { estimate, addonNames } from '../lib/draft.js';
import { fmtDate } from '../lib/time.js';

export const STEPS = [
  { id: 'type', label: 'Lighting' },
  { id: 'pkg', label: 'Package' },
  { id: 'home', label: 'Home' },
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Window' },
  { id: 'info', label: 'Your info' },
];

export function Sunburst({ step, reached, onJump }) {
  const cx = 180;
  const cy = 132;
  return (
    <div className="sunburst">
      <svg viewBox="0 0 360 150" className="sunburst__svg" aria-hidden="true" focusable="false">
        {STEPS.map((s, i) => {
          const a = ((165 - i * 30) * Math.PI) / 180;
          const r1 = 56;
          const r2 = 118;
          const st = i < step ? 'done' : i === step ? 'cur' : 'todo';
          return (
            <line key={s.id} className={`ray ray--${st}`} x1={cx + r1 * Math.cos(a)} y1={cy - r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy - r2 * Math.sin(a)} />
          );
        })}
        <path d="M134 132 L180 92 L226 132" className="sunburst__roof" />
        <rect x="171" y="108" width="18" height="18" className="sunburst__win" />
      </svg>
      <p className="sunburst__count">Step {step + 1} of {STEPS.length} · <span>{STEPS[step].label}</span></p>
      <ol className="sunburst__labels">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={i < step ? 'is-done' : i === step ? 'is-cur' : ''}
              disabled={i > reached || i === step}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => onJump(i)}
            >
              <span className="sunburst__n">{String(i + 1).padStart(2, '0')}</span>{s.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function summaryRows(d) {
  const adds = addonNames(d).map((a) => a.short);
  const tw = TIME_WINDOWS.find((t) => t.id === d.time);
  return [
    { step: 0, k: 'Lighting', v: d.type },
    { step: 1, k: 'Package', v: d.pkg },
    { step: 2, k: 'Home', v: d.stories ? [d.stories, adds.length ? `+ ${adds.join(', ')}` : 'No add-ons'].join(' · ') : '' },
    { step: 3, k: 'Date', v: d.date ? fmtDate(d.date, { weekday: 'long', month: 'long', day: 'numeric' }) : '' },
    { step: 4, k: 'Window', v: tw ? `${tw.part}, ${tw.label}` : '' },
    { step: 5, k: 'Contact', v: d.name ? `${d.name}${d.phone ? ` · ${d.phone}` : ''}` : '' },
  ];
}

export function Concierge({ d, onChange, maxStep = 5, compactOpen, onToggle, collapsible = true }) {
  const est = estimate(d);
  const rows = summaryRows(d);
  return (
    <aside className={`concierge ${collapsible ? 'is-collapsible' : ''} ${compactOpen ? 'is-open' : ''}`} aria-label="Your reservation">
      {collapsible && (
        <button type="button" className="concierge__toggle" aria-expanded={!!compactOpen} aria-controls="concierge-body" onClick={onToggle}>
          <span>Your reservation</span>
          <span className="concierge__toggleEst">{est ? est.label : 'Estimate pending'}</span>
          <span className="concierge__chev" aria-hidden="true">▾</span>
        </button>
      )}
      <div className="concierge__body" id="concierge-body">
        <span className="deco deco--tl" /><span className="deco deco--tr" />
        <div className="concierge__monogram" aria-hidden="true">L</div>
        <p className="concierge__title">Reservation card</p>
        <ul className="concierge__rows">
          {rows.map((r) => (
            <li key={r.k} className={r.v ? 'is-set' : ''}>
              <span className="concierge__k">{r.k}</span>
              <span className="concierge__v">{r.v || '—'}</span>
              {r.v && onChange && r.step <= maxStep && (
                <button type="button" className="concierge__chg" onClick={() => onChange(r.step)} aria-label={`Change ${r.k.toLowerCase()}`}>Change</button>
              )}
            </li>
          ))}
        </ul>
        <div className="concierge__band">
          <div><span>Estimate</span><span className="concierge__est">{est ? est.label : '—'}</span></div>
          <div><span>Deposit today</span><span>${DEPOSIT} · applied to invoice</span></div>
        </div>
        <p className="concierge__fine">Prices are “starting at”; final price is confirmed at the on-site visit.</p>
      </div>
    </aside>
  );
}
