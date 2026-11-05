/* Pacific-time helpers (DST-aware). Must match the Worker's math. */
import { SEASON, LEAD_HOURS, TIME_WINDOWS } from '../data/business.js';

const ptFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function ptParts(ms = Date.now()) {
  const p = {};
  for (const { type, value } of ptFmt.formatToParts(new Date(ms))) p[type] = value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute };
}

/* UTC ms for a Pacific wall-clock time. */
export function ptToMs(y, m, d, h = 0, mi = 0) {
  const target = Date.UTC(y, m - 1, d, h, mi);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = ptParts(guess);
    guess += target - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
  }
  return guess;
}

const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
export const splitIso = (iso) => iso.split('-').map(Number);

export function todayPT(now = Date.now()) {
  const p = ptParts(now);
  return isoDate(p.y, p.m, p.d);
}

/* The season the site is booking for: this year's, or next year's once Dec 20 has passed. */
export function seasonYear(now = Date.now()) {
  const p = ptParts(now);
  return p.m * 100 + p.d > SEASON.endMonth * 100 + SEASON.endDay ? p.y + 1 : p.y;
}

export function seasonDays(year = seasonYear()) {
  const out = [];
  const start = Date.UTC(year, SEASON.startMonth - 1, SEASON.startDay);
  const end = Date.UTC(year, SEASON.endMonth - 1, SEASON.endDay);
  for (let t = start; t <= end; t += 86400000) {
    const d = new Date(t);
    out.push(isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()));
  }
  return out;
}

export function slotStartMs(date, timeId) {
  const w = TIME_WINDOWS.find((t) => t.id === timeId);
  const [y, m, d] = splitIso(date);
  return ptToMs(y, m, d, w ? w.start : 8, 0);
}

export const leadOk = (date, timeId, now = Date.now()) => slotStartMs(date, timeId) >= now + LEAD_HOURS * 3600000;

export const weekday = (iso) => { const [y, m, d] = splitIso(iso); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

export function fmtDate(iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!iso) return '';
  const [y, m, d] = splitIso(iso);
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts }).format(new Date(Date.UTC(y, m - 1, d)));
}

/* Monday-start weeks across the season. */
export function seasonWeeks(year = seasonYear()) {
  const weeks = [];
  let cur = null;
  for (const iso of seasonDays(year)) {
    const wd = weekday(iso);
    if (!cur || wd === 1) { cur = { start: iso, days: [] }; weeks.push(cur); }
    cur.days.push(iso);
  }
  return weeks.map((w) => {
    const [y, m, d] = splitIso(w.start);
    const back = (weekday(w.start) + 6) % 7; // days back to Monday
    const mon = new Date(Date.UTC(y, m - 1, d - back));
    return { ...w, monday: isoDate(mon.getUTCFullYear(), mon.getUTCMonth() + 1, mon.getUTCDate()) };
  });
}
