// hooks/useAuth.js
import { useState, useEffect } from "react";
import api from "../api/api";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    /*const validateAndFetchProfile = async () => {
      if (token) {
        setLoading(true);
        try {
          //const res = await api.post("login/", payload);
          setUser(res.data);
          setError(null);
        } catch (err) {
          setError("Token invalide ou profil inaccessible");
          logout();
        } finally {
          setLoading(false);
          setAuthChecked(true);
        }
      } else {
        setAuthChecked(true);
      }
    };*/
    setAuthChecked(true)
  }, [token]);

  const login = async (email, password, captchaToken = null) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { email, password };
      
      // Ajouter le token reCAPTCHA seulement s'il est fourni
      if (captchaToken) {
        payload.captcha_token = captchaToken;
      }
      
      const res = await api.post("login/", payload);  // définir res ici
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      setToken(res.data.access);
      setUser(res.data.user);  // ← setUser APRES réception de la réponse
      setError(null);
      return true; // Succès
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Erreur lors de la connexion. Vérifiez vos identifiants."
      );
      return false; // Échec
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
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