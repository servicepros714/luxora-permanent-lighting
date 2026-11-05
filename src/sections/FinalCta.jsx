import { Link } from '../lib/router.jsx';
import { BUSINESS, DEPOSIT } from '../data/business.js';
import Icon from '../components/Icon.jsx';
import crest from '../assets/crest.png';

export default function FinalCta() {
  return (
    <section className="cta" aria-labelledby="cta-h">
      <div className="container cta__in rv">
        <img src={crest} alt="" className="cta__crest" width="406" height="258" />
        <p className="eyebrow eyebrow--bars eyebrow--light">Reserve your window</p>
        <h2 id="cta-h" className="cta__title track">Let’s <em className="foil-text">light</em> it up.</h2>
        <p className="cta__lede">Pick your package and install window in a few minutes. Reserve with ${DEPOSIT} — applied to your final invoice — or pay at the visit.</p>
        <div className="cta__btns">
          <Link to="/book" className="btn btn--gold btn--lg">Book Online</Link>
          <a href={BUSINESS.phoneHref} className="btn btn--ghostlight btn--lg"><Icon name="phone" size={18} />Call {BUSINESS.phone}</a>
        </div>
      </div>
    </section>
  );
}
