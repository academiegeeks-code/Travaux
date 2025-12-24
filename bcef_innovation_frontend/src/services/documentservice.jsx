// src/services/documentService.js
import api from "../api/api";

const documentService = {
  // Récupérer les documents de l'utilisateur connecté
  getMyDocuments: async () => {
    const response = await api.get('/documents/mes_documents/');
    return response.data;
  },

  // Uploader un document - UNE SEULE FOIS
  uploadDocument: async (formData, onUploadProgress) => {
    const response = await api.post('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(progress);
        }
      }
    });
    return response.data;
  },

  // Supprimer un document
  deleteDocument: async (documentId) => {
    await api.delete(`/documents/${documentId}/`);
  },

  // Télécharger un document
  downloadDocument: async (fileUrl, fileName) => {
    // Pour le téléchargement, utilise l'URL complète du média Django
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
    
    const response = await api.get(fullUrl, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Mettre à jour le statut d'un document
  updateDocumentStatus: async (documentId, status) => {
    const response = await api.post(`/documents/${documentId}/update_statut/`, {
      statut: status
    });
    return response.data;
  },

  // Méthodes supplémentaires utiles
  getDocument: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/`);
    return response.data;
  },

  updateDocument: async (documentId, data) => {
    const response = await api.put(`/documents/${documentId}/`, data);
    return response.data;
  },

  // Récupérer les documents par type
  getDocumentsByType: async (type) => {
    const response = await api.get(`/documents/?type=${type}`);
    return response.data;
  },

  // Récupérer les documents par statut
  getDocumentsByStatus: async (status) => {
    const response = await api.get(`/documents/?statut=${status}`);
    return response.data;
  }
};

export default documentService;