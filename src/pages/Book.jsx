import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate, useLocation } from '../lib/router.jsx';
import { ADDONS, LIGHTING_TYPES, PACKAGES, STORIES, TIME_WINDOWS, SEASON, LEAD_HOURS, BUSINESS } from '../data/business.js';
import { useDraft, getDraft, updateDraft, toggleAddon, priceLabel, addonLabel } from '../lib/draft.js';
import { useAvailability, refreshAvailability, openWindows, slotOpen, earliestOpen } from '../lib/availability.js';
import { seasonYear, isoDate, fmtDate, leadOk, splitIso } from '../lib/time.js';
import { STEPS, Sunburst, Concierge } from '../components/BookingBits.jsx';
import Icon from '../components/Icon.jsx';

const firstIncomplete = (d) => (!d.type ? 0 : !d.pkg ? 1 : !d.stories ? 2 : !d.date ? 3 : !d.time ? 4 : 5);
const PHONE_RE = /\d/g;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Choice({ type = 'radio', name, id, checked, onChange, title, sub, aside, disabled }) {
  return (
    <label className={`choice ${checked ? 'is-on' : ''} ${disabled ? 'is-off' : ''}`} htmlFor={id}>
      <input type={type} id={id} name={name} checked={checked} onChange={onChange} disabled={disabled} />
      <span className={`choice__box choice__box--${type}`} aria-hidden="true"><Icon name="check" size={14} stroke={2.6} /></span>
      <span className="choice__body">
        <span className="choice__title">{title}</span>
        {sub && <span className="choice__sub">{sub}</span>}
      </span>
      {aside && <span className="choice__aside">{aside}</span>}
    </label>
  );
}

