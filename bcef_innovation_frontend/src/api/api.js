import axios from "axios";

// Base URL de ton backend Django
const BASE_URL = "http://localhost:8000/api/";

// Crée une instance Axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 secondes max
});

// Ajoute le token par défaut si déjà connecté
const initialToken = localStorage.getItem("access_token");
if (initialToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${initialToken}`;
}

// === INTERCEPTEUR REQUEST : Ajout du token JWT ===
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token"); // UNIFIÉ
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// === INTERCEPTEUR RESPONSE : Gestion 401 avec refresh AUTOMATIQUE ===
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // ON UTILISE api (avec baseURL) MAIS SANS RISQUE DE BOUCLE
        const refreshResponse = await axios.post(
          `${BASE_URL}token/refresh/`,
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } } // pas de Authorization ici
        );

        const newAccessToken = refreshResponse.data.access;

        // SAUVEGARDE IMMÉDIATE
        localStorage.setItem("access_token", newAccessToken);

        // MISE À JOUR DIRECTE DU HEADER (plus fiable que localStorage)
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Réessayer la requête originale
        return api(originalRequest);

      } catch (refreshError) {
        console.error("Refresh failed → logout");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;