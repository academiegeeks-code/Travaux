import Navbar from "../ui/Navbar"; // chemin relatif vers le composant
import HeroSection from './LandingSections/HeroSection';
import FonctionSection from './LandingSections/FonctionSection';
import SolvedSection from './LandingSections/SolvedSection';
import TestimonialSection from './LandingSections/TestimonialSection';
import BackTop from './LandingSections/Cartes&Motions/BackTop'
import Footer from "../ui/Footer"

function LandingPage() {


  return (
    <div className="landing-page-container">
      {/* --- Navigation Bar --- */}
      <Navbar />
      <BackTop/>
      {/* --- Section Hero --- */}
      <HeroSection />
      {/* --- Section Fonctionnalités --- */}
      <FonctionSection />
      {/* --- Section Problem-Solving --- */}
      <SolvedSection />
      {/* --- Section Temoignages --- */}
      <TestimonialSection />
      {/* --- Footer --- */}
      <Footer />
      
    </div>
  );
}

export default LandingPage;