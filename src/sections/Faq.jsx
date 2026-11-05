import { useState } from 'react';
import { FAQS } from '../data/business.js';

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="sec faq" id="faq" aria-labelledby="faq-h">
      <div className="container">
        <header className="sec__head rv">
          <p className="eyebrow eyebrow--bars">FAQ</p>
          <h2 id="faq-h" className="sec__title track">Sealed questions, <em>opened</em>.</h2>
          <p className="sec__lede">Tap an envelope to break the seal.</p>
        </header>
        <ul className="envelopes">
          {FAQS.map((f, i) => {
            const on = open === i;
            return (
              <li key={f.q} className={`env rv ${on ? 'is-open' : ''}`} style={{ '--d': `${(i % 2) * 80}ms` }}>
                <span className="env__flap" aria-hidden="true" />
                <h3 className="env__h">
                  <button type="button" className="env__q" aria-expanded={on} aria-controls={`faq-a-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(on ? -1 : i)}>
                    <span className="env__num">Q{String(i + 1).padStart(2, '0')}</span>
                    <span className="env__text">{f.q}</span>
                    <span className="env__seal" aria-hidden="true">{on ? '−' : '+'}</span>
                  </button>
                </h3>
                <div className="env__letter" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!on}>
                  <p>{f.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
