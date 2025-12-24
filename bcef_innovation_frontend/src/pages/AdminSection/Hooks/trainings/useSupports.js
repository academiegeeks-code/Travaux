// hooks/useSupports.js
import { useState, useEffect } from 'react';
import api from '../../../../api/api';

export const useSupports = (formationTypeId = null) => {
  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSupports = async (formationId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/supports/';
      if (formationId) {
        url = `/supports/by_formation/?formation_type=${formationId}`;
      }
      
      const response = await api.get(url);
      setSupports(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data || err.message);
      console.error('Erreur lors du chargement des supports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupports(formationTypeId);
  }, [formationTypeId]);

  // Créer un support
  const createSupport = async (supportData) => {
    try {
      setError(null);
      const formData = new FormData();
      
      // Ajouter les champs au FormData
      Object.keys(supportData).forEach(key => {
        if (supportData[key] !== null && supportData[key] !== undefined) {
          formData.append(key, supportData[key]);
        }
      });

      const response = await api.post('/supports/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSupports(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    }
  };

  // Supprimer un support
  const deleteSupport = async (id) => {
    try {
      setError(null);
      await api.delete(`/supports/${id}/`);
      setSupports(prev => prev.filter(support => support.id !== id));
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    }
  };

  // Télécharger un support
  const downloadSupport = async (support) => {
    try {
      const response = await api.get(support.fichier, {
        responseType: 'blob',
      });
      
      // Créer un URL temporaire pour le téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', support.titre || 'support');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      throw err;
    }
  };

  return {
    supports,
    loading,
    error,
    refetch: () => fetchSupports(formationTypeId),
    createSupport,
    deleteSupport,
    downloadSupport,
  };
};