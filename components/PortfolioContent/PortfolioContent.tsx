import LoadingScreen from '@/components/LoadingScreen/LoadingScreen';
import Navbar        from '@/components/Navbar/Navbar';
import Mascot        from '@/components/Mascot/Mascot';
import SmoothScroll  from '@/components/SmoothScroll/SmoothScroll';
import Hero          from '@/components/Hero/Hero';
import About         from '@/components/About/About';
import Skills        from '@/components/Skills/Skills';
import Projects      from '@/components/Projects/Projects';
import Services      from '@/components/Services/Services';
import Contact       from '@/components/Contact/Contact';
import Footer        from '@/components/Footer/Footer';

export default function PortfolioContent({ embedded = false }: { embedded?: boolean }) {
  return (
    <>
      {!embedded && <LoadingScreen />}
      {/* Fixed elements — outside SmoothScroll */}
      <Navbar />
      <Mascot />

      {/* Scrollable content */}
      <SmoothScroll disabled={embedded}>
        <main>
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Services />
          <Contact />
        </main>
        <Footer />
      </SmoothScroll>
    </>
  );
}
