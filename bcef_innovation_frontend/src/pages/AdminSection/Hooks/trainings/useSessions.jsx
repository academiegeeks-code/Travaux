// hooks/trainings/useFormationSessions.js
import { useState, useEffect } from 'react';
import api from '../../../../api/api';

export const useSessions = (filters = {}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const url = params.toString() ? `/sessions/?${params.toString()}` : '/sessions/';
      const response = await api.get(url);
      
      const data = response.data.results || response.data;

      console.log('useFormationSessions: Fetched sessions:', data);

      if (!Array.isArray(data)) {
        console.warn('useFormationSessions: Expected array, received:', data);
        setSessions([]);
      } else {
        setSessions(data);
      }
    } catch (err) {
      const errorMsg =
        err.response?.status === 401
          ? "Erreur d'authentification : Veuillez vous reconnecter."
          : err.response?.status === 403
          ? "Accès refusé : Vous n'avez pas les permissions nécessaires."
          : err.response?.data?.detail ||
            Object.values(err.response?.data || {}).flat().join(', ') ||
            err.message ||
            'Erreur lors du chargement des sessions.';

      setError(errorMsg);
      console.error('useFormationSessions: Fetch error:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useFormationSessions: Fetching with filters:', filters);
    fetchSessions();
  }, [JSON.stringify(filters)]); // Utiliser JSON.stringify pour éviter les re-rendus infinis

  const createSession = async (sessionData) => {
    try {
      setError(null);
      const response = await api.post('/sessions/', sessionData);
      console.log('useFormationSessions: Created session:', response.data);
      setSessions((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.status === 403
          ? "Vous n'avez pas la permission de créer une session."
          : err.response?.data?.detail ||
            Object.values(err.response?.data || {}).flat().join(', ') ||
            err.message ||
            'Erreur lors de la création de la session';

      console.error('useFormationSessions: Create error:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const updateSession = async (id, sessionData) => {
    try {
      setError(null);
      const response = await api.put(`/sessions/${id}/`, sessionData);
      console.log('useFormationSessions: Updated session:', response.data);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? response.data : s))
      );
      return response.data;
    } catch (err) {
      const errorMsg = 
        err.response?.data?.detail || 
        Object.values(err.response?.data || {}).flat().join(', ') ||
        err.message || 
        'Erreur lors de la mise à jour';
      
      console.error('useFormationSessions: Update error:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const patchSession = async (id, sessionData) => {
    try {
      setError(null);
      const response = await api.patch(`/sessions/${id}/`, sessionData);
      console.log('useFormationSessions: Patched session:', response.data);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? response.data : s))
      );
      return response.data;
    } catch (err) {
      const errorMsg = 
        err.response?.data?.detail || 
        Object.values(err.response?.data || {}).flat().join(', ') ||
        err.message || 
        'Erreur lors de la mise à jour partielle';
      
      console.error('useFormationSessions: Patch error:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const deleteSession = async (id) => {
    try {
      setError(null);
      await api.delete(`/sessions/${id}/`);
      console.log('useFormationSessions: Deleted session:', id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      const errorMsg = 
        err.response?.data?.detail || 
        Object.values(err.response?.data || {}).flat().join(', ') ||
        err.message || 
        'Erreur lors de la suppression';
      
      console.error('useFormationSessions: Delete error:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const updateSessionStatus = async (id, statut) => {
    try {
      setError(null);
      const response = await api.patch(`/sessions/${id}/update_statut/`, { statut });
      console.log('useFormationSessions: Updated session status:', response.data);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? response.data : s))
      );
      return response.data;
    } catch (err) {
      const errorMsg = 
        err.response?.data?.detail || 
        Object.values(err.response?.data || {}).flat().join(', ') ||
        err.message || 
        'Erreur lors de la mise à jour du statut';
      
      console.error('useFormationSessions: Update status error:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const autoUpdateSessionStatus = async (id) => {
    try {
      setError(null);
      const response = await api.post(`/sessions/${id}/update_statut/`);
      console.log('useFormationSessions: Auto-updated session status:', response.data);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? response.data : s))
      );
      return response.data;
    } catch (err) {
      const errorMsg = 
        err.response?.data?.detail || 
        Object.values(err.response?.data || {}).flat().join(', ') ||
        err.message || 
        'Erreur lors de la mise à jour automatique du statut';
      
      console.error('useFormationSessions: Auto-update status error:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getMySessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/sessions/mes_sessions/');
      const data = response.data.results || response.data;
      
      if (!Array.isArray(data)) {
        console.warn('useFormationSessions: Expected array for my sessions, received:', data);
        setSessions([]);
      } else {
        setSessions(data);
      }
      return data;
    } catch (err) {
      const errorMsg = 
        err.response?.data?.detail || 
        Object.values(err.response?.data || {}).flat().join(', ') ||
        err.message || 
        'Erreur lors du chargement de vos sessions';
      
      setError(errorMsg);
      console.error('useFormationSessions: My sessions error:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getCalendarSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/sessions/calendar/');
      const data = response.data.results || response.data;
      
      if (!Array.isArray(data)) {
        console.warn('useFormationSessions: Expected array for calendar, received:', data);
        setSessions([]);
      } else {
        setSessions(data);
      }
      return data;
    } catch (err) {
      const errorMsg = 
        err.response?.data?.detail || 
        Object.values(err.response?.data || {}).flat().join(', ') ||
        err.message || 
        'Erreur lors du chargement des sessions calendrier';
      
      setError(errorMsg);
      console.error('useFormationSessions: Calendar sessions error:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const refetchSessions = async () => {
    console.log('useFormationSessions: Refetching...');
    await fetchSessions();
  };

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    patchSession,
    deleteSession,
    updateSessionStatus,
    autoUpdateSessionStatus,
    getMySessions,
    getCalendarSessions,
    refetchSessions,
  };
};