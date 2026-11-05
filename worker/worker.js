/**
 * Luxora Permanent Lighting — booking API (Cloudflare Worker)
 * Worker name: luxora-api · Source tag: luxora · Booking ID prefix: LUX-
 *
 * Dashboard setup (no CLI):
 *   • D1 binding:  DB  → your shared bookings database (run worker/schema.sql once in the D1 console)
 *   • Secret:      STRIPE_SECRET_KEY  (sk_test_… / sk_live_…)
 *   • Optional:    ADMIN_TOKEN  (enables GET/PATCH admin routes; they stay closed without it)
 *   • Optional:    ALLOWED_ORIGIN  (e.g. https://luxora-permanent-lighting.pages.dev — defaults to *)
 *
 * Routes:
 *   GET   /api/availability            → taken slots for this source
 *   POST  /api/create-payment-intent   → $149 deposit PaymentIntent (idempotent per draft ref)
 *   POST  /api/bookings                → save booking ('Paid' verified with Stripe, or 'Pay Later')
 *   GET   /api/bookings                → admin list (Bearer ADMIN_TOKEN)
 *   PATCH /api/bookings/:id            → admin update of PATCHABLE fields (Bearer ADMIN_TOKEN)
 */

const SOURCE = 'luxora';
const ID_PREFIX = 'LUX-';
const DRAFT_RE = /^LXR-[A-Z0-9]{6,24}$/;
const DEPOSIT_CENTS = 14900;
const TIME_WINDOWS = ['8AM–12PM', '12PM–4PM']; // en dash — stored exactly like this
const WINDOW_START = { '8AM–12PM': 8, '12PM–4PM': 12 };
const TYPES = ['Permanent', 'Seasonal'];
const SEASON = { startMonth: 10, startDay: 20, endMonth: 12, endDay: 20 };
const LEAD_HOURS = 48;
const PATCHABLE = ['status', 'reschedule_date', 'reschedule_time', 'notes2', 'original_date', 'original_time', 'payment_status', 'date', 'time'];
const COLUMNS = ['id', 'date', 'time', 'service', 'name', 'phone', 'email', 'vehicle', 'address', 'notes', 'source', 'created_at', 'status', 'reschedule_date', 'reschedule_time', 'notes2', 'original_date', 'original_time', 'payment_status'];

// Each statement runs on its own with prepare().run() — D1's exec() splits on newlines and breaks multi-line SQL.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL, service TEXT, name TEXT, phone TEXT, email TEXT, vehicle TEXT, address TEXT, notes TEXT, source TEXT, created_at TEXT, status TEXT DEFAULT 'Booked', reschedule_date TEXT, reschedule_time TEXT, notes2 TEXT, original_date TEXT, original_time TEXT, payment_status TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_source_date ON bookings (source, date)`,
];

let schemaReady = null;
function ensureSchema(env) {
  // Never blocks payments: only booking/availability routes call this, and failures are logged, not thrown.
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const sql of SCHEMA) await env.DB.prepare(sql).run();
    })().catch((e) => { console.log('ensureSchema skipped:', e && e.message); schemaReady = null; });
  }
  return schemaReady;
}

/* ── CORS / responses ─────────────────────────────────────── */
function cors(env, req) {
  const allowed = (env.ALLOWED_ORIGIN || '*').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get('Origin') || '';
  const allow = allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
const json = (data, status, headers) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

/* ── Pacific time (DST-aware) ─────────────────────────────── */
const ptFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function ptParts(ms) {
  const p = {};
  for (const { type, value } of ptFmt.formatToParts(new Date(ms))) p[type] = value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute };
}
function ptToMs(y, m, d, h = 0, mi = 0) {
  const target = Date.UTC(y, m - 1, d, h, mi);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = ptParts(guess);
    guess += target - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
  }
  return guess;
}
function validSeasonDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
  const v = m * 100 + d;
  return v >= SEASON.startMonth * 100 + SEASON.startDay && v <= SEASON.endMonth * 100 + SEASON.endDay;
}
function passesLead(date, time, now = Date.now()) {
  const [y, m, d] = date.split('-').map(Number);
  return ptToMs(y, m, d, WINDOW_START[time] ?? 8, 0) >= now + LEAD_HOURS * 3600000;
}

/* ── helpers ──────────────────────────────────────────────── */
// A rescheduled booking occupies its reschedule slot; Cancelled bookings free their slot.
const activeSql = `COALESCE(status, '') <> 'Cancelled'`;
const slotSql = `COALESCE(NULLIF(reschedule_date, ''), date)`;
const timeSql = `COALESCE(NULLIF(reschedule_time, ''), time)`;

const clean = (v, max = 200) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max) : '');

function newId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = new Uint8Array(7);
  crypto.getRandomValues(b);
  return ID_PREFIX + Array.from(b, (x) => chars[x % chars.length]).join('');
}

