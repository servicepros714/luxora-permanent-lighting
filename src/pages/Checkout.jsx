import { useEffect, useMemo, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { navigate, useLocation, Link } from '../lib/router.jsx';
import { BUSINESS, DEPOSIT } from '../data/business.js';
import { api, API_BASE, STRIPE_KEY } from '../lib/api.js';
import { useDraft, getDraft, resetDraft, estimate, addonNames, vehicleString } from '../lib/draft.js';
import { refreshAvailability } from '../lib/availability.js';
import { Concierge } from '../components/BookingBits.jsx';
import Icon from '../components/Icon.jsx';

const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;
const complete = (d) => d.type && d.pkg && d.stories && d.date && d.time && d.name && d.phone && d.email && d.address;

const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#BB8103',
    colorText: '#00122F',
    colorBackground: '#FFFFFF',
    colorDanger: '#B3261E',
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
    borderRadius: '4px',
  },
  rules: { '.Input': { borderColor: 'rgba(0,18,47,.22)' }, '.Input:focus': { borderColor: '#BB8103', boxShadow: '0 0 0 3px rgba(233,174,22,.25)' } },
};

async function saveBooking(payment_status, paymentIntentId) {
  const d = getDraft();
  const est = estimate(d);
  const adds = addonNames(d).map((a) => a.name);
  const body = {
    ref: d.ref,
    type: d.type,
    service: `${d.pkg} (${d.type})`,
    vehicle: vehicleString(d),
    date: d.date,
    time: d.time,
    name: d.name.trim(),
    phone: d.phone.trim(),
    email: d.email.trim(),
    address: d.address.trim(),
    notes: `Add-ons: ${adds.length ? adds.join(', ') : 'None'} | Estimate: ${est ? est.label : 'Online quoting'}`,
    payment_status,
    paymentIntentId: paymentIntentId || undefined,
  };
  const r = await api('/api/bookings', { method: 'POST', body });
  try {
    sessionStorage.setItem('luxora-confirmation', JSON.stringify({
      id: r.id, conflict: !!r.conflict, payment_status, type: d.type, pkg: d.pkg, stories: d.stories,
      addons: adds, date: d.date, time: d.time, name: body.name, phone: body.phone, email: body.email, address: body.address,
      estimate: est ? est.label : 'Online quoting',
    }));
  } catch { /* ignore */ }
  resetDraft();
  refreshAvailability(true);
  navigate('/confirmation', { replace: true });
}

