import React from "react";
import "./SolvedSection.css";

export default function ProblemSolution() {
  return (
    <section className="problem-solution-section">
      <h2 className="section-title">Problème-Solution : La Valeur Ajoutée</h2>

      <div className="content-container">
        <div className="problem">
          <h3 className="subtitle">Le Problème</h3>
          <ul>
            <li><strong>Manque de communication</strong> entre les équipes et les stagiaires.</li>
            <li><strong>Suivi difficile</strong> des progrès et dossiers.</li>
            <li><strong>Dispersion des informations</strong> sur plusieurs supports.</li>
          </ul>
        </div>

        <div className="solution">
          <h3 className="subtitle">La Solution</h3>
          <ul>
            <li><strong>Centralisation</strong> des données et communications.</li>
            <li><strong>Transparence</strong> grâce au suivi en temps réel.</li>
            <li><strong>Productivité</strong> améliorée avec des outils simplifiés.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
