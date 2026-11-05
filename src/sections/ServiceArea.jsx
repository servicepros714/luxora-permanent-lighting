import { BUSINESS, SERVICE_AREA } from '../data/business.js';

export default function ServiceArea() {
  return (
    <section className="sec area" id="area" aria-labelledby="area-h">
      <div className="container area__grid">
        <header className="sec__head sec__head--left rv">
          <p className="eyebrow eyebrow--bars">Service area</p>
          <h2 id="area-h" className="sec__title track">Find your <em>floor</em> in the directory.</h2>
          <p className="sec__lede">We install from our home base in {BUSINESS.city} and the neighborhoods around it. Not listed? Call — we often reach nearby streets.</p>
          <a className="btn btn--line" href={BUSINESS.phoneHref}>Call {BUSINESS.phone}</a>
        </header>

        <div className="directory rv">
          <div className="directory__head">
            <span>Directory</span>
            <span>Service area</span>
          </div>
          <ul className="directory__board">
            {SERVICE_AREA.map((c, i) => (
              <li key={c} className={i === 0 ? 'is-home' : ''}>
                <span className="directory__city">{c}</span>
                <span className="directory__dots" aria-hidden="true" />
                <span className="directory__floor">{i === 0 ? 'Home base' : 'Covered'}</span>
              </li>
            ))}
            <li className="is-ask">
              <span className="directory__city">Not listed?</span>
              <span className="directory__dots" aria-hidden="true" />
              <a className="directory__floor" href={BUSINESS.phoneHref}>Call the desk</a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
