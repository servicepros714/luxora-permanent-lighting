import { useEffect, useState } from 'react';
import { useLocation, Link } from './lib/router.jsx';
import Header, { FocusHeader, MobileBar } from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Book from './pages/Book.jsx';
import Checkout from './pages/Checkout.jsx';
import Confirmation from './pages/Confirmation.jsx';

const FOCUSED = ['/book', '/checkout', '/confirmation'];

function NotFound() {
  return (
    <main className="conf" id="main">
      <div className="conf__card">
        <h1 className="conf__title">Page not found</h1>
        <p>That page doesn’t exist.</p>
        <Link to="/" className="btn btn--gold">Back to home</Link>
      </div>
    </main>
  );
}

export default function App() {
  const { path } = useLocation();
  const focused = FOCUSED.includes(path);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
    document.documentElement.classList.remove('menu-open');
  }, [path]);

  useEffect(() => {
    if (path !== '/') { setPastHero(false); return undefined; }
    const on = () => {
      const hero = document.getElementById('top');
      setPastHero(!!hero && hero.getBoundingClientRect().bottom < 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [path]);

  let page;
  if (path === '/') page = <Home />;
  else if (path === '/book') page = <Book />;
  else if (path === '/checkout') page = <Checkout />;
  else if (path === '/confirmation') page = <Confirmation />;
  else page = <NotFound />;

  return (
    <div className={`app ${focused ? 'app--focused' : ''}`}>
      <a className="skip" href="#main">Skip to content</a>
      {focused ? <FocusHeader /> : <Header />}
      {page}
      {path !== '/book' && path !== '/checkout' && <Footer />}
      {!focused && <MobileBar show={pastHero && path === '/'} />}
    </div>
  );
}
