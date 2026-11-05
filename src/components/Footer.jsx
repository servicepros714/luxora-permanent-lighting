import { Link, navigate } from '../lib/router.jsx';
import { BUSINESS, SERVICE_AREA } from '../data/business.js';
import { NAV } from './Header.jsx';
import Icon, { Crest } from './Icon.jsx';
import { useAvailability, earliestOpen } from '../lib/availability.js';
import { fmtDate } from '../lib/time.js';
import logo from '../assets/logo.png';

export default function Footer() {
  const av = useAvailability();
  const next = earliestOpen(av);
  const year = new Date().getFullYear();
  return (
    <footer className="ftr">
      <div className="ftr__rays" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => <i key={i} />)}
      </div>
      <div className="ftr__in">
        <div className="card-call">
          <span className="deco deco--tl" /><span className="deco deco--tr" /><span className="deco deco--bl" /><span className="deco deco--br" />
          <img src={logo} alt={BUSINESS.name} className="card-call__logo" width="1000" height="377" />
          <p className="card-call__line">Permanent roofline lighting &amp; seasonal Christmas installs.</p>
          <a className="card-call__phone" href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>
          <dl className="card-call__meta">
            <div><dt>Address</dt><dd>{BUSINESS.address}</dd></div>
            <div><dt>Hours</dt><dd>{BUSINESS.hours}</dd></div>
            <div><dt>Next open</dt><dd>{next ? fmtDate(next.date, { weekday: 'short', month: 'short', day: 'numeric' }) : av.offline ? 'Call to schedule' : av.loading ? 'Checking…' : 'Call us'}</dd></div>
          </dl>
          <Link to="/book" className="btn btn--gold">Book Online</Link>
        </div>

        <div className="ftr__cols">
          <div className="ftr__col">
            <h2 className="ftr__h">Explore</h2>
            <ul>
              {NAV.map((n) => (
                <li key={n.id}><a href={`/#${n.id}`} onClick={(e) => { e.preventDefault(); navigate(`/#${n.id}`); }}>{n.label}</a></li>
              ))}
              <li><Link to="/book">Book online</Link></li>
            </ul>
          </div>
          <div className="ftr__col">
            <h2 className="ftr__h">Service area</h2>
            <ul>
              {SERVICE_AREA.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
          <div className="ftr__col">
            <h2 className="ftr__h">Contact</h2>
            <ul>
              <li><a href={BUSINESS.phoneHref}><Icon name="phone" size={16} /> {BUSINESS.phone}</a></li>
              <li><Icon name="pin" size={16} /> {BUSINESS.city}, {BUSINESS.state}</li>
              <li><Icon name="clock" size={16} /> {BUSINESS.hours}</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="ftr__legal">
        <Crest size={22} />
        <p>© {year} {BUSINESS.name} · Prices are “starting at”; final price confirmed at the on-site visit.</p>
      </div>
    </footer>
  );
}
