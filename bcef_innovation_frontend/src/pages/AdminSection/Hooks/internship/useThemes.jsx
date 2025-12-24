// hooks/useThemes.js
import { useState, useEffect } from "react";
import api from "../../../../api/api"; // ton fichier api.js

export const useThemes = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/themes/");
      setThemes(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de chargement des thèmes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  return { themes, loading, error, refetch: fetchThemes , setThemes};
};

// hooks/useAvailableThemes.js
export const useAvailableThemes = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("themes/available/").then(res => {
      setThemes(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return { themes, loading };
};

// hooks/useAssignedThemes.js
export const useAssignedThemes = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/themes/assigned/").then(res => {
      setThemes(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return { themes, loading };
};

// hooks/useMyTheme.js  ← Pour les stagiaires
export const useMyTheme = () => {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/themes/my-theme/")
      .then(res => {
        setTheme(res.data);
        setError(null);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setTheme(null); // Pas de thème attribué
        } else {
          setError("Erreur de chargement de votre thème");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { theme, loading, error };
};

// hooks/useAvailableInterns.js  ← Pour admin/superviseur
export const useAvailableInterns = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/available-interns/")  // ← URL exacte que ton router attend
      .then(res => {
        setInterns(res.data);
        setLoading(false);
      })
      .catch(() => {
        setInterns([]);
        setLoading(false);
      });
  }, []);

  return { interns, loading };
};

// hooks/useThemeActions.js  ← Pour créer / attribuer / désattribuer
export const useThemeActions = () => {
  const createTheme = async (data) => {
    const res = await api.post("/themes/", data);
    return res.data;
  };

  const assignTheme = async (themeId, internId, assignmentDate = null) => {
    const res = await api.post(`/themes/${themeId}/assign/`, {
      intern_id: internId,
      assignment_date: assignmentDate,
    });
    return res.data;
  };

  const unassignTheme = async (themeId) => {
    const res = await api.post(`/themes/${themeId}/unassign/`);
    return res.data;
  };

  const deleteTheme = async (themeId) => {
    await api.delete(`/themes/${themeId}/`);
  };

  return { createTheme, assignTheme, unassignTheme, deleteTheme };
};

// hooks/useThemeStats.js
export const useThemeStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/themes/stats/")
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
};