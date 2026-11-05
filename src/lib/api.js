export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export async function api(path, { method = 'GET', body } = {}) {
  if (!API_BASE) {
    const e = new Error('The booking system isn’t connected yet. Please call us to book.');
    e.offline = true;
    throw e;
  }
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('We couldn’t reach the booking system. Check your connection and try again.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const e = new Error(data.error || `Request failed (${res.status})`);
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return data;
}
