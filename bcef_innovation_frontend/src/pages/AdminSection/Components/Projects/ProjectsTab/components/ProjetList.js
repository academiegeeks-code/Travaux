// components/ProjetList.jsx
import React, { useState } from 'react';
import { useProjets } from '../../../../Hooks/project/useProjets'; // Chemin corrigé

function ProjetList() {
  const { 
    projets, 
    loading, 
    error, 
    deleteProjet,
    refetch 
  } = useProjets();

  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      try {
        setDeletingId(id);
        await deleteProjet(id);
        alert('Projet supprimé avec succès !');
      } catch (err) {
        alert('Erreur lors de la suppression : ' + (err.message || JSON.stringify(err)));
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) return <div className="loading">Chargement des projets...</div>;
  if (error) return <div className="error">Erreur : {error.message || JSON.stringify(error)}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Liste des Projets ({projets.length})</h1>
        <button onClick={refetch} style={{ padding: '8px 16px' }}>
          🔄 Actualiser
        </button>
      </div>
      
      {projets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Aucun projet disponible
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {projets.map(projet => (
            <div key={projet.id} style={{
              border: '1px solid #e0e0e0',
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{projet.titre}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666' }}>{projet.description}</p>
                  
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <span><strong>Statut:</strong> 
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        marginLeft: '5px',
                        backgroundColor: 
                          projet.statut === 'termine' ? '#d4edda' :
                          projet.statut === 'en_cours' ? '#d1ecf1' :
                          projet.statut === 'en_attente' ? '#fff3cd' : '#f8d7da'
                      }}>
                        {projet.statut}
                      </span>
                    </span>
                    
                    {projet.formation && (
                      <span><strong>Formation:</strong> {projet.formation}</span>
                    )}
                    
                    {projet.date_debut && (
                      <span><strong>Début:</strong> {projet.date_debut}</span>
                    )}
                    
                    {projet.date_fin_prevue && (
                      <span><strong>Fin prévue:</strong> {projet.date_fin_prevue}</span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(projet.id)}
                  disabled={deletingId === projet.id}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deletingId === projet.id ? 'not-allowed' : 'pointer',
                    opacity: deletingId === projet.id ? 0.6 : 1
                  }}
                >
                  {deletingId === projet.id ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
              
              {projet.fichier && (
                <div style={{ marginTop: '15px' }}>
                  <button 
                    onClick={() => window.open(projet.fichier, '_blank')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📁 Télécharger le fichier
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjetList;