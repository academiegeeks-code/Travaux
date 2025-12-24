// hooks/useAnnouncements.js
import { useState, useEffect } from 'react';
import api from '../../../../api/api'; // votre instance axios existante

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Récupérer toutes les annonces
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/announcements/');
      setAnnouncements(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data || 'Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer seulement les annonces actives
  const fetchActiveAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/announcements/active/');
      setAnnouncements(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data || 'Erreur lors du chargement des annonces actives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return {
    announcements,
    loading,
    error,
    refetch: fetchAnnouncements,
    refetchActive: fetchActiveAnnouncements
  };
};

export const useAnnouncement = (id) => {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnnouncement = async (announcementId = id) => {
    if (!announcementId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/announcements/${announcementId}/`);
      setAnnouncement(response.data);
    } catch (err) {
      setError(err.response?.data || 'Erreur lors du chargement de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAnnouncement();
    }
  }, [id]);

  return {
    announcement,
    loading,
    error,
    refetch: fetchAnnouncement
  };
};

export const useAnnouncementActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createAnnouncement = async (announcementData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/announcements/', announcementData);
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      const errorData = err.response?.data || 'Erreur lors de la création de l\'annonce';
      setError(errorData);
      setLoading(false);
      return { success: false, error: errorData };
    }
  };

  const updateAnnouncement = async (id, announcementData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/announcements/${id}/`, announcementData);
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      const errorData = err.response?.data || 'Erreur lors de la modification de l\'annonce';
      setError(errorData);
      setLoading(false);
      return { success: false, error: errorData };
    }
  };

  const deleteAnnouncement = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/announcements/${id}/`);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorData = err.response?.data || 'Erreur lors de la suppression de l\'annonce';
      setError(errorData);
      setLoading(false);
      return { success: false, error: errorData };
    }
  };

  const publishAnnouncement = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/announcements/${id}/publish/`);
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      const errorData = err.response?.data || 'Erreur lors de la publication de l\'annonce';
      setError(errorData);
      setLoading(false);
      return { success: false, error: errorData };
    }
  };

  const unpublishAnnouncement = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/announcements/${id}/unpublish/`);
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      const errorData = err.response?.data || 'Erreur lors de la dépublication de l\'annonce';
      setError(errorData);
      setLoading(false);
      return { success: false, error: errorData };
    }
  };

  return {
    loading,
    error,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
    unpublishAnnouncement
  };
};