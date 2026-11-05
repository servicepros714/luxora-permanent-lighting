import { useEffect, useRef, useState } from 'react';
import { GALLERY } from '../data/business.js';
import Scene from '../components/Scene.jsx';
import Icon from '../components/Icon.jsx';
import { reducedMotion } from '../lib/useReveal.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const TURN = 760;

export default function Gallery() {
  const [idx, setIdx] = useState(0);
  const [turn, setTurn] = useState('');
  const busy = useRef(false);
  const timers = useRef([]);
  const touch = useRef(null);
  const n = GALLERY.length;
  const g = GALLERY[idx];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const goTo = (to, dir) => {
    const target = (to + n) % n;
    if (busy.current || target === idx) return;
    if (reducedMotion()) { setIdx(target); return; }
    busy.current = true;
    setTurn(dir || (target > idx ? 'next' : 'prev'));
    timers.current.push(setTimeout(() => setIdx(target), TURN / 2));
    timers.current.push(setTimeout(() => { setTurn(''); busy.current = false; }, TURN));
  };
  const next = () => goTo(idx + 1, 'next');
  const prev = () => goTo(idx - 1, 'prev');

  return (
    <section className="sec gal" id="gallery" aria-labelledby="gal-h">
      <div className="container">
        <header className="sec__head rv">
          <p className="eyebrow eyebrow--bars">Gallery</p>
          <h2 id="gal-h" className="sec__title track">The <em>portfolio</em>, after dark.</h2>
          <p className="sec__lede">Turn the pages for looks we design. These are illustrated previews until our own install photos are added.</p>
        </header>

        <div
          className={`book rv ${turn ? `is-turning is-${turn}` : ''}`}
          role="region"
          aria-roledescription="carousel"
          aria-label="Lighting design previews"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } }}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touch.current == null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            touch.current = null;
            if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
          }}
        >
          <span className="book__ribbon" aria-hidden="true" />
          <div className="book__spread" aria-live="polite">
            <div className="book__page book__page--l">
              <div className="book__mat">
                <Scene key={g.id} shape={g.house} colors={g.colors} extras={g.extras} spacing={24} title={`${g.title} — illustrated design preview`} />
                <span className="tag-preview">Design preview</span>
              </div>
            </div>
            <div className="book__page book__page--r">
              <p className="book__no">Plate No. {String(idx + 1).padStart(2, '0')}</p>
              <h3 className="book__title">{g.title}</h3>
              <p className="book__text">{g.text}</p>
              <dl className="book__specs">
                <div><dt>Look</dt><dd>{g.look}</dd></div>
                <div><dt>Type</dt><dd>{g.type}</dd></div>
                <div><dt>Coverage</dt><dd>{g.coverage}</dd></div>
              </dl>
              <p className="book__folio">{String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</p>
            </div>
            <div className="book__leaf" aria-hidden="true"><span /></div>
          </div>
          <div className="book__ctrl">
            <button type="button" className="book__arrow" onClick={prev} aria-label="Previous page"><Icon name="left" /></button>
            <ol className="book__index" aria-label="Chapters">
              {GALLERY.map((x, i) => (
                <li key={x.id}>
                  <button type="button" className={i === idx ? 'is-cur' : ''} aria-current={i === idx ? 'true' : undefined} aria-label={`${x.title} (${i + 1} of ${n})`} onClick={() => goTo(i)}>
                    {ROMAN[i]}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="book__arrow" onClick={next} aria-label="Next page"><Icon name="right" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