function buildNotes(type, clientNotes, ref, piId, conflict) {
  // strip anything that could spoof the idempotency markers
  const safe = clean(clientNotes, 500).replace(/\b(Ref|PI)\s*:/gi, '').replace(/SLOT CONFLICT/gi, '');
  const parts = [`Type: ${type}`];
  if (safe) parts.push(safe);
  parts.push(piId ? `Deposit: $${DEPOSIT_CENTS / 100} paid` : 'Deposit: pay at visit');
  parts.push(`Ref: ${ref}`);
  if (piId) parts.push(`PI: ${piId}`);
  if (conflict) parts.push('SLOT CONFLICT — window was taken first; call customer to reschedule');
  return parts.join(' | ');
}

async function insert(env, r) {
  await env.DB.prepare(`INSERT INTO bookings (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`)
    .bind(...COLUMNS.map((c) => r[c] ?? null)).run();
}

async function stripe(env, method, path, params, idemKey) {
  if (!env.STRIPE_SECRET_KEY) { const e = new Error('Payments are not configured.'); e.status = 503; throw e; }
  const headers = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
  let body;
  if (params) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(params).toString();
  }
  if (idemKey) headers['Idempotency-Key'] = idemKey;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers, body });
  const data = await res.json();
  if (!res.ok) { const e = new Error(data?.error?.message || 'Stripe error'); e.status = 502; throw e; }
  return data;
}

function isAdmin(env, req) {
  if (!env.ADMIN_TOKEN) return false;
  return (req.headers.get('Authorization') || '') === `Bearer ${env.ADMIN_TOKEN}`;
}

/* ── routes ───────────────────────────────────────────────── */
async function availability(env, H) {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    `SELECT ${slotSql} AS date, ${timeSql} AS time FROM bookings WHERE source = ? AND ${activeSql}`,
  ).bind(SOURCE).all();
  const taken = (results || []).filter((r) => validSeasonDate(r.date) && TIME_WINDOWS.includes(r.time));
  return json({ source: SOURCE, taken, leadHours: LEAD_HOURS, windows: TIME_WINDOWS }, 200, H);
}

async function createPaymentIntent(env, req, H) {
  // No ensureSchema here — schema work must never block a payment.
  let b;
  try { b = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400, H); }
  const ref = clean(b?.ref, 40);
  if (!DRAFT_RE.test(ref)) return json({ error: 'Invalid booking reference.' }, 400, H);
  const pi = await stripe(env, 'POST', 'payment_intents', {
    amount: String(DEPOSIT_CENTS),
    currency: 'usd',
    'automatic_payment_methods[enabled]': 'true',
    description: 'Luxora Permanent Lighting — reservation deposit',
    'metadata[ref]': ref,
    'metadata[source]': SOURCE,
  }, `luxora-pi-${ref}`);
  return json({ clientSecret: pi.client_secret, id: pi.id }, 200, H);
}

