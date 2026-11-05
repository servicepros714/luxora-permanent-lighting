# Luxora Permanent Lighting — website + booking

Vite + React site with a 6-step booking flow, live availability from a Cloudflare Worker + D1, and a $149 Stripe reservation deposit (or "I'll pay at the visit").

| | |
|---|---|
| Source tag | `luxora` |
| Booking ID prefix | `LUX-` |
| Draft ref prefix | `LXR-` (Stripe Idempotency-Key `luxora-pi-<ref>`) |
| Worker | `luxora-api` |
| Pages project | `luxora-permanent-lighting` |

## Placeholders to fill in (search for `TODO`)
- `src/data/business.js` — phone (only 9 digits were provided: `555-555-555`), `phoneHref`, city, street address, hours, service-area cities, takedown timing, package and add-on prices (unset prices show "Online quoting"), reviews.
- `index.html` — "Your City" in the title, description, OG tags and LocalBusiness JSON-LD; street address and phone in the JSON-LD.
- Gallery scenes are illustrated and tagged "Design preview" until real install photos are added.

## Run locally (Windows CMD)
```cmd
cd luxora-permanent-lighting
copy .env.example .env.local
notepad .env.local
npm install
npm run dev
```
Put your Stripe publishable key and Worker URL in `.env.local`.

## Upload to GitHub (Windows CMD)
Create an empty repo named `luxora-permanent-lighting` under `servicepros714` first, then:
```cmd
cd luxora-permanent-lighting
git init
git add .
git commit -m "Luxora Permanent Lighting site"
git branch -M main
git remote add origin https://github.com/servicepros714/luxora-permanent-lighting.git
git push -u origin main
```

## Cloudflare setup (dashboard only)
1. **D1** — open your shared bookings database → Console → paste and run `worker/schema.sql` (safe to run more than once).
2. **Worker** — Workers & Pages → Create → Worker named `luxora-api` → Edit code → paste `worker/worker.js` → Deploy. Then in Settings:
   - Bindings → D1 database → variable name `DB` → your bookings database
   - Variables and Secrets → `STRIPE_SECRET_KEY` (Secret)
   - Optional: `ADMIN_TOKEN` (Secret) to open the admin GET/PATCH routes; `ALLOWED_ORIGIN` = your Pages URL (defaults to `*`)
3. **Pages** — create a Pages project named `luxora-permanent-lighting` (Direct Upload is fine; GitHub Actions deploys into it).
4. **GitHub repo → Settings → Secrets and variables → Actions**, add:
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_API_URL` (the Worker URL, no trailing slash).
   Every push to `main` builds and deploys (`.github/workflows/deploy.yml`; no npm cache because no lockfile is shipped).
5. **Stripe** — enable the wallets you want. Apple Pay needs your Pages domain verified in Stripe.

## Booking data (shared D1 columns — no new columns)
- `vehicle`: `Seasonal · 2-Story · Front & Sides · +Wreaths` (lighting type first)
- `service`: `Front & Sides (Seasonal)`
- `time`: `8AM–12PM` / `12PM–4PM` (en dash)
- `notes`: `Type: … | Add-ons: … | Estimate: … | Deposit: … | Ref: LXR-… | PI: pi_…`
- `status` defaults to `Booked`; `payment_status` is `Paid` or `Pay Later`
- PATCHABLE: status, reschedule_date, reschedule_time, notes2, original_date, original_time, payment_status, date, time

## Worker behavior
- Availability is source-scoped (`AND source = ?`). A rescheduled booking occupies its reschedule slot; Cancelled bookings free their slot.
- `Paid` bookings are verified with Stripe (status, amount, currency, draft ref) before saving, and are idempotent per PaymentIntent. A paid booking that loses a slot race is still saved and flagged `SLOT CONFLICT` in notes.
- `Pay Later` bookings are idempotent per draft ref and inserted atomically (`INSERT … WHERE NOT EXISTS`), so two people can't take the same window.
- Season Oct 20 – Dec 20, every day, Pacific time; earliest slot 48 hours out (DST-aware).
- Schema statements run one at a time with `prepare().run()` (no `.exec()`), and schema setup never runs on the payment route.
- Admin GET/PATCH routes stay closed unless `ADMIN_TOKEN` is set.