function PayForm({ clientSecret, onError, busy, setBusy }) {
  const stripe = useStripe();
  const elements = useElements();
  const [hasExpress, setHasExpress] = useState(false);
  const returnUrl = `${window.location.origin}/checkout`;

  const finish = async (pi) => {
    try { await saveBooking('Paid', pi.id); } catch (e) {
      onError(`Your payment went through, but we couldn’t save the booking (${e.message}). Please call ${BUSINESS.phone} and mention reference ${getDraft().ref}.`, true);
      setBusy(false);
    }
  };

  // Express path: the wallet sheet already collected payment details, so no elements.submit() here.
  const onExpress = async () => {
    if (!stripe || !elements) return;
    setBusy(true); onError('');
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: returnUrl }, redirect: 'if_required' });
    if (error) { onError(error.message || 'Payment failed.'); setBusy(false); return; }
    await finish(paymentIntent);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true); onError('');
    const { error: subErr } = await elements.submit();
    if (subErr) { onError(subErr.message || 'Check your payment details.'); setBusy(false); return; }
    const d = getDraft();
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: returnUrl, payment_method_data: { billing_details: { name: d.name, email: d.email, phone: d.phone } } },
      redirect: 'if_required',
    });
    if (error) { onError(error.message || 'Payment failed.'); setBusy(false); return; }
    await finish(paymentIntent);
  };

  return (
    <form onSubmit={onSubmit} className="pay">
      <div className="pay__express">
        <ExpressCheckoutElement
          onConfirm={onExpress}
          onReady={({ availablePaymentMethods }) => setHasExpress(!!availablePaymentMethods)}
          options={{ buttonHeight: 48 }}
        />
      </div>
      {hasExpress && <p className="pay__or"><span>or pay by card</span></p>}
      <PaymentElement options={{ layout: 'tabs', fields: { billingDetails: { name: 'auto' } } }} />
      <button type="submit" className="btn btn--gold btn--lg btn--block" disabled={!stripe || busy}>
        <Icon name="lock" size={18} />{busy ? 'Processing…' : `Pay $${DEPOSIT} deposit`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const d = useDraft();
  const { search } = useLocation();
  const [clientSecret, setClientSecret] = useState('');
  const [piError, setPiError] = useState('');
  const [error, setError] = useState('');
  const [sticky, setSticky] = useState(false);
  const [busy, setBusy] = useState(false);
  const [later, setLater] = useState(false);
  const [sumOpen, setSumOpen] = useState(false);
  const handled = useRef(false);
  const canPay = !!(stripePromise && API_BASE);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Returning from a redirect-based payment method
  useEffect(() => {
    if (handled.current) return;
    const pi = search.get('payment_intent');
    const status = search.get('redirect_status');
    if (!pi) return;
    handled.current = true;
    window.history.replaceState({}, '', '/checkout');
    if (status === 'succeeded' || status === 'processing') {
      setBusy(true);
      saveBooking('Paid', pi).catch((e) => {
        setError(`Your payment went through, but we couldn’t save the booking (${e.message}). Please call ${BUSINESS.phone} and mention reference ${getDraft().ref}.`);
        setSticky(true);
        setBusy(false);
      });
    } else {
      setError('That payment wasn’t completed. Please try again or choose “I’ll pay at the visit”.');
    }
  }, [search]);

  useEffect(() => {
    if (!complete(getDraft()) && !search.get('payment_intent')) navigate('/book', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!canPay || !d.ref) return;
    let live = true;
    api('/api/create-payment-intent', { method: 'POST', body: { ref: d.ref } })
      .then((r) => live && setClientSecret(r.clientSecret))
      .catch((e) => live && setPiError(e.message));
    return () => { live = false; };
  }, [canPay, d.ref]);

  const options = useMemo(() => (clientSecret ? { clientSecret, appearance } : null), [clientSecret]);

  const payLater = async () => {
    if (busy) return;
    setBusy(true); setLater(true); setError('');
    try { await saveBooking('Pay Later'); } catch (e) {
      setError(e.status === 409 ? 'That time window was just taken. Please go back and pick another window.' : e.message);
      setBusy(false); setLater(false);
    }
  };

  const onError = (msg, keep) => { setError(msg); setSticky(!!keep); };

  if (!complete(d) && !busy) return <main className="co" id="main" />;

  return (
    <main className="co" id="main">
      <div className="co__wrap">
        <header className="co__head">
          <p className="eyebrow eyebrow--bars">Checkout</p>
          <h1 className="co__title">Reserve your install</h1>
        </header>
        <div className="co__grid">
          <section className="co__main" aria-label="Payment">
            <div className="deposit">
              <div>
                <p className="deposit__k">Reservation deposit</p>
                <p className="deposit__v">${DEPOSIT}</p>
              </div>
              <p className="deposit__note">Holds your install window and is applied to your final invoice.</p>
            </div>

            {error && <p className={`co__err ${sticky ? 'is-sticky' : ''}`} role="alert">{error}</p>}

            <div className="co__pay">
              {!canPay && (
                <p className="co__notice">Online payment isn’t connected yet. You can still reserve and pay at the visit below, or call <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>.</p>
              )}
              {canPay && piError && <p className="co__notice">{piError} You can still reserve and pay at the visit below.</p>}
              {canPay && !piError && !options && <p className="co__loading">Loading secure payment…</p>}
              {canPay && options && (
                <Elements stripe={stripePromise} options={options} key={clientSecret}>
                  <PayForm clientSecret={clientSecret} onError={onError} busy={busy} setBusy={setBusy} />
                </Elements>
              )}
              <p className="co__secure"><Icon name="lock" size={14} />Payments are processed securely by Stripe.</p>
            </div>

            <p className="co__later">
              <button type="button" className="linkbtn" onClick={payLater} disabled={busy}>
                {later ? 'Saving your booking…' : 'I’ll pay at the visit'}
              </button>
            </p>
          </section>

          <div className="co__aside">
            <Concierge d={d} compactOpen={sumOpen} onToggle={() => setSumOpen((o) => !o)} />
            <div className="co__contact">
              <p className="co__contactH">Contact details</p>
              <p>{d.name}<br />{d.phone}<br />{d.email}<br />{d.address}</p>
              <Link to="/book?step=info" className="co__edit">Edit details</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
