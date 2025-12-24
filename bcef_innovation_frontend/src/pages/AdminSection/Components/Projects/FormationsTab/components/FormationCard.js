// components/formations/FormationCard.js
import React from 'react';
import './FormationCard.css';
import { useSupports } from '../../../../Hooks/trainings/useSupports';

const FormationCard = ({ 
  formation, 
  onSelect, 
  onEdit, 
  onManageSupports, 
  onLaunchSession, 
  onDelete,
  onUpdateStatus 
}) => {
  const {
    id,
    nom,
    description,
    duree_estimee,
    est_actif,
    nombre_sessions = 0
  } = formation;

  const { supports } = useSupports(id);
  const actualSupportsCount = supports.length;
  return (
    <div className="formation-card" onClick={() => onSelect(formation)}>
      {/* En-tête avec statut et actions */}
      <div className="card-header">
        <div className="header-left">
          <h3 className="formation-title">{nom}</h3>
          <span className={`status-badge ${est_actif ? 'active' : 'inactive'}`}>
            {est_actif ? '🟢 Actif' : '🔴 Inactif'}
          </span>
        </div>
        <div className="card-actions">
          {/* Bouton statut */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(formation);
            }}
            className="icon-btn status-btn"
            title={est_actif ? 'Désactiver' : 'Activer'}
          >
            {est_actif ? '⏸️' : '▶️'}
          </button>
          
          {/* Bouton lancer session */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLaunchSession(formation);
            }}
            className="icon-btn launch-btn"
            title="Lancer une session"
          >
            🚀
          </button>
          
          {/* Bouton modifier */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(formation);
            }}
            className="icon-btn edit-btn"
            title="Modifier"
          >
            ✏️
          </button>
          
          {/* Bouton supprimer */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(formation);
            }}
            className="icon-btn delete-btn"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Contenu de la carte */}
      <div className="card-content">
        <p className="formation-description">
          {description || 'Aucune description'}
        </p>
        
        <div className="formation-meta">
          <div className="meta-item">
            <span className="meta-label">Durée:</span>
            <span className="meta-value">{duree_estimee}h</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Sessions:</span>
            <span className="meta-value">{nombre_sessions}</span>
          </div>
        </div>
      </div>

      {/* Pied de carte */}
      <div className="card-footer">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManageSupports(formation);
          }}
          className="supports-btn"
        >
          📎 Supports ({actualSupportsCount})
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(formation);
          }}
          className="details-btn"
        >
          👁️ Détails
        </button>
      </div>
    </div>
  );
};

export default FormationCard;