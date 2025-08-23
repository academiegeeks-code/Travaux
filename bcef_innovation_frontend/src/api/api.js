import axios from "axios";

// Base URL de ton backend Django
const BASE_URL = "http://localhost:8000/api/"; // adapte selon ton environnement

// Crée une instance Axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter automatiquement le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
