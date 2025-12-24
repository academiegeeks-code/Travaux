/*import React from 'react';
import { useStatistics } from '../../../AdminSection/Hooks/useWorksManagement';

const StatisticsTab = () => {
  const { statistics, loading, error } = useStatistics();

  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        Chargement des statistiques...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error" role="alert">
        Erreur : {error}
      </div>
    );
  }

  if (!statistics) return null;

  // Calculs sécurisés
  const themePercentage = statistics.totalThemes > 0
    ? Math.round((statistics.themesAttribues / statistics.totalThemes) * 100)
    : 0;

  const progressPercentage = Math.round(statistics.progressionMoyenne || 0);

  return (
    <div className="tab-content">
      {/* KPI Cards 
      <div className="kpi-cards">
        {/* Thèmes Attribués 
        <div className="kpi-card clean-card" aria-label="Taux d'attribution des thèmes">
          <div className="card-header">
            <h3>Thèmes Attribués</h3>
            <span className="info-icon" aria-hidden="true">Info</span>
          </div>
          <div className="circle-chart">
            <div className="chart-progress">{themePercentage}%</div>
          </div>
          <p className="card-footer">
            {statistics.themesAttribues} / {statistics.totalThemes} attribués
          </p>
        </div>

        {/* Formations Terminées 
        <div className="kpi-card clean-card" aria-label="Formations terminées">
          <div className="card-header">
            <h3>Formations Terminées</h3>
            <span className="info-icon" aria-hidden="true">Info</span>
          </div>
          <div className="big-number">{statistics.formationsTerminees}</div>
          <p className="card-footer">complétées</p>
        </div>

        {/* Projets en Cours 
        <div className="kpi-card clean-card" aria-label="Projets en cours">
          <div className="card-header">
            <h3>Projets en Cours</h3>
            <span className="info-icon" aria-hidden="true">Info</span>
          </div>
          <div className="progress-indicator">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <span className="progress-text">{progressPercentage}%</span>
          </div>
          <p className="card-footer">{statistics.projetsEnCours} actifs</p>
        </div>
      </div>

      {/* Charts Container – Réservé pour futur usage */
    

//export default StatisticsTab;*/