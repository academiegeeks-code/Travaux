// hooks/trainings/useFormations.js
import { useState, useEffect } from 'react';
import api from '../../../../api/api';
export const useFormations = () => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/formation-types/');
      setFormations(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data || err.message);
      console.error('Erreur lors du chargement des formations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ajoutez cette fonction pour rafraîchir manuellement
  const refetch = async () => {
    await fetchFormations();
  };

  const createFormation = async (formationData) => {
    try {
      setError(null);
      const response = await api.post('/formation-types/', formationData);
      setFormations(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    }
  };

  const updateFormation = async (id, formationData) => {
    try {
      setError(null);
      const response = await api.put(`/formation-types/${id}/`, formationData);
      setFormations(prev => 
        prev.map(formation => 
          formation.id === id ? response.data : formation
        )
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    }
  };

  const deleteFormation = async (id) => {
    try {
      setError(null);
      await api.delete(`/formation-types/${id}/`);
      setFormations(prev => prev.filter(formation => formation.id !== id));
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  return {
    formations,
    loading,
    error,
    refetch, // Important: expose refetch
    createFormation,
    updateFormation,
    deleteFormation,
  };
};