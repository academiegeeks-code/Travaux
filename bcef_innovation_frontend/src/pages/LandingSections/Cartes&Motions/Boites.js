import React, { useState, } from "react";
import "./Boites.css";

const BoiteAIdees = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    idee: ""
  });

   
  const toggleForm = () => {
    setIsOpen(!isOpen);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Idée soumise:", formData);
    // Ici vous ajouterez la logique d'envoi vers votre backend
    alert("Merci pour votre idée ! Nous l'étudierons avec attention.");
    setFormData({ nom: "", email: "", idee: "" });
    setIsOpen(false);
  };

  return (
    <>
      {/* Bouton flottant */}
      <div className={`boite-a-idees-btn ${isOpen ? "active" : ""}`} onClick={toggleForm}>
        <div className="boite-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <span className="boite-text">Boîte à idées</span>
        <div className="boite-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>

      {/* Overlay et formulaire */}
      {isOpen && (
        <div className="boite-overlay" onClick={toggleForm}>
          <div className="boite-form-container" onClick={(e) => e.stopPropagation()}>
            <button className="boite-close-btn" onClick={toggleForm}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>

            <h2 className="boite-title">Partager mon idée</h2>
            
            <form className="boite-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nom">Votre nom</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  placeholder="Votre nom complet"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Votre email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="votre@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="idee">Votre idée</label>
                <textarea
                  id="idee"
                  name="idee"
                  value={formData.idee}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Décrivez votre idée en détail..."
                ></textarea>
              </div>

              <button type="submit" className="boite-submit-btn">
                Envoyer mon idée
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BoiteAIdees;