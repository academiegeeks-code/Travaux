import api from "./api";

// Intercepteur de requête : ajoute le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur de réponse : gère les erreurs 401 (token expiré)
api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;

  // Si le token a expiré et qu'on n'a pas déjà tenté de le rafraîchir
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    try {
      const refreshToken = localStorage.getItem("refresh");
      const res = await api.post("token/refresh/", { refresh: refreshToken });
      const newAccess = res.data.access;
      localStorage.setItem("access", newAccess);
      api.defaults.headers.Authorization = `Bearer ${newAccess}`;
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest); // relance la requête originale
    } catch (refreshError) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login"; // redirige vers login
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
});
