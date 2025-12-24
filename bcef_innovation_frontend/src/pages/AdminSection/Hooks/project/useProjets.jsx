// hooks/projects/useProjets.js
import { useState, useEffect } from 'react';
import api from '../../../../api/api';

const useProjets = () => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────────────────
  // FETCH : Récupérer tous les projets
  // ─────────────────────────────────────────────────────────
  const fetchProjets = async () => {
    try {
      setLoading(true);
      setError(null);
      // CORRECTION : Ajoutez /api/ au début
      const response = await api.get('/projets/');
      setProjets(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data || err.message);
      console.error('Erreur lors du chargement des projets:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // CREATE : Créer un nouveau projet
  // ─────────────────────────────────────────────────────────
  const createProjet = async (projetData) => {
    try {
      setError(null);
      
      const isFileUpload = projetData.fichier instanceof File;
      let response;
      
      if (isFileUpload) {
        const formData = new FormData();
        Object.keys(projetData).forEach(key => {
          if (projetData[key] !== null && projetData[key] !== undefined) {
            formData.append(key, projetData[key]);
          }
        });
        
        // CORRECTION : Ajoutez /api/ au début
        response = await api.post('/projets/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // CORRECTION : Ajoutez /api/ au début
        response = await api.post('/projets/', projetData);
      }
      
      setProjets(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    }
  };

  // ─────────────────────────────────────────────────────────
  // UPDATE : Modifier un projet
  // ─────────────────────────────────────────────────────────
  const updateProjet = async (id, projetData) => {
    try {
      setError(null);
      
      const isFileUpload = projetData.fichier instanceof File;
      let response;
      
      if (isFileUpload) {
        const formData = new FormData();
        Object.keys(projetData).forEach(key => {
          if (projetData[key] !== null && projetData[key] !== undefined) {
            formData.append(key, projetData[key]);
          }
        });
        
        // CORRECTION : Ajoutez /api/ au début
        response = await api.patch(`/projets/${id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // CORRECTION : Ajoutez /api/ au début
        response = await api.patch(`/projets/${id}/`, projetData);
      }
      
      setProjets(prev => 
        prev.map(projet => 
          projet.id === id ? response.data : projet
        )
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    }
  };

  // ─────────────────────────────────────────────────────────
  // DELETE : Supprimer un projet
  // ─────────────────────────────────────────────────────────
  const deleteProjet = async (id) => {
    try {
      setError(null);
      // CORRECTION : Ajoutez /api/ au début
      await api.delete(`/projets/${id}/`);
      setProjets(prev => prev.filter(projet => projet.id !== id));
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    }
  };

  // ─────────────────────────────────────────────────────────
  // STATS : Récupérer les statistiques des projets
  // ─────────────────────────────────────────────────────────
  

  useEffect(() => {
    fetchProjets();
  }, []);

  return {
    projets,
    loading,
    error,
    refetch: fetchProjets,
    createProjet,
    updateProjet,
    deleteProjet,
  };
};

export default useProjets;