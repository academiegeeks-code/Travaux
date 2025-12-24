// components/formations/ThemeTab.js
import React, { useState } from 'react';
import { useFormations } from '../../../Hooks/trainings/useFormations';
import FormationList from './components/FormationList';
import FormationForm from './components/FormationForm';
import FormationDetail from './components/FormationDetail';
import SessionLauncher from './components/SessionLauncher';
import SupportManager from './components/SupportManager';
import './file.css';

const FormationsTab = () => {
  const [activeView, setActiveView] = useState('list');
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const { formations, loading, error, refetch, createFormation, updateFormation, deleteFormation } = useFormations();

  // === NOUVELLES FONCTIONS ===

  // Lancer une session
  const handleLaunchSession = (formation) => {
    setSelectedFormation(formation);
    setActiveView('launch-session');
  };

  // Supprimer une formation
  const handleDeleteFormation = async (formation) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la formation "${formation.nom}" ? Cette action est irréversible.`)) {
      try {
        await deleteFormation(formation.id);
        alert('Formation supprimée avec succès!');
      } catch (err) {
        alert('Erreur lors de la suppression: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Mettre à jour le statut
  const handleUpdateStatus = async (formation) => {
    const newStatus = !formation.est_actif;
    const confirmMessage = newStatus 
      ? `Activer la formation "${formation.nom}" ?` 
      : `Désactiver la formation "${formation.nom}" ?`;

    if (window.confirm(confirmMessage)) {
      try {
        await updateFormation(formation.id, { est_actif: newStatus });
        alert(`Formation ${newStatus ? 'activée' : 'désactivée'} avec succès!`);
      } catch (err) {
        alert('Erreur lors de la mise à jour: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Gérer la sélection d'une formation
  const handleSelectFormation = (formation) => {
    setSelectedFormation(formation);
    setActiveView('detail');
  };

  // Gérer la création d'une formation
  const handleCreateFormation = () => {
    setSelectedFormation(null);
    setShowForm(true);
    setActiveView('form');
  };

  // Gérer l'édition d'une formation
  const handleEditFormation = (formation) => {
    setSelectedFormation(formation);
    setShowForm(true);
    setActiveView('form');
  };

  // Gérer la gestion des supports
  const handleManageSupports = (formation) => {
    setSelectedFormation(formation);
    setActiveView('supports');
  };

  // Retour à la liste
  const handleBackToList = () => {
    setSelectedFormation(null);
    setShowForm(false);
    setActiveView('list');
    refetch(); // Rafraîchir les données
  };

  return (
    <div className="theme-tab">
      {/* En-tête avec navigation */}
      <div className="theme-tab-header">
        <div className="view-controls">
          <button
            className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
            onClick={handleBackToList}
          >
            📋 Catalogue
          </button>
          {activeView !== 'form' && (
            <button
              className="create-btn"
              onClick={handleCreateFormation}
            >
              ➕ Nouvelle Formation
            </button>
          )}
        </div>
      </div>

      {/* Affichage conditionnel selon la vue active */}
      <div className="theme-tab-content">
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des formations...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <div className="error-message">
              <h3>Erreur de chargement</h3>
              <p>{error.detail || error.message || 'Une erreur est survenue'}</p>
              <button onClick={refetch} className="retry-btn">
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Vue Liste */}
            {activeView === 'list' && (
              <FormationList
                formations={formations}
                onSelectFormation={handleSelectFormation}
                onEditFormation={handleEditFormation}
                onManageSupports={handleManageSupports}
                onCreateFormation={handleCreateFormation}
                onLaunchSession={handleLaunchSession}
                onDeleteFormation={handleDeleteFormation}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {/* Vue Formulaire (Création/Édition) */}
            {activeView === 'form' && (
              <FormationForm
                formation={selectedFormation}
                onSuccess={handleBackToList}
                onCancel={handleBackToList}
              />
            )}

            {/* Vue Détails */}
            {activeView === 'detail' && selectedFormation && (
              <FormationDetail
                formation={selectedFormation}
                onBack={handleBackToList}
                onEdit={() => handleEditFormation(selectedFormation)}
                onManageSupports={() => handleManageSupports(selectedFormation)}
              />
            )}

            {/* Vue Supports */}
            {activeView === 'supports' && selectedFormation && (
              <SupportManager
                formation={selectedFormation}
                onBack={handleBackToList}
              />
            )}

            {/* NOUVELLE VUE : Lancement de session */}
            {activeView === 'launch-session' && selectedFormation && (
              <SessionLauncher
                formation={selectedFormation}
                onBack={handleBackToList}
                onSuccess={handleBackToList}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FormationsTab;