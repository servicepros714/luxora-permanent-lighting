import { useEffect } from 'react';
import Hero from '../sections/Hero.jsx';
import HowItWorks from '../sections/HowItWorks.jsx';
import Packages from '../sections/Packages.jsx';
import Gallery from '../sections/Gallery.jsx';
import ServiceArea from '../sections/ServiceArea.jsx';
import Season from '../sections/Season.jsx';
import Faq from '../sections/Faq.jsx';
import Reviews from '../sections/Reviews.jsx';
import FinalCta from '../sections/FinalCta.jsx';
import { useReveal } from '../lib/useReveal.js';
import { scrollToId } from '../lib/router.jsx';

export default function Home() {
  useReveal('home');
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h) scrollToId(h);
  }, []);
  return (
    <main id="main">
      <Hero />
      <HowItWorks />
      <Packages />
      <Gallery />
      <ServiceArea />
      <Season />
      <Faq />
      <Reviews />
      <FinalCta />
    </main>
  );
}
