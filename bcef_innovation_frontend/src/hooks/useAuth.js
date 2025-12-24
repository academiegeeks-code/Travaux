// hooks/useAuth.js
import { useState, useEffect } from "react";
import api from "../api/api";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Au chargement, récupérer l'user du localStorage si il existe
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erreur parsing user:", e);
        localStorage.removeItem("user");
      }
    }
    setAuthChecked(true);
  }, []);

  const login = async (email, password, captchaToken = null) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { email, password };
      
      if (captchaToken) {
        payload.captcha_token = captchaToken;
      }
      
      const res = await api.post("login/", payload);
      
      // STOCKER L'USER DANS LE LOCALSTORAGE
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user)); // ← ICI
      
      setToken(res.data.access);
      setUser(res.data.user);
      setError(null);
      return true;
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Erreur lors de la connexion. Vérifiez vos identifiants."
      );
      return false;
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user"); // ← RETIRER L'USER AUSSI
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    setError(null);
    setAuthChecked(true);
  };

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get("profile/");
      // METTRE À JOUR L'USER DANS LE LOCALSTORAGE
      localStorage.setItem("user", JSON.stringify(res.data));
      setUser(res.data);
      setError(null);
    } catch (err) {
      setError("Impossible de charger le profil");
    } finally {
      setLoading(false);
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
    isAuthenticated: !!token && !!user,
    authChecked,
  };
}