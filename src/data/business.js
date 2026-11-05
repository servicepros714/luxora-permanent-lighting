/* ─────────────────────────────────────────────────────────────
   Luxora Permanent Lighting — business details & pricing
   Everything marked TODO is a placeholder to fill in.
   ───────────────────────────────────────────────────────────── */

export const BUSINESS = {
  name: 'Luxora Permanent Lighting',
  short: 'Luxora',
  phone: '555-555-555', // TODO: only 9 digits were provided — use the full 10-digit number
  phoneHref: 'tel:555555555', // TODO: match the phone above, digits only, e.g. tel:+17145550123
  city: 'Your City', // TODO: home-base city
  state: 'CA',
  address: '123 Placeholder St, Your City, CA 00000', // TODO: street address
  hours: 'Mon – Sun · 8 AM – 6 PM', // TODO: confirm hours
};

/* Plumbing IDs — must match worker/worker.js */
export const SOURCE_TAG = 'luxora';
export const BOOKING_PREFIX = 'LUX-';
export const DRAFT_PREFIX = 'LXR-';

/* Reservation deposit (USD), applied to the final invoice. Must match DEPOSIT_CENTS in the Worker. */
export const DEPOSIT = 149;

/* Install season (Pacific time, inclusive), every day Mon–Sun. Month is 1-based. */
export const SEASON = { startMonth: 10, startDay: 20, endMonth: 12, endDay: 20 };
export const LEAD_HOURS = 48;

/* `id` is the exact value stored in the D1 `time` column (en dash). `start` = 24h hour, Pacific. */
export const TIME_WINDOWS = [
  { id: '8AM–12PM', label: '8 AM – 12 PM', part: 'Morning', start: 8 },
  { id: '12PM–4PM', label: '12 PM – 4 PM', part: 'Afternoon', start: 12 },
];

export const TAKEDOWN = 'the first two weeks of January'; // TODO: confirm takedown timing

/* Booking step 1 */
export const LIGHTING_TYPES = [
  {
    id: 'Permanent',
    name: 'Permanent',
    tagline: 'Installed once, lit every night you choose',
    blurb: 'A low-profile track along your roofline that stays up all year — warm white for every night, color for every holiday.',
  },
  {
    id: 'Seasonal',
    name: 'Seasonal',
    tagline: 'Christmas install, maintained & taken down',
    blurb: 'Leased commercial-grade LEDs for the holidays. We design, install, maintain and take them down.',
  },
];

/* Packages — prices are "starting at". price: null → shows "Online quoting".
   TODO: set prices when ready, e.g. price: { Seasonal: 499, Permanent: null } */
export const PACKAGES = [
  {
    id: 'Front Only',
    numeral: 'I',
    name: 'Front Only',
    coverage: 'The roofline that faces the street',
    price: { Seasonal: null, Permanent: null },
    features: {
      Seasonal: [
        'Professional design for the front of the home',
        'Commercial-grade LED lights (leased, no purchase needed)',
        'Roofline & gutter-line installation',
        'Timer setup',
        'In-season maintenance & bulb replacement',
        'Takedown after the holidays',
      ],
      Permanent: [
        'Professional design for the front of the home',
        'Low-profile track along the front roofline & gutter line',
        'App-controlled LEDs — colors, scenes & schedules',
        'Timer & schedule setup',
        'Stays up year-round — no yearly install or takedown',
      ],
    },
  },
  {
    id: 'Front & Sides',
    numeral: 'II',
    name: 'Front & Sides',
    coverage: 'Front plus the side rooflines',
    featured: 'Most coverage',
    price: { Seasonal: null, Permanent: null },
    features: {
      Seasonal: ['Everything in Front Only', 'Side rooflines & gutters', 'Expanded custom design'],
      Permanent: ['Everything in Front Only', 'Track along the side rooflines & gutters', 'Expanded custom design & scene setup'],
    },
  },
];

export const STORIES = [
  { id: '1-Story', name: '1-story home', note: 'Single-level roofline' },
  { id: '2-Story', name: '2-story home', note: '+50% of package price', pct: 50 },
];

/* Add-ons. price: null → "Online quoting". flat: true = flat price (not "+").
   seasonalOnly: hidden when Permanent is chosen. TODO: set add-on prices. */
export const ADDONS = [
  { id: 'trees', name: 'Tree & bush wrapping', short: 'Trees & bushes', price: null, icon: 'tree' },
  { id: 'wreaths', name: 'Wreaths / garland', short: 'Wreaths', price: null, icon: 'wreath' },
  { id: 'pathway', name: 'Pathway / stake lights', short: 'Pathway', price: null, icon: 'path' },
  { id: 'own', name: 'Install customer-owned lights', short: 'Your lights', price: null, flat: true, icon: 'plug' },
  { id: 'storage', name: 'Off-season storage', short: 'Storage', price: null, seasonalOnly: true, icon: 'box' },
];

export const PERMANENT_NOTE = 'Going permanent? The track is mounted once — no yearly install or takedown. Your exact price comes with your online quote.';

