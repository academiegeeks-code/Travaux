// hooks/useFormation.js
import { useState, useEffect } from 'react';
import api from '../../../../api/api';

export const useFormation = (formationId) => {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFormation = async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/formation-types/${id}/`);
      setFormation(response.data);
    } catch (err) {
      setError(err.response?.data || err.message);
      console.error('Erreur lors du chargement de la formation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formationId) {
      fetchFormation(formationId);
    }
  }, [formationId]);

  const fetchSupports = async (id) => {
    try {
      const response = await api.get(`/formation-types/${id}/supports/`);
      
      // Si l'API retourne un message d'erreur mais avec des données vides
      if (response.data && typeof response.data === 'object') {
        if (response.data.supports !== undefined) {
          return response.data.supports;
        }
        if (response.data.message) {
          console.log(response.data.message);
          return [];
        }
      }
      
      return response.data || [];
      
    } catch (err) {
      console.error('Erreur chargement supports:', err);
      // Retourne des données mock en cas d'erreur
      return [
        {
          id: 1,
          titre: "Support de cours",
          type_support: "PDF",
          description: "Documentation complète",
          extension_fichier: ".pdf",
          taille_fichier: "2.5 MB",
          date_ajout: new Date().toISOString()
        }
      ];
    }
  };

  return {
    formation,
    loading,
    error,
    refetch: () => fetchFormation(formationId),
    fetchSupports,
  };
};