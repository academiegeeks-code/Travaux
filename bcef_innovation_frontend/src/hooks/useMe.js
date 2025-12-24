// hooks/auth/useMe.js
import { useState, useEffect } from 'react';
import api from '../api/api';

export const useMe = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me/'); // ou /auth/me/
      setUser(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de connexion');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return { user, loading, error, refetch: fetchMe };
};