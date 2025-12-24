// hooks/useThemeDetail.js
import { useState, useEffect, useCallback } from "react";
import api from "../../../../api/api"; // ton fichier api.js

export const useThemeDetail = (themeId) => {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTheme = useCallback(async () => {
    if (!themeId) {
      setTheme(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`themes/${themeId}/`);
      setTheme(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError("Thème non trouvé");
      } else if (status === 403) {
        setError("Accès refusé à ce thème");
      } else {
        setError(err.response?.data?.detail || "Erreur lors du chargement du thème");
      }
      setTheme(null);
    } finally {
      setLoading(false);
    }
  }, [themeId]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  // Fonction pour recharger manuellement (ex: après assign/unassign)
  const refetch = () => {
    fetchTheme();
  };

  return { 
    theme, 
    loading, 
    error, 
    refetch 
  };
};