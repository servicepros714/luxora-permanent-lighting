/* Live availability from the Worker (source-scoped there). One shared fetch for the whole app. */
import { useEffect, useState } from 'react';
import { api, API_BASE } from './api.js';
import { TIME_WINDOWS } from '../data/business.js';
import { seasonDays, seasonWeeks, seasonYear, leadOk, todayPT } from './time.js';

let state = { loading: true, offline: !API_BASE, error: '', taken: new Set(), at: 0 };
const subs = new Set();
let inflight = null;

function set(next) { state = { ...state, ...next }; subs.forEach((f) => f(state)); }

export function refreshAvailability(force = false) {
  if (!API_BASE) { set({ loading: false, offline: true }); return Promise.resolve(state); }
  if (inflight) return inflight;
  if (!force && state.at && Date.now() - state.at < 30000) return Promise.resolve(state);
  inflight = api('/api/availability')
    .then((d) => set({ loading: false, error: '', taken: new Set((d.taken || []).map((t) => `${t.date}|${t.time}`)), at: Date.now() }))
    .catch((e) => set({ loading: false, error: e.message }))
    .finally(() => { inflight = null; });
  return inflight;
}

export function useAvailability() {
  const [s, setS] = useState(state);
  useEffect(() => {
    subs.add(setS);
    refreshAvailability();
    return () => subs.delete(setS);
  }, []);
  return s;
}

export const slotOpen = (s, date, time, now = Date.now()) => leadOk(date, time, now) && !s.taken.has(`${date}|${time}`);

export function openWindows(s, date, now) {
  return TIME_WINDOWS.filter((w) => slotOpen(s, date, w.id, now)).map((w) => w.id);
}

export function earliestOpen(s, now = Date.now()) {
  for (const d of seasonDays(seasonYear(now))) {
    const w = openWindows(s, d, now);
    if (w.length) return { date: d, time: w[0] };
  }
  return null;
}

export function weekStats(s, now = Date.now()) {
  const today = todayPT(now);
  const year = seasonYear(now);
  return seasonWeeks(year).map((w) => {
    const cap = w.days.length * TIME_WINDOWS.length;
    let open = 0;
    let future = 0;
    let first = null;
    for (const d of w.days) {
      for (const t of TIME_WINDOWS) {
        if (leadOk(d, t.id, now)) {
          future++;
          if (!s.taken.has(`${d}|${t.id}`)) { open++; if (!first) first = d; }
        }
      }
    }
    const status = future === 0 ? 'passed' : open === 0 ? 'full' : open <= Math.ceil(cap * 0.3) ? 'filling' : 'open';
    const isNow = w.days.includes(today) || (today >= w.monday && today <= w.days[w.days.length - 1]);
    return { ...w, cap, open, status, first, isNow };
  });
}
