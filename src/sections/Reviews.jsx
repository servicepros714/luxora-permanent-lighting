import { REVIEWS, BUSINESS } from '../data/business.js';

/* Never invent reviews. Empty frames show until real ones are added in src/data/business.js (REVIEWS). */
export default function Reviews() {
  const items = REVIEWS.length ? REVIEWS.slice(0, 3) : [null, null, null];
  return (
    <section className="sec reviews" id="reviews" aria-labelledby="rev-h">
      <div className="container">
        <header className="sec__head rv">
          <p className="eyebrow eyebrow--bars">Reviews</p>
          <h2 id="rev-h" className="sec__title track">The <em>gallery wall</em> is waiting.</h2>
          <p className="sec__lede">
            {REVIEWS.length ? `What homeowners say about ${BUSINESS.short}.` : `${BUSINESS.short} is new — these frames are reserved for our first clients’ words. No made-up quotes, ever.`}
          </p>
        </header>
        <ul className="ovals">
          {items.map((r, i) => (
            <li key={i} className="oval rv" style={{ '--d': `${i * 110}ms` }}>
              <div className="oval__frame">
                {r ? (
                  <blockquote>
                    <p>“{r.text}”</p>
                    <footer>— {r.name}{r.source ? `, ${r.source}` : ''}</footer>
                  </blockquote>
                ) : (
                  <div className="oval__empty">
                    <span className="oval__mark" aria-hidden="true">“</span>
                    <p>Your review here</p>
                    <small>Reserved for a Luxora client</small>
                  </div>
                )}
              </div>
              <span className="oval__plaque" aria-hidden="true">{['No. I', 'No. II', 'No. III'][i]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
