// services/exportService.js
import api from '../api/api';

const exportService = {
  // Export des utilisateurs
  exportUsers: async (format, filters = {}) => {
    const response = await api.get('/users/bulk-export/', {
      params: {
        format,
        ...filters
      },
      responseType: 'blob' // Important pour les fichiers
    });
    return response;
  },

  // Export générique pour d'autres données
  exportData: async (endpoint, format, filters = {}) => {
    const response = await api.get(`/api/${endpoint}/bulk-export/`, {
      params: {
        format,
        ...filters
      },
      responseType: 'blob'
    });
    return response;
  }
};

export default exportService;