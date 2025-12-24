// components/ProjetDetail.jsx
import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import useProjet from '../../../../Hooks/project/useProjet';
import useProjets from '../../../../Hooks/project/useProjets'; // Import ajouté

const Icon = ({ children }) => <span style={{ marginRight: '10px', fontSize: '1.3em' }}>{children}</span>;

function ProjetDetail({ projetId, onBack, onUpdateSuccess }) {
  const { projet, loading, error, downloadFichier, updateStatut } = useProjet(projetId);
  const { updateProjet, deleteProjet } = useProjets(); // Récupère les fonctions CRUD globales

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Initialiser le formulaire avec les données du projet
  useEffect(() => {
    if (projet) {
      setFormData({
        titre: projet.titre || '',
        description: projet.description || '',
        objectifs: projet.objectifs || '',
        formation: projet.formation || '',
        date_debut: projet.date_debut || '',
        date_fin_prevue: projet.date_fin_prevue || '',
        fichier: null,
      });
    }
  }, [projet]);

  const handleChangeStatut = async (nouveauStatut) => {
    try {
      await updateStatut(projetId, nouveauStatut);
      alert('Statut mis à jour avec succès !');
    } catch (err) {
      alert('Erreur : ' + (err.message || 'Échec de la mise à jour'));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProjet(projetId, formData);
      setIsEditing(false);
      alert('Projet mis à jour avec succès !');
      onUpdateSuccess?.(); // Optionnel : rafraîchir la liste
    } catch (err) {
      alert('Erreur lors de la mise à jour : ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      return;
    }

    try {
      await deleteProjet(projetId);
      alert('Projet supprimé avec succès !');
      onBack(); // Retour à la liste après suppression
    } catch (err) {
      alert('Erreur lors de la suppression : ' + (err.message || 'Impossible de supprimer'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontSize: '1.3rem', color: '#7f8c8d' }}>
        Chargement du projet...
      </div>
    );
  }

  if (error || !projet) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#e74c3c' }}>
        <p>Projet introuvable ou erreur de chargement</p>
        <button onClick={onBack} style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      maxWidth: '900px',
      margin: '40px auto',
      padding: '40px 32px',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
      border: '1px solid #e0e0e0',
      animation: 'fadeInUp 0.6s ease-out',
    }}>
      {/* Boutons d'action en haut à droite */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: 10 }}>
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          title="Modifier le projet"
          style={{ 
            padding: '10px', 
            backgroundColor: '#f39c12', 
            color: 'white', 
            border: 'none', 
            borderRadius: '50%', 
            cursor: 'pointer', 
            fontSize: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Edit2 />
        </button>

        <button 
          onClick={handleDelete} 
          title="Supprimer le projet"
          style={{ 
            padding: '10px', 
            backgroundColor: '#e74c3c', 
            color: 'white', 
            border: 'none', 
            borderRadius: '50%', 
            cursor: 'pointer', 
            fontSize: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Trash2 />
        </button>
        <button onClick={onBack}
          style={{ padding: '10px', backgroundColor: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '1.4rem' }}>
          ×
        </button>
      </div>

      {/* Mode édition */}
      {isEditing ? (
        <div>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Modifier le projet</h2>
          <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '16px' }}>
            <input type="text" placeholder="Titre" value={formData.titre} onChange={e => setFormData({ ...formData, titre: e.target.value })} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="4" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <textarea placeholder="Objectifs" value={formData.objectifs} onChange={e => setFormData({ ...formData, objectifs: e.target.value })} rows="3" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input type="text" placeholder="Formation" value={formData.formation} onChange={e => setFormData({ ...formData, formation: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input type="date" value={formData.date_debut} onChange={e => setFormData({ ...formData, date_debut: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input type="date" value={formData.date_fin_prevue} onChange={e => setFormData({ ...formData, date_fin_prevue: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input type="file" onChange={e => setFormData({ ...formData, fichier: e.target.files[0] })} style={{ padding: '8px' }} />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Sauvegarder
              </button>
              <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '12px 24px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <h1 style={{
            fontSize: '2.6rem',
            color: '#2c3e50',
            margin: '0 0 32px 0',
            paddingRight: '160px',
            background: 'linear-gradient(90deg, #0066cc, #3498db)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700',
          }}>
            {projet.titre}
          </h1>

          {/* Contenu existant (description, objectifs, etc.) */}
          <div style={{ display: 'grid', gap: '24px', fontSize: '1.1rem', lineHeight: '1.7' }}>
            {projet.description && (
              <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '14px', borderLeft: '5px solid #3498db' }}>
                <strong style={{ color: '#2c3e50' }}>Description du projet</strong>
                <p style={{ margin: '8px 0 0', color: '#34495e' }}>{projet.description}</p>
              </div>
            )}

            {projet.objectifs && (
              <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '14px', borderLeft: '5px solid #27ae60' }}>
                <strong style={{ color: '#2c3e50' }}>Objectifs</strong>
                <p style={{ margin: '8px 0 0', color: '#34495e' }}>{projet.objectifs}</p>
              </div>
            )}

            {/* ... reste du contenu inchangé ... */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: '#f8f9fa', padding: '18px', borderRadius: '12px', textAlign: 'center' }}>
                <strong>Formation</strong>
                <p style={{ margin: '8px 0 0', fontSize: '1.1rem', color: '#2980b9' }}>{projet.formation}</p>
              </div>
              <div style={{ backgroundColor: '#e8f5e8', padding: '18px', borderRadius: '12px', textAlign: 'center' }}>
                <strong>Statut actuel</strong>
                <p style={{ margin: '8px 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60', textTransform: 'capitalize' }}>
                  {projet.statut_display || projet.statut.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Dates, téléchargement, changement de statut... (inchangé) */}
            {/* ... tu peux garder tout le reste tel quel ... */}

            {(projet.fichier_url || projet.fichier) && (
              <div style={{ textAlign: 'center', margin: '32px 0' }}>
                <button onClick={downloadFichier} style={{
                  padding: '14px 32px', backgroundColor: '#28a745', color: 'white', border: 'none',
                  borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(40,167,69,0.3)',
                }}>
                  Download Télécharger le fichier joint
                </button>
              </div>
            )}

            <div style={{ backgroundColor: '#f8f9fa', padding: '28px', borderRadius: '16px', border: '2px dashed #ddd' }}>
              <h3 style={{ margin: '0 0 20px', color: '#2c3e50', fontSize: '1.4rem' }}>
                <Icon>Settings</Icon> Changer le statut du projet
              </h3>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['en_attente', 'en_cours', 'termine', 'suspendu'].map((s) => (
                  <button key={s} onClick={() => handleChangeStatut(s)} disabled={projet.statut === s}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: projet.statut === s ? '#3498db' : '#ecf0f1',
                      color: projet.statut === s ? 'white' : '#34495e',
                      border: 'none',
                      borderRadius: '50px',
                      cursor: projet.statut === s ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      minWidth: '130px',
                    }}>
                    {s === 'en_attente' && 'En attente'}
                    {s === 'en_cours' && 'En cours'}
                    {s === 'termine' && 'Terminé'}
                    {s === 'suspendu' && 'Suspendu'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ProjetDetail;