/* TODO: replace with the real cities your crew covers. The first one is the home base. */
export const SERVICE_AREA = [
  'Your City',
  'Nearby City 1',
  'Nearby City 2',
  'Nearby City 3',
  'Nearby City 4',
  'Nearby City 5',
  'Nearby City 6',
  'Nearby City 7',
];

export const HOW_STEPS = [
  { id: 'book', numeral: 'I', title: 'Book', icon: 'calendar', text: 'Choose Permanent or Seasonal, your package and an install window online. Reserve with a $149 deposit or pay at the visit.' },
  { id: 'design', numeral: 'II', title: 'Design', icon: 'compass', text: 'We walk your roofline, check outlets and timers, and confirm the design and final price with you before anything goes up.' },
  { id: 'install', numeral: 'III', title: 'Install', icon: 'ladder', text: 'Our crew mounts and tests every run, sets your timer or app schedule, and leaves the yard clean.' },
  { id: 'takedown', numeral: 'IV', title: 'Takedown', icon: 'box', text: `Seasonal lights come down in ${TAKEDOWN}. Permanent track stays up — just change the scene.` },
];

/* Reviews — never invent these. TODO: add real reviews as { name, text, source } */
export const REVIEWS = [];

export const FAQS = [
  {
    q: 'Do you need my outlets or power?',
    a: 'Yes — the lights run on your home’s standard exterior outlets. During the design visit we find the nearest outlets, check that they’re working and plan the runs so no circuit is overloaded. If an outlet is missing or not working, we’ll tell you before install day.',
  },
  {
    q: 'Do I lease or own the lights?',
    a: 'Seasonal installs use our commercial-grade LEDs on a lease, so there’s nothing to buy, store or untangle. Permanent lighting is mounted on your home to stay; your quote spells out the ownership and warranty terms before you commit.',
  },
  {
    q: 'How do the timers work?',
    a: 'Seasonal displays get a timer set to the hours you want, so the lights come on at dusk and switch off at night on their own. Permanent systems run on a schedule you control from the app, with scenes for every holiday.',
  },
  {
    q: 'What happens in rain or wind?',
    a: 'Everything we hang is rated for outdoor use and secured with clips made for rooflines and gutters. If a storm knocks something loose or a bulb goes out during the season, call us and we’ll fix it as part of in-season maintenance.',
  },
  {
    q: 'When do you take the lights down?',
    a: `Seasonal lights come down in ${TAKEDOWN}. We schedule takedown with you, and you don’t need to be home. Permanent track stays up all year.`,
  },
  {
    q: 'What does permanent track look like in the daytime?',
    a: 'It’s a low-profile channel that runs along the roofline or fascia, so it sits quietly by day. At night it lights in warm white or any color scene you choose.',
  },
  {
    q: 'Can you hang lights I already own?',
    a: 'Yes. Choose “Install customer-owned lights” as an add-on when you book, and we’ll check your strands at the design visit before they go up.',
  },
  {
    q: 'What is the $149 deposit for?',
    a: `It reserves your install window and is applied to your final invoice. Prefer to pay later? Choose “I’ll pay at the visit” at checkout.`,
  },
];

/* Gallery — illustrated scenes until real install photos are added (tagged "Design preview"). */
export const GALLERY = [
  { id: 'g1', title: 'Warm-white roofline', look: 'Warm white', type: 'Permanent', coverage: 'Front & Sides', house: 'gable', colors: ['#FFD98A'], extras: [], text: 'A single warm-white line that traces every peak — the everyday look for permanent track.' },
  { id: 'g2', title: 'Classic multicolor', look: 'Multicolor C9', type: 'Seasonal', coverage: 'Front Only', house: 'ranch', colors: ['#E8402F', '#2FB55C', '#3C7BF0', '#FDD23A'], extras: ['wreath'], text: 'Big retro-style bulbs in red, green, blue and gold along a long ranch roofline.' },
  { id: 'g3', title: 'Red & white', look: 'Red & white', type: 'Seasonal', coverage: 'Front & Sides', house: 'cottage', colors: ['#E3342F', '#FFF4E0'], extras: ['trees'], text: 'Candy-cane alternating bulbs with wrapped shrubs at the porch.' },
  { id: 'g4', title: 'Gilded gold', look: 'Gold', type: 'Permanent', coverage: 'Front & Sides', house: 'gable', colors: ['#F2B21B'], extras: ['path'], text: 'A rich gold scene with stake lights leading up the walk.' },
  { id: 'g5', title: 'Cool winter white', look: 'Cool white', type: 'Seasonal', coverage: 'Front Only', house: 'cottage', colors: ['#DDEBFF'], extras: ['wreath', 'trees'], text: 'Crisp cool white, a wreath on the door and lit shrubs below.' },
  { id: 'g6', title: 'Holiday scene mode', look: 'Red, green & gold', type: 'Permanent', coverage: 'Front & Sides', house: 'ranch', colors: ['#E3342F', '#2FB55C', '#F2B21B'], extras: ['path', 'trees'], text: 'Permanent track switched to a Christmas scene — the same lights run warm white the rest of the year.' },
];
