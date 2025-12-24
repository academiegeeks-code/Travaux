// src/pages/AdminSection/Components/Projects/ProjectsTab/ProjectsTab.jsx
import React, { useState } from 'react';
import useProjets from '../../../Hooks/project/useProjets';
import ProjetForm from './components/ProjetForm';
import ProjetDetail from './components/ProjetDetail'; // On va le modifier juste après

function ProjectsTab() {
  const { projets, loading, error, refreshProjects } = useProjets();
  const [showForm, setShowForm] = useState(false);
  const [selectedProjetId, setSelectedProjetId] = useState(null); // ← plus d'erreur ici

  const handleProjetClick = (id) => {
    setSelectedProjetId(id);
  };

  const handleBack = () => {
    setSelectedProjetId(null);
    setShowForm(false);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;
  if (error) return <div style={{ color: 'red' }}>Erreur : {error.message}</div>;

  // === AFFICHAGE DES DÉTAILS ===
  if (selectedProjetId) {
    return (
      <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        <button
          onClick={handleBack}
          style={{
            marginBottom: '24px',
            padding: '10px 20px',
            backgroundColor: '#ecf0f1',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          ← Retour à la liste
        </button>

        <ProjetDetail projetId={selectedProjetId} onBack={handleBack} />
      </div>
    );
  }

  // === AFFICHAGE DU FORMULAIRE DE CRÉATION ===
  if (showForm) {
    return (
      <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        <button
          onClick={handleBack}
          style={{
            marginBottom: '24px',
            padding: '10px 20px',
            backgroundColor: '#ecf0f1',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          ← Retour
        </button>

        <ProjetForm
          onSuccess={() => {
            setShowForm(false);
            refreshProjects?.();
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  // === LISTE DES PROJETS ===
  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#2c3e50' }}>Tous les Projets({projets.length})</h1>
          <p style={{ color: '#7f8c8d', marginTop: '8px' }}>
          
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Créer un projet
        </button>
      </div>

      {projets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px',
          backgroundColor: '#f8f9fa',
          borderRadius: '16px',
          border: '2px dashed #ddd',
          color: '#95a5a6',
        }}>
          Aucun projet pour le moment
        </div>
      ) : (
        projets.map((projet) => (
          <div
            key={projet.id}
            onClick={() => handleProjetClick(projet.id)}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '16px',
              padding: '28px',
              marginBottom: '24px',
              backgroundColor: '#fff',
              boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'}
          >
            
            <div style={{ margin: '0 0 16px', fontSize: '1.5rem', color: '#3da510ff',  }}><strong>Projet</strong></div>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#0066cc', textDecoration: 'underline' }}>
               {projet.titre}
            </h3>

            {projet.description && (
              <p style={{ margin: '0 0 20px', color: '#34495e', lineHeight: '1.6' }}>
                {projet.description.length > 160
                  ? projet.description.substring(0, 160) + '...'
                  : projet.description}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div><strong>Statut :</strong> <span style={{ color: '#27ae60' }}>{projet.statut}</span></div>
              {projet.formation && <div><strong>Formation :</strong><span style={{ color: '#27ae60' }}>{projet.formation}</span></div>}
              {projet.date_debut && (
                <div><strong>Début :</strong><span style={{ color: '#27ae60' }}>{new Date(projet.date_debut).toLocaleDateString('fr-FR')}</span> </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ProjectsTab;