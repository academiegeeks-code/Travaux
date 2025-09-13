import React, { useState, useEffect } from "react";
import "./TestimonialSection.css";
import Boites from "./Cartes&Motions/Boites";
import quote99 from "./../../../src/quote99.webp";

const temoignagesData = [
  {
    description: "Amélioration du Suivi de Projets",
    content: "La plateforme a transformé notre manière de gérer les projets. Le suivi est plus précis, et les équipes sont plus alignées que jamais. Un outil indispensable pour l'innovation.",
    author: "Fatoumata S. Ouédraogo",
    role: "Encadreur",
  },
  {
    description: "Gestion des Stagiaires Simplifiée",
    content: "Ce service nous a fait gagner un temps précieux. La gestion des stagiaires, de l'affectation des thèmes au suivi des progrès, est désormais fluide et centralisée.",
    author: "Issa Traoré",
    role: "Administrateur",
  },
  {
    description: "Collaboration et Communication",
    content: "La messagerie interne a révolutionné notre communication. Les échanges sont directs et efficaces, favorisant une collaboration instantanée entre stagiaires et encadreurs.",
    author: "Aïcha Sanfo",
    role: "Stagiaire",
  },
  {
    description: "Transparence et Performance",
    content: "Une solution brillante pour l'évaluation. La plateforme offre une vue d'ensemble claire des performances de chaque stagiaire, nous permettant de prendre des décisions éclairées.",
    author: "Adama Nikiema",
    role: "Encadreur",
  },
];

export default function Temoignages() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 4000); // Changement toutes les 4 secondes

    return () => clearInterval(interval); //eslint-disable-next-line
  }, [currentIndex]) ;

  const goToNext = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setPreviousIndex(currentIndex);
    setCurrentIndex((prev) => (prev + 1) % temoignagesData.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 800); // Durée de la transition
  };

  const goToIndex = (index) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setPreviousIndex(currentIndex);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 800);
  };

  return (
    <>
      <section className="temoignages-section">
        <Boites/>
        <h2 className="title">Témoignages</h2>
        <div className="underline" />
        <em className="subtitle">Ce que les gens disent</em>

        <div className="temoignages-container">
          {temoignagesData.map((temoignage, index) => {
            let slideClass = "";
            if (index === currentIndex) {
              slideClass = "active";
            } else if (index === previousIndex) {
              slideClass = "previous";
            }

            return (
              <div key={index} className={`temoignage-slide ${slideClass}`}>
                <div className="temoignage-single">
                  <p className="description">{temoignage.description}</p>
                  <p className="content">
                    {temoignage.content.split(". ").map((part, idx, arr) =>
                      idx === 0 ? (
                        <strong key={idx}>{part}.</strong>
                      ) : (
                        part + (idx !== arr.length - 1 ? ". " : "")
                      )
                    )}
                  </p>
                  <div className="author-container">
                    <p className="author">
                      <strong>{temoignage.author}</strong>
                    </p>
                    <p className="role">{temoignage.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="temoignage-indicators">
          {temoignagesData.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentIndex ? "active" : ""}`}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>

        <img
          src={quote99}
          alt=""
          className="background-quote"
          aria-hidden="true"
        />
      </section>
      <div className="decor-filiaire" aria-hidden="true"></div>
    </>
  );
}