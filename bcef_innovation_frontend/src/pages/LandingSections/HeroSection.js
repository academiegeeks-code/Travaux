import "./HeroSection.css";
import demo from "../../demo.gif";
import WaveLine from "./Cartes&Motions/WaveLine"; 
import InfoCard from "./Cartes&Motions/InfoCard"


export default function HeroSection() {


  return (
    <section className="hero">
       {/* <WaveLine />  Ligne ondulée en background */}
       <WaveLine />
        <div className="hero-content">
        <div className="hero-text-container">
          <h1 className="hero-title animate-fade-slide">
         Levier du transfert générationnel
        </h1>
        <p className="hero-subtitle animate-fade-slide delay-medium">
          La plateforme qui innove dans la gestion et le suivi de projets pour stagiaires et encadreurs.
        </p>
        <div className="hero-cta-buttons animate-fade-slide delay-high">
          <button className="btn-primary">
            Commencer l'expérience
          </button>
          <button className="btn-secondary" onClick={() => {
            document.getElementById("features-section").scrollIntoView({ behavior: "smooth" });
          }}>
            Découvrir les fonctionnalités
          </button>
        </div>
      </div>
      <div className="hero-video-container animate-zoom-in">
        <img 
          src={demo} 
          alt="Hero background" 
          className="hero-video" 
        />

      </div>
    </div>

    {/* Cartes glass flottantes */}
    <InfoCard/>
        <div className="glass-card glass-card-1">Contenu de la carte 1</div>
        <div className="glass-card glass-card-3">Contenu de la carte 3</div>
    </section>
  );
}

