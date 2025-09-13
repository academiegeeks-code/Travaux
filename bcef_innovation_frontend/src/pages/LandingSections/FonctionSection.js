import React from "react";
// Import FontAwesomeIcon and the specific icon
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArchive } from "@fortawesome/free-solid-svg-icons";

import { FaTasks, FaChartBar, FaComments, FaBell, FaChartLine,  } from "react-icons/fa";
import "./FonctionSection.css";

const featuresData = [
  {
    icon: <FaTasks size={40} color="#ff9800" />,
    title: "Gestion de Projets Intelligente",
    description: "Assignation roles, suivi des tâches et jalons via un tableau de bord visuel.",
  },
  {
    icon: <FaChartBar size={40} color="#4caf50" />,
    title: "Tableau de Bord Intégré",
    description: "Vue personnalisée pour chaque utilisateur : progression, tâches et échéances.",
  },
  {
    icon: <FaComments size={40} color="#2196f3" />,
    title: "Messagerie Instantanée",
    description: "Chat et commentaires en temps réel pour une communication fluide.",
  },
    {
    icon: <FontAwesomeIcon icon={faArchive} style={{ fontSize: "40px", color: "#83deff" }} />,
    title: "Archivage Sécurisé",
    description: "Stockage et accès facile aux documents de stage et rapports passés.",
    },

  {
    icon: <FaChartLine size={40} color="#2196f3" />,
    title: "Analytique et Rapports",
    description: "Visualisation des progrès et performances avec des graphiques interactifs.",
  },
  {
    icon: <FaBell size={40} color="#f44336" className="notification-icon" />,
    title: "Notifications en Temps Réel",
    description: "Icône animée signalant les mises à jour importantes instantanément.",
  },
];

export default function Features() {
  return (
    <section className="features-section">
      <div className="features-grid">
        {featuresData.map((feature, idx) => (
          <div key={idx} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
            <button className="feature-btn">
              <span className="arrow">→</span>
            </button>
            {/* Top Left Lines */}
  <div className="line line-horizontal line-top-left-horizontal"></div>
  <div className="point point-top-left-horizontal"></div>
  <div className="line line-vertical line-top-left-vertical"></div>
  <div className="point point-top-left-vertical"></div>

  {/* Top Right Lines */}
  <div className="line line-horizontal line-top-right-horizontal"></div>
  <div className="point point-top-right-horizontal"></div>
  <div className="line line-vertical line-top-right-vertical"></div>
  <div className="point point-top-right-vertical"></div>

  {/* Bottom Left Lines */}
  <div className="line line-horizontal line-bottom-left-horizontal"></div>
  <div className="point point-bottom-left-horizontal"></div>
  <div className="line line-vertical line-bottom-left-vertical"></div>
  <div className="point point-bottom-left-vertical"></div>

  {/* Bottom Right Lines */}
  <div className="line line-horizontal line-bottom-right-horizontal"></div>
  <div className="point point-bottom-right-horizontal"></div>
  <div className="line line-vertical line-bottom-right-vertical"></div>
  <div className="point point-bottom-right-vertical"></div>
          </div>
        ))}
      </div>
    </section>
  );
}
