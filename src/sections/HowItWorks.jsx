import { HOW_STEPS } from '../data/business.js';
import Icon from '../components/Icon.jsx';

export default function HowItWorks() {
  return (
    <section className="sec how" id="how" aria-labelledby="how-h">
      <div className="container">
        <header className="sec__head rv">
          <p className="eyebrow eyebrow--bars">How it works</p>
          <h2 id="how-h" className="sec__title track">Four steps. <em>Not one ladder</em> for you.</h2>
        </header>
        <ol className="checker">
          {HOW_STEPS.map((s, i) => (
            <li key={s.id} className={`checker__cell rv sheen ${i % 2 ? 'is-dark' : 'is-light'}`} style={{ '--d': `${i * 90}ms` }}>
              <span className="checker__num" aria-hidden="true">{s.numeral}</span>
              <span className="checker__icon"><Icon name={s.icon} size={28} /></span>
              <h3 className="checker__title"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
