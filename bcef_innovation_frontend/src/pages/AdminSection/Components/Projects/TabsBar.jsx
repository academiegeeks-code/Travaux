import React from "react";
import "../../../CssFiles/Projects/Projects.css";

const TabsBar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tab-navigation">
      <button
        className={`tab-button ${activeTab === "projets" ? "active" : ""}`}
        onClick={() => setActiveTab("projets")}
      >
        <span className="tab-icon"></span>
        <span className="tab-label">Projets</span>
      </button>

      <button
        className={`tab-button ${activeTab === "formations" ? "active" : ""}`}
        onClick={() => setActiveTab("formations")}
      >
        <span className="tab-icon">🗓️</span>
        <span className="tab-label">Formations</span>
      </button>

      <button
        className={`tab-button ${activeTab === "themes" ? "active" : ""}`}
        onClick={() => setActiveTab("themes")}
      >
        <span className="tab-icon">🏷️</span>
        <span className="tab-label">Thèmes</span>
      </button>
    </div>
  );
};

export default TabsBar;