async function createBooking(env, req, H) {
  let raw;
  try { raw = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400, H); }
  await ensureSchema(env);
  const b = {
    ref: clean(raw.ref, 40),
    type: clean(raw.type, 20),
    service: clean(raw.service, 120),
    vehicle: clean(raw.vehicle, 300),
    date: clean(raw.date, 10),
    time: clean(raw.time, 20),
    name: clean(raw.name, 120),
    phone: clean(raw.phone, 40),
    email: clean(raw.email, 160),
    address: clean(raw.address, 300),
    notes: clean(raw.notes, 500),
    payment_status: clean(raw.payment_status, 20),
    paymentIntentId: clean(raw.paymentIntentId, 80),
  };
  if (!DRAFT_RE.test(b.ref)) return json({ error: 'Invalid booking reference.' }, 400, H);
  if (!TYPES.includes(b.type)) return json({ error: 'Choose Permanent or Seasonal lighting.' }, 400, H);
  if (!b.service) return json({ error: 'Choose a package.' }, 400, H);
  if (!b.vehicle) return json({ error: 'Home details are missing.' }, 400, H);
  if (b.name.length < 2) return json({ error: 'Enter your full name.' }, 400, H);
  if ((b.phone.match(/\d/g) || []).length < 10) return json({ error: 'Enter a valid phone number.' }, 400, H);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.email)) return json({ error: 'Enter a valid email address.' }, 400, H);
  if (b.address.length < 6) return json({ error: 'Enter the service address.' }, 400, H);
  if (!TIME_WINDOWS.includes(b.time)) return json({ error: 'Invalid time window.' }, 400, H);
  if (!validSeasonDate(b.date)) return json({ error: 'Install dates run Oct 20 – Dec 20.' }, 400, H);
  if (!['Paid', 'Pay Later'].includes(b.payment_status)) return json({ error: 'Invalid payment status.' }, 400, H);
  if (!b.vehicle.startsWith(b.type)) b.vehicle = `${b.type} · ${b.vehicle}`.slice(0, 300);

  const slotTaken = async () => !!(await env.DB.prepare(
    `SELECT 1 FROM bookings WHERE source = ? AND ${activeSql} AND ${slotSql} = ? AND ${timeSql} = ? LIMIT 1`,
  ).bind(SOURCE, b.date, b.time).first());

  const row = (notes) => ({
    id: newId(), date: b.date, time: b.time, service: b.service, name: b.name, phone: b.phone, email: b.email,
    vehicle: b.vehicle, address: b.address, notes, source: SOURCE, created_at: new Date().toISOString(),
    status: 'Booked', reschedule_date: null, reschedule_time: null, notes2: null, original_date: null, original_time: null,
    payment_status: b.payment_status,
  });

  if (b.payment_status === 'Paid') {
    if (!/^pi_[A-Za-z0-9_]+$/.test(b.paymentIntentId)) return json({ error: 'Missing payment reference.' }, 400, H);
    // idempotent per PaymentIntent
    const existing = await env.DB.prepare(`SELECT id FROM bookings WHERE source = ? AND notes LIKE ? LIMIT 1`).bind(SOURCE, `%PI: ${b.paymentIntentId}%`).first();
    if (existing) return json({ id: existing.id, duplicate: true }, 200, H);
    // verify with Stripe before saving 'Paid'
    const pi = await stripe(env, 'GET', `payment_intents/${encodeURIComponent(b.paymentIntentId)}`);
    const okStatus = ['succeeded', 'processing', 'requires_capture'].includes(pi.status);
    if (!okStatus || pi.amount !== DEPOSIT_CENTS || pi.currency !== 'usd' || pi.metadata?.ref !== b.ref) {
      return json({ error: 'Payment could not be verified.' }, 402, H);
    }
    // A paid booking is always saved; a lost slot race is flagged for a call-back.
    const conflict = await slotTaken();
    const r = row(buildNotes(b.type, b.notes, b.ref, pi.id, conflict));
    await insert(env, r);
    return json({ id: r.id, conflict }, 201, H);
  }

  // Pay Later — idempotent per draft ref, inserted atomically only if the slot is free
  const existing = await env.DB.prepare(`SELECT id FROM bookings WHERE source = ? AND notes LIKE ? LIMIT 1`).bind(SOURCE, `%Ref: ${b.ref}%`).first();
  if (existing) return json({ id: existing.id, duplicate: true }, 200, H);
  if (!passesLead(b.date, b.time)) return json({ error: `Please pick a window at least ${LEAD_HOURS} hours from now.` }, 400, H);
  const r = row(buildNotes(b.type, b.notes, b.ref, null, false));
  const res = await env.DB.prepare(
    `INSERT INTO bookings (${COLUMNS.join(', ')}) SELECT ${COLUMNS.map(() => '?').join(', ')}
     WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE source = ? AND ${activeSql} AND ${slotSql} = ? AND ${timeSql} = ?)`,
  ).bind(...COLUMNS.map((c) => r[c] ?? null), SOURCE, b.date, b.time).run();
  if (!res.meta || !res.meta.changes) return json({ error: 'That time window was just taken. Please pick another.' }, 409, H);
  return json({ id: r.id }, 201, H);
}

async function adminList(env, url, H) {
  await ensureSchema(env);
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || '200', 10) || 200));
  const { results } = await env.DB.prepare(`SELECT ${COLUMNS.join(', ')} FROM bookings WHERE source = ? ORDER BY date ASC, time ASC LIMIT ?`).bind(SOURCE, limit).all();
  return json({ source: SOURCE, bookings: results || [] }, 200, H);
}

async function adminPatch(env, id, body, H) {
  await ensureSchema(env);
  const sets = [];
  const vals = [];
  for (const k of PATCHABLE) {
    if (body && Object.prototype.hasOwnProperty.call(body, k)) {
      sets.push(`${k} = ?`);
      vals.push(body[k] === null ? null : clean(String(body[k]), 1000));
    }
  }
  if (!sets.length) return json({ error: 'Nothing to update.' }, 400, H);
  const res = await env.DB.prepare(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ? AND source = ?`).bind(...vals, id, SOURCE).run();
  if (!res.meta || !res.meta.changes) return json({ error: 'Booking not found.' }, 404, H);
  return json({ ok: true, id }, 200, H);
}

export default {
  async fetch(req, env) {
    const H = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: H });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '');
    try {
      if (path === '/api/availability' && req.method === 'GET') return await availability(env, H);
      if (path === '/api/create-payment-intent' && req.method === 'POST') return await createPaymentIntent(env, req, H);
      if (path === '/api/bookings' && req.method === 'POST') return await createBooking(env, req, H);
      if (path === '/api/bookings' && req.method === 'GET') {
        if (!isAdmin(env, req)) return json({ error: 'Unauthorized' }, 401, H);
        return await adminList(env, url, H);
      }
      const m = path.match(/^\/api\/bookings\/([A-Za-z0-9-]+)$/);
      if (m && req.method === 'PATCH') {
        if (!isAdmin(env, req)) return json({ error: 'Unauthorized' }, 401, H);
        let body;
        try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400, H); }
        return await adminPatch(env, m[1], body, H);
      }
      if (path === '' || path === '/api' || path === '/api/health') return json({ ok: true, source: SOURCE }, 200, H);
      return json({ error: 'Not found' }, 404, H);
    } catch (e) {
      console.log('Worker error:', e && e.stack);
      return json({ error: e.message || 'Server error' }, e.status || 500, H);
    }
  },
};
