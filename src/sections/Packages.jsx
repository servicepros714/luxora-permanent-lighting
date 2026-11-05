import { useState } from 'react';
import { Link } from '../lib/router.jsx';
import { ADDONS, PACKAGES, PERMANENT_NOTE, LIGHTING_TYPES } from '../data/business.js';
import { useDraft, updateDraft, toggleAddon, priceLabel, addonLabel } from '../lib/draft.js';
import Icon from '../components/Icon.jsx';

export default function Packages() {
  const d = useDraft();
  const [view, setView] = useState(d.type || 'Seasonal');
  const type = d.type || view;
  const setType = (t) => { setView(t); updateDraft({ type: t }); };
  const addons = ADDONS.filter((a) => !(a.seasonalOnly && type === 'Permanent'));

  return (
    <section className="sec pk" id="packages" aria-labelledby="pk-h">
      <div className="container">
        <header className="sec__head rv">
          <p className="eyebrow eyebrow--bars">Packages</p>
          <h2 id="pk-h" className="sec__title track">Two invitations. <em>One standard.</em></h2>
          <p className="sec__lede">Choose how long the glow stays, then the coverage. Prices are “starting at” — your final price is confirmed at the on-site visit.</p>
        </header>

        <div className="plateswitch rv" role="radiogroup" aria-label="Lighting type">
          {LIGHTING_TYPES.slice().reverse().map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={type === t.id}
              className={`plateswitch__opt ${type === t.id ? 'is-on' : ''}`}
              onClick={() => setType(t.id)}
            >
              <span className="plateswitch__name">{t.name}</span>
              <span className="plateswitch__tag">{t.tagline}</span>
            </button>
          ))}
          <span className="plateswitch__plate" data-pos={type === 'Permanent' ? 1 : 0} aria-hidden="true" />
        </div>

        <div className="invites" role="radiogroup" aria-label="Package">
          {PACKAGES.map((p, i) => {
            const on = d.pkg === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={`invite rv sheen ${p.featured ? 'invite--velvet' : ''} ${on ? 'is-on' : ''}`}
                style={{ '--d': `${i * 120}ms` }}
                onClick={() => updateDraft({ pkg: p.id, type })}
              >
                <span className="deco deco--tl" /><span className="deco deco--tr" /><span className="deco deco--bl" /><span className="deco deco--br" />
                {p.featured && <span className="invite__ribbon">{p.featured}</span>}
                <span className="invite__check" aria-hidden="true"><Icon name="check" size={16} stroke={2.4} /></span>
                <span className="seal" aria-hidden="true"><span>{p.numeral}</span></span>
                <span className="invite__name">{p.name}</span>
                <span className="invite__cov">{p.coverage}</span>
                <span className="invite__from">Starting at</span>
                <span className="invite__prices">
                  {['Seasonal', 'Permanent'].map((t) => (
                    <span key={t} className={`invite__price ${t === type ? 'is-cur' : ''}`}>
                      <span className="invite__ptype">{t}</span>
                      <span className="invite__pval">{priceLabel(p.price[t])}</span>
                    </span>
                  ))}
                </span>
                <span className="invite__rule" aria-hidden="true">◆</span>
                <span className="invite__list">
                  {p.features[type].map((f) => <span key={f} className="invite__feat">{f}</span>)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pk__notes rv">
          <span className="chip-note"><Icon name="home" size={16} />2-story homes: +50% of package price</span>
          <span className="chip-note"><Icon name="sun" size={16} />{PERMANENT_NOTE}</span>
        </div>

        <div className="alacarte rv">
          <h3 className="alacarte__h">À la carte <span>· optional add-ons, carried into your booking</span></h3>
          <ul className="placecards">
            {addons.map((a) => {
              const on = d.addons.includes(a.id);
              return (
                <li key={a.id}>
                  <button type="button" className={`placecard ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggleAddon(a.id)}>
                    <span className="placecard__tent" aria-hidden="true" />
                    <span className="placecard__seal" aria-hidden="true"><Icon name="check" size={14} stroke={2.6} /></span>
                    <Icon name={a.icon} size={26} className="placecard__ico" />
                    <span className="placecard__name">{a.name}</span>
                    <span className="placecard__price">{addonLabel(a)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pk__cta rv">
          <Link to="/book" className="btn btn--gold btn--lg">Book Now</Link>
          <p className="pk__fine">Your picks carry into booking. Reserve with a $149 deposit or pay at the visit.</p>
        </div>
      </div>
    </section>
  );
}
