// hooks/projects/useProjet.js
import { useState, useEffect } from 'react';
import api from '../../../../api/api';

const useProjet = (projetId) => {
  const [projet, setProjet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────────────────
  // FETCH : Récupérer un projet par son ID
  // ─────────────────────────────────────────────────────────
  const fetchProjet = async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      // CORRECTION : Ajoutez /api/ au début
      const response = await api.get(`/projets/${id}/`);
      setProjet(response.data);
    } catch (err) {
      setError(err.response?.data || err.message);
      console.error('Erreur lors du chargement du projet:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // METTRE À JOUR LE STATUT : Changer le statut rapidement
  // ─────────────────────────────────────────────────────────
  const updateStatut = async (id, nouveauStatut) => {
    try {
      // CORRECTION : Ajoutez /api/ au début
      const response = await api.patch(`/projets/${id}/`, {
        statut: nouveauStatut,
      });
      setProjet(response.data);
      return response.data;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (projetId) {
      fetchProjet(projetId);
    }
  }, [projetId]);

  // ... reste du code inchangé
  const downloadFichier = async (id) => {
    try {
      if (!projet?.fichier) {
        console.warn('Aucun fichier associé à ce projet');
        return null;
      }
      window.open(projet.fichier, '_blank');
      return true;
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      return null;
    }
  };

  return {
    projet,
    loading,
    error,
    refetch: () => fetchProjet(projetId),
    downloadFichier,
    updateStatut,
  };
}; 
export default useProjet;