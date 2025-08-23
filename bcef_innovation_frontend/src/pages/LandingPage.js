import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Carrousel automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 6);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Effet machine à écrire
  useEffect(() => {
    const texts = [
      "Bienvenue sur notre plateforme innovante",
      "Gestion simplifiée des stages",
      "Connectez étudiants et entreprises",
      "Suivi personnalisé des compétences",
      "Une communauté grandissante",
      "L'excellence à portée de main"
    ];

    if (currentTextIndex < texts[currentSlide].length) {
      const timeout = setTimeout(() => {
        setTypedText(texts[currentSlide].substring(0, typedText.length + 1));
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setTypedText('');
        setCurrentTextIndex(0);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [typedText, currentSlide, currentTextIndex]);

  const toggleDropdown = (dropdown) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

  return (
    <div className="landing-page-container">
      {/* --- Navigation Bar --- */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">BCEF</span>
          </div>
          
          <div className="nav-menu">
            <Link to="/" className="nav-link">Accueil</Link>
            <Link to="/blogs" className="nav-link">Blogs</Link>
            <Link to="/about" className="nav-link">À propos</Link>
            <Link to="/faq" className="nav-link">FAQ</Link>
            
            <div 
              className="nav-link dropdown-trigger"
              onMouseEnter={() => toggleDropdown('login')}
              onMouseLeave={() => toggleDropdown(null)}
            >
              Se connecter
              {activeDropdown === 'login' && (
                <div className="dropdown-menu">
                  <Link to="/login" className="dropdown-item">Administrateur</Link>
                  <Link to="/intern" className="dropdown-item">Stagiaire</Link>
                  <Link to="/supervisor" className="dropdown-item">Maître de suivi</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Section 1: Carrousel Hero --- */}
      <section className="hero-section">
        <div className="carousel">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div 
              key={index} 
              className={`carousel-slide ${index === currentSlide + 1 ? 'active' : ''}`}
              style={{ backgroundImage: `url(https://picsum.photos/1600/900?random=${index})` }}
            >
              <div className="carousel-overlay">
                <div className="typing-container">
                  <h1 className="typing-text">{typedText}</h1>
                  <span className="cursor">|</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="carousel-indicators">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* --- Section 2: Position géographique --- */}
      <section className="location-section">
        <div className="section-container">
          <h2>Notre position stratégique</h2>
          <div className="location-content">
            <div className="map-container">
              <div className="map-placeholder">
                <span className="map-pin">📍</span>
                <p>Carte interactive</p>
              </div>
            </div>
            <div className="location-info">
              <h3>StageConnect HQ</h3>
              <p>123 Avenue de l'Innovation</p>
              <p>75000 Paris, France</p>
              <p>+33 1 23 45 67 89</p>
              <p>contact@stageconnect.fr</p>
              
              <div className="business-hours">
                <h4>Heures d'ouverture</h4>
                <p>Lun-Ven: 9h-18h</p>
                <p>Sam: 10h-16h</p>
                <p>Dim: Fermé</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 3: Cartes publicitaires --- */}
      <section className="ads-section">
        <div className="section-container">
          <h2>Annonces et actualités</h2>
          <div className="cards-grid">
            {[1, 2, 3].map((card) => (
              <div key={card} className="card">
                <div className="card-image" style={{ backgroundImage: `url(https://picsum.photos/400/300?random=${card + 10})` }}></div>
                <div className="card-content">
                  <h3>Nouveau programme de stages {card}</h3>
                  <p>Découvrez nos dernières opportunités de stage pour la rentrée académique.</p>
                  <button className="card-button">En savoir plus</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section 4: Témoignages --- */}
      <section className="testimonials-section">
        <div className="section-container">
          <h2>Ce qu'ils disent de nous</h2>
          <div className="testimonials-grid">
            {[
              {
                name: "Marie L.",
                role: "Stagiaire en informatique",
                text: "StageConnect m'a permis de trouver le stage parfait qui correspondait à mes compétences et aspirations."
              },
              {
                name: "Thomas D.",
                role: "Responsable RH",
                text: "La qualité des stagiaires que nous recevons grâce à StageConnect a considérablement augmenté."
              },
              {
                name: "Sophie M.",
                role: "Enseignante",
                text: "Enfin une plateforme qui simplifie le suivi des stages pour les encadrants pédagogiques !"
              }
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <p>"{testimonial.text}"</p>
                </div>
                <div className="testimonial-author">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>StageConnect</h3>
            <p>La plateforme de référence pour connecter les talents de demain avec les entreprises d'aujourd'hui.</p>
          </div>
          
          <div className="footer-section">
            <h4>Liens rapides</h4>
            <ul>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/about">À propos</Link></li>
              <li><Link to="/blogs">Blogs</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📧 contact@stageconnect.fr</p>
            <p>📞 +33 1 23 45 67 89</p>
            <p>📍 123 Avenue de l'Innovation, 75000 Paris</p>
          </div>
          
          <div className="footer-section">
            <h4>Suivez-nous</h4>
            <div className="social-icons">
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">📘</a>
              <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">👔</a>
              <a href="https://wa.me" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">💬</a>
            </div>
            <p><Link to="/privacy">Politique de confidentialité</Link></p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 StageConnect. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;