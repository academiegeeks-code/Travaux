// components/FormationDetail.js
import React from 'react';
import { useFormation } from '../../../../Hooks/trainings/useFormation';
import { useSupports } from '../../../../Hooks/trainings/useSupports'; // ✅ Ajoutez cette importation
import './FormationDetail.css';

const FormationDetail = ({ formation, onBack, onEdit, onManageSupports }) => {
  const { formation: detailedFormation, loading: formationLoading } = useFormation(formation.id);
  
  // ✅ Utilisez useSupports au lieu de la logique manuelle
  const { supports, loading: supportsLoading, error: supportsError } = useSupports(formation.id);

  const formationData = detailedFormation || formation;

  return (
    <div className="formation-detail">
      <div className="detail-header">
        <button onClick={onBack} className="back-btn">
          ← Retour à la liste
        </button>
        <div className="header-actions">
          <button onClick={onManageSupports} className="action-btn supports-btn">
            📎 Gérer les supports
          </button>
          <button onClick={onEdit} className="action-btn edit-btn">
            ✏️ Modifier
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="formation-info">
          <h1>{formationData.nom}</h1>
          <p className="formation-description">
            {formationData.description || 'Aucune description disponible'}
          </p>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Durée estimée:</span>
              <span className="info-value">{formationData.duree_estimee} heures</span>
            </div>
            <div className="info-item">
              <span className="info-label">Nombre de sessions:</span>
              <span className="info-value">{formationData.nombre_sessions || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Supports disponibles:</span>
              <span className="info-value">{supports.length}</span>
            </div>
          </div>
        </div>

        {/* Section Supports - Beaucoup plus simple maintenant */}
        <div className="supports-section">
          <h3>Supports de formation</h3>
          {supportsLoading ? (
            <div className="loading-supports">
              <p>Chargement des supports...</p>
            </div>
          ) : supportsError ? (
            <div className="error-supports">
              <p>Erreur lors du chargement des supports</p>
            </div>
          ) : supports.length === 0 ? (
            <div className="empty-supports">
              <p>Aucun support disponible pour cette formation</p>
              <button onClick={onManageSupports} className="add-supports-btn">
                Ajouter des supports
              </button>
            </div>
          ) : (
            <div className="supports-list">
              {supports.map(support => (
                <div key={support.id} className="support-item">
                  <div className="support-info">
                    <span className="support-name">{support.titre}</span>
                    <span className="support-description">{support.description}</span>
                  </div>
                  <div className="support-meta">
                    <span className="support-type">{support.type_support}</span>
                    {support.taille_fichier && (
                      <span className="support-size">{support.taille_fichier}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormationDetail;