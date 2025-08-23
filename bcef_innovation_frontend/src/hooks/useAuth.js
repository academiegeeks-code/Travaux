import { useState, useEffect } from "react";
import api from "../api/api";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger le profil si token présent
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("login/", { email, password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      setToken(res.data.access);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setToken(null);
    setUser(null);
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("profile/");
      setUser(res.data);
    } catch (err) {
      setError("Impossible de charger le profil");
    }
  };

  return {
    user,
    token,
    loading,
    error,
    login,
    logout,
    fetchProfile,
    isAuthenticated: !!token,
  };
}
