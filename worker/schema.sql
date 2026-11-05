-- Shared bookings table (same columns as every site so the admin dashboard works).
-- Run in the Cloudflare dashboard: D1 → your database → Console. Safe to run more than once.
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  service TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  vehicle TEXT,
  address TEXT,
  notes TEXT,
  source TEXT,
  created_at TEXT,
  status TEXT DEFAULT 'Booked',
  reschedule_date TEXT,
  reschedule_time TEXT,
  notes2 TEXT,
  original_date TEXT,
  original_time TEXT,
  payment_status TEXT
);
CREATE INDEX IF NOT EXISTS idx_bookings_source_date ON bookings (source, date);
