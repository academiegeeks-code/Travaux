// components/formations/FormationList.js
import React from 'react';
import FormationCard from './FormationCard';
import './FormationList.css';

const FormationList = ({ 
  formations, 
  onSelectFormation, 
  onEditFormation, 
  onManageSupports,
  onCreateFormation,
  onLaunchSession,    // Nouveau
  onDeleteFormation,  // Nouveau
  onUpdateStatus      // Nouveau 
}) => {
  if (formations.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <h3>Aucune formation disponible</h3>
        <p>Commencez par créer votre première formation</p>
        <button onClick={onCreateFormation} className="create-first-btn">
          Créer une formation
        </button>
      </div>
    );
  }

  return (
    <div className="formation-list">
      <div className="list-header">
        <h2>Toutes les Formations ({formations.length})</h2>
        <div className="list-actions">
          <button onClick={onCreateFormation} className="add-btn">
            ➕ Ajouter
          </button>
        </div>
      </div>

      <div className="formations-grid">
        {formations.map(formation => (
          <FormationCard
            key={formation.id}
            formation={formation}
            onSelect={onSelectFormation}
            onEdit={onEditFormation}
            onManageSupports={onManageSupports}
            onLaunchSession={onLaunchSession}      // Nouveau
            onDelete={onDeleteFormation}           // Nouveau
            onUpdateStatus={onUpdateStatus}        // Nouveau
          />
        ))}
      </div>
    </div>
  );
};

export default FormationList;