function Calendar({ d, av }) {
  const year = seasonYear();
  const months = [SEASON.startMonth, 11, SEASON.endMonth].filter((m, i, a) => a.indexOf(m) === i);
  const init = d.date ? splitIso(d.date)[1] : (earliestOpen(av) ? splitIso(earliestOpen(av).date)[1] : months[0]);
  const [mi, setMi] = useState(Math.max(0, months.indexOf(init)));
  const m = months[mi];
  const first = new Date(Date.UTC(year, m - 1, 1));
  const daysIn = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < first.getUTCDay(); i++) cells.push(null);
  for (let day = 1; day <= daysIn; day++) cells.push(isoDate(year, m, day));
  const inSeason = (iso) => {
    const [, mm, dd] = splitIso(iso);
    const v = mm * 100 + dd;
    return v >= SEASON.startMonth * 100 + SEASON.startDay && v <= SEASON.endMonth * 100 + SEASON.endDay;
  };
  const firstOpenId = useMemo(() => {
    const c = cells.find((iso) => iso && inSeason(iso) && openWindows(av, iso).length);
    return c ? `day-${c}` : null;
  }, [av, m]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="cal">
      <div className="cal__head">
        <button type="button" className="cal__nav" onClick={() => setMi(mi - 1)} disabled={mi === 0} aria-label="Previous month"><Icon name="left" size={18} /></button>
        <p className="cal__month" aria-live="polite">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first)}</p>
        <button type="button" className="cal__nav" onClick={() => setMi(mi + 1)} disabled={mi === months.length - 1} aria-label="Next month"><Icon name="right" size={18} /></button>
      </div>
      <div className="cal__dow" aria-hidden="true">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x, i) => <span key={i}>{x}</span>)}</div>
      <div className="cal__grid" id="cal-grid" data-first={firstOpenId || ''}>
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} className="cal__pad" />;
          const season = inSeason(iso);
          const open = season ? openWindows(av, iso) : [];
          const sel = d.date === iso;
          const dayNum = splitIso(iso)[2];
          return (
            <button
              key={iso}
              id={`day-${iso}`}
              type="button"
              className={`cal__day ${sel ? 'is-sel' : ''} ${!season ? 'is-out' : ''}`}
              disabled={!open.length}
              aria-pressed={sel}
              aria-label={`${fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric' })} — ${season ? (open.length ? `${open.length} window${open.length > 1 ? 's' : ''} open` : 'unavailable') : 'outside the install season'}`}
              onClick={() => updateDraft({ date: iso, time: d.time && slotOpen(av, iso, d.time) ? d.time : '' })}
            >
              <span>{dayNum}</span>
              {season && (
                <span className="cal__dots" aria-hidden="true">
                  {TIME_WINDOWS.map((t) => <i key={t.id} className={open.includes(t.id) ? 'is-open' : ''} />)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="cal__legend"><span><i className="is-open" /> window open</span><span><i /> taken or too soon</span></p>
    </div>
  );
}

export default function Book() {
  const d = useDraft();
  const av = useAvailability();
  const { search } = useLocation();
  const [step, setStep] = useState(() => {
    const want = STEPS.findIndex((s) => s.id === search.get('step'));
    const fi = firstIncomplete(getDraft());
    return want >= 0 ? Math.min(want, fi) : fi;
  });
  const [reached, setReached] = useState(() => firstIncomplete(getDraft()));
  const [err, setErr] = useState(null);
  const [sumOpen, setSumOpen] = useState(false);
  const cardRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => { refreshAvailability(true); }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setReached((r) => Math.max(r, step));
    setErr(null);
    const t = setTimeout(() => headRef.current?.focus({ preventScroll: true }), 30);
    return () => clearTimeout(t);
  }, [step]);

  // clear a stale error as soon as the customer changes an answer
  useEffect(() => { setErr(null); }, [d.type, d.pkg, d.stories, d.date, d.time, d.name, d.phone, d.email, d.address, d.addons]);

  // focus the named field after an error renders
  useEffect(() => {
    if (!err?.focus) return;
    const el = document.getElementById(err.focus);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [err]);

  const pkgList = PACKAGES;
  const addons = ADDONS.filter((a) => !(a.seasonalOnly && d.type === 'Permanent'));

  function validate(s) {
    if (s === 0 && !d.type) return { msg: 'Choose your lighting type — Permanent or Seasonal.', focus: 'opt-type-0' };
    if (s === 1 && !d.pkg) return { msg: 'Choose a package — Front Only or Front & Sides.', focus: 'opt-pkg-0' };
    if (s === 2 && !d.stories) return { msg: 'Choose your home height — 1-story or 2-story.', focus: 'opt-st-0' };
    if (s === 3) {
      const firstId = document.getElementById('cal-grid')?.dataset.first || 'cal-grid';
      if (!d.date) return { msg: 'Pick an install date.', focus: firstId };
      if (!openWindows(av, d.date).length) return { msg: 'That date is no longer available — pick another install date.', focus: firstId };
    }
    if (s === 4) {
      const firstOpen = TIME_WINDOWS.findIndex((t) => slotOpen(av, d.date, t.id));
      if (!d.time) return { msg: 'Pick a time window.', focus: `opt-time-${Math.max(0, firstOpen)}` };
      if (!slotOpen(av, d.date, d.time)) return { msg: 'That time window was just taken — pick another time window.', focus: `opt-time-${Math.max(0, firstOpen)}` };
    }
    if (s === 5) {
      if (d.name.trim().length < 2) return { msg: 'Enter your full name.', focus: 'f-name' };
      if ((d.phone.match(PHONE_RE) || []).length < 10) return { msg: 'Enter your phone number (10 digits).', focus: 'f-phone' };
      if (!EMAIL_RE.test(d.email.trim())) return { msg: 'Enter a valid email address.', focus: 'f-email' };
      if (d.address.trim().length < 6) return { msg: 'Enter the service address for the install.', focus: 'f-address' };
    }
    return null;
  }

  const next = () => {
    const v = validate(step);
    if (v) { setErr(v); return; }
    if (step === 5) { navigate('/checkout'); return; }
    setStep(step + 1);
  };
  const back = () => (step === 0 ? navigate('/') : setStep(step - 1));
  const jump = (i) => { if (i <= reached) setStep(i); };

  const tw = (t) => {
    if (!d.date) return { ok: false, why: 'Pick a date first' };
    if (!leadOk(d.date, t.id)) return { ok: false, why: `Within ${LEAD_HOURS} hours` };
    if (av.taken.has(`${d.date}|${t.id}`)) return { ok: false, why: 'Taken' };
    return { ok: true, why: 'Open' };
  };

  return (
    <main className="bk" id="main">
      <div className="bk__wrap">
        <Sunburst step={step} reached={reached} onJump={jump} />

        <div className="bk__grid">
          <div className="bk__main">
            <form
              className="qcard"
              ref={cardRef}
              noValidate
              onSubmit={(e) => { e.preventDefault(); next(); }}
            >
              <span className="deco deco--tl" /><span className="deco deco--tr" /><span className="deco deco--bl" /><span className="deco deco--br" />
              <header className="qcard__head">
                <p className="eyebrow eyebrow--bars">{STEPS[step].label}</p>
                <h1 className="qcard__title" tabIndex={-1} ref={headRef}>
                  {['Permanent or seasonal?', 'Choose your package', 'Tell us about your home', 'Pick your install date', 'Choose a time window', 'Where do we install?'][step]}
                </h1>
                <p className="qcard__sub">
                  {[
                    'Permanent track stays up all year. Seasonal lights are leased for the holidays and taken down after.',
                    `Prices are “starting at” — ${d.type === 'Permanent' ? 'permanent pricing comes with your online quote' : 'your final price is confirmed at the on-site visit'}.`,
                    'Home height sets the ladder work. Add-ons are optional.',
                    `Installs run Oct 20 – Dec 20, every day. The earliest window is ${LEAD_HOURS} hours from now (Pacific time).`,
                    d.date ? `For ${fmtDate(d.date, { weekday: 'long', month: 'long', day: 'numeric' })}.` : 'Pick a date first.',
                    'We’ll confirm your install details by phone or email.',
                  ][step]}
                </p>
              </header>

              {err && (
                <p className="qcard__err" role="alert"><Icon name="close" size={16} stroke={2.4} />{err.msg}</p>
              )}

              {step === 0 && (
                <fieldset className="qcard__set">
                  <legend className="sr-only">Lighting type</legend>
                  <div className="choices choices--2">
                    {LIGHTING_TYPES.map((t, i) => (
                      <Choice key={t.id} id={`opt-type-${i}`} name="type" checked={d.type === t.id} onChange={() => updateDraft({ type: t.id })} title={t.name} sub={t.blurb} aside={t.tagline} />
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 1 && (
                <fieldset className="qcard__set">
                  <legend className="sr-only">Package</legend>
                  <div className="choices choices--2">
                    {pkgList.map((p, i) => (
                      <Choice
                        key={p.id}
                        id={`opt-pkg-${i}`}
                        name="pkg"
                        checked={d.pkg === p.id}
                        onChange={() => updateDraft({ pkg: p.id })}
                        title={`${p.name}${p.featured ? ' · ' + p.featured : ''}`}
                        sub={p.features[d.type || 'Seasonal'].join(' · ')}
                        aside={`From ${priceLabel(p.price[d.type || 'Seasonal'])}`}
                      />
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <>
                  <fieldset className="qcard__set">
                    <legend className="qcard__legend">Home height</legend>
                    <div className="choices choices--2">
                      {STORIES.map((s, i) => (
                        <Choice key={s.id} id={`opt-st-${i}`} name="stories" checked={d.stories === s.id} onChange={() => updateDraft({ stories: s.id })} title={s.name} sub={s.note} />
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="qcard__set">
                    <legend className="qcard__legend">Add-ons <span>optional</span></legend>
                    <div className="choices choices--2">
                      {addons.map((a) => (
                        <Choice key={a.id} type="checkbox" id={`opt-add-${a.id}`} name="addons" checked={d.addons.includes(a.id)} onChange={() => toggleAddon(a.id)} title={a.name} aside={addonLabel(a)} />
                      ))}
                    </div>
                  </fieldset>
                </>
              )}

              {step === 3 && (
                <fieldset className="qcard__set">
                  <legend className="sr-only">Install date</legend>
                  <Calendar d={d} av={av} />
                  {av.offline && <p className="qcard__note">Live availability appears once the booking system is connected.</p>}
                  {av.error && <p className="qcard__note">Live availability couldn’t load. You can still pick a date — we’ll confirm it.</p>}
                </fieldset>
              )}

              {step === 4 && (
                <fieldset className="qcard__set">
                  <legend className="sr-only">Time window</legend>
                  <div className="choices choices--2">
                    {TIME_WINDOWS.map((t, i) => {
                      const s = tw(t);
                      return (
                        <Choice key={t.id} id={`opt-time-${i}`} name="time" checked={d.time === t.id} disabled={!s.ok} onChange={() => updateDraft({ time: t.id })} title={t.part} sub={t.label} aside={s.why} />
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {step === 5 && (
                <fieldset className="qcard__set">
                  <legend className="sr-only">Your info</legend>
                  <div className="fields">
                    <label className="field" htmlFor="f-name">
                      <span>Full name</span>
                      <input id="f-name" autoComplete="name" value={d.name} onChange={(e) => updateDraft({ name: e.target.value })} aria-invalid={err?.focus === 'f-name' || undefined} />
                    </label>
                    <label className="field" htmlFor="f-phone">
                      <span>Phone</span>
                      <input id="f-phone" type="tel" inputMode="tel" autoComplete="tel" value={d.phone} onChange={(e) => updateDraft({ phone: e.target.value })} aria-invalid={err?.focus === 'f-phone' || undefined} />
                    </label>
                    <label className="field" htmlFor="f-email">
                      <span>Email</span>
                      <input id="f-email" type="email" inputMode="email" autoComplete="email" value={d.email} onChange={(e) => updateDraft({ email: e.target.value })} aria-invalid={err?.focus === 'f-email' || undefined} />
                    </label>
                    <label className="field field--wide" htmlFor="f-address">
                      <span>Service address</span>
                      <input id="f-address" autoComplete="street-address" value={d.address} onChange={(e) => updateDraft({ address: e.target.value })} aria-invalid={err?.focus === 'f-address' || undefined} placeholder="Street, city, ZIP" />
                    </label>
                  </div>
                </fieldset>
              )}

              <div className="bk__actions">
                <button type="button" className="btn btn--line" onClick={back}><Icon name="left" size={18} />{step === 0 ? 'Home' : 'Back'}</button>
                <button type="submit" className="btn btn--gold">{step === 5 ? 'Continue to checkout' : 'Continue'}<Icon name="right" size={18} /></button>
              </div>
            </form>
            <p className="bk__help">Questions? Call <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a></p>
          </div>

          <Concierge d={d} onChange={jump} maxStep={reached} compactOpen={sumOpen} onToggle={() => setSumOpen((o) => !o)} />
        </div>
      </div>
    </main>
  );
}
