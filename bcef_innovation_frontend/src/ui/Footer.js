import React, { useState } from "react";
import "./Footer.css";
import MapComponent from "../pages/LandingSections/Cartes&Motions/MapComponent";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="magnificent-footer">
      {/* Section principale */}
      <div className="footer-content">
        {/* Proposition de valeur */}
        <div className="value-proposition">
          <h3>Construisons l'avenir de l'innovation ensemble</h3>
          <p>Rejoignez la plateforme BCEF et transformez vos idées en réalités tangibles</p>
        </div>

        {/* CONTENU PRINCIPAL AVEC GRID */}
        <div className="footer-main-content">
          
          {/* Colonnes de liens */}
          <div className="footer-grid">
            {/* Colonne À propos */}
            <div className="footer-column">
              <h4>À Propos</h4>
              <ul>
                <li><a href="/histoire">Notre Histoire</a></li>
                <li><a href="/mission">Notre Mission</a></li>
                <li><a href="/equipe">Notre Équipe</a></li>
                <li><a href="/valeurs">Nos Valeurs</a></li>
              </ul>
            </div>

            {/* Colonne Ressources */}
            <div className="footer-column">
              <h4>Ressources</h4>
              <ul>
                <li><a href="/faq">FAQ</a></li>
                <li><a href="/blog">Blog Innovation</a></li>
                <li><a href="/cas-etudes">Études de Cas</a></li>
                <li><a href="/guides">Guides Pratiques</a></li>
              </ul>
            </div>

            {/* Colonne Légal */}
            <div className="footer-column">
              <h4>Légal</h4>
              <ul>
                <li><a href="/mentions-legales">Mentions Légales</a></li>
                <li><a href="/confidentialite">Politique de Confidentialité</a></li>
                <li><a href="/conditions">Conditions d'Utilisation</a></li>
                <li><a href="/cookies">Politique des Cookies</a></li>
              </ul>
            </div>

            {/* Colonne Contact et Newsletter */}
            <div className="footer-column">
              <h4>Restons Connectés</h4>
              <div className="contact-info">
                <p>📧 contact@bcef-innovation.com</p>
                <p>📞 +33 1 23 45 67 89</p>
              </div>
              
              <form className="newsletter-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Votre email pour nos actualités"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className={subscribed ? "subscribed" : ""}>
                    {subscribed ? "✓" : "→"}
                  </button>
                </div>
                {subscribed && (
                  <p className="success-message">Merci de votre abonnement !</p>
                )}
              </form>
            </div>
          </div>

          {/* SECTION CARTE - NOUVELLE PARTIE */}
          <div className="footer-map-section">
            <h4>Notre Siège</h4>
            <div className="map-wrapper">
              <MapComponent />
            </div>
            <div className="map-address">
              <p>📍 123 Avenue de l'Innovation, 75000 Paris</p>
            </div>
          </div>

        </div>
      </div>

      {/* Barre inférieure avec copyright et réseaux sociaux */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="copyright">
            <p>&copy; 2024 BCEF Innovation. Tous droits réservés.</p>
            <p>Plus c'est simple, plus c'est complexe !</p>
          </div>
          
          <div className="social-links">
            {/* ... vos icônes sociales ... */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;