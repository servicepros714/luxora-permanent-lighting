/* Booking draft shared by the homepage (picks carry into booking), /book and /checkout. */
import { useSyncExternalStore } from 'react';
import { ADDONS, PACKAGES, STORIES, DRAFT_PREFIX } from '../data/business.js';

const KEY = 'luxora-draft-v1';
const EMPTY = { type: '', pkg: '', stories: '', addons: [], date: '', time: '', name: '', phone: '', email: '', address: '', ref: '' };

function newRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return DRAFT_PREFIX + Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function load() {
  try {
    const d = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (d && typeof d === 'object') return { ...EMPTY, ...d, addons: Array.isArray(d.addons) ? d.addons : [] };
  } catch { /* storage blocked */ }
  return { ...EMPTY };
}

let draft = load();
if (!draft.ref) draft.ref = newRef();
const subs = new Set();

function save() {
  try { sessionStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

export function updateDraft(patch) {
  const next = { ...draft, ...(typeof patch === 'function' ? patch(draft) : patch) };
  if (next.type === 'Permanent') next.addons = next.addons.filter((id) => !ADDONS.find((a) => a.id === id)?.seasonalOnly);
  draft = next;
  save();
}

export function resetDraft() { draft = { ...EMPTY, ref: newRef() }; save(); }

export const getDraft = () => draft;
export function useDraft() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => draft, () => draft);
}

export const toggleAddon = (id) => updateDraft((d) => ({ addons: d.addons.includes(id) ? d.addons.filter((x) => x !== id) : [...d.addons, id] }));

/* ── Pricing ─────────────────────────────────────────────── */
export const money = (n) => `$${Number(n).toLocaleString('en-US')}`;
export const priceLabel = (n) => (n == null ? 'Online quoting' : money(n));
export const addonLabel = (a) => (a.price == null ? 'Online quoting' : a.flat ? money(a.price) : `+${money(a.price)}`);

export function estimate(d) {
  const pkg = PACKAGES.find((p) => p.id === d.pkg);
  if (!pkg || !d.type) return null;
  const base = pkg.price[d.type];
  if (d.type === 'Permanent' || base == null) return { label: 'Online quoting', amount: null };
  const st = STORIES.find((s) => s.id === d.stories);
  let total = base * (1 + (st?.pct || 0) / 100);
  let quoted = false;
  for (const id of d.addons) {
    const a = ADDONS.find((x) => x.id === id);
    if (!a) continue;
    if (a.price == null) quoted = true; else total += a.price;
  }
  return { amount: Math.round(total), label: `${money(Math.round(total))}${quoted ? ' + quoted add-ons' : ''}` };
}

export function addonNames(d) {
  return d.addons.map((id) => ADDONS.find((a) => a.id === id)).filter(Boolean);
}

/* D1 `vehicle` column, e.g. "Seasonal · 2-Story · Front & Sides · +Wreaths" */
export function vehicleString(d) {
  const parts = [d.type, d.stories, d.pkg, ...addonNames(d).map((a) => `+${a.short}`)];
  return parts.filter(Boolean).join(' · ');
}
