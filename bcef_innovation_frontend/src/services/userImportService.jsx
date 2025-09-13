// services/userImportService.js
import api from "../api/api"; // votre instance axios

export async function importUsersFromCSV(file, role = "user", progressCallback = null) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("role", role);

  console.log("📤 Envoi fichier:", file.name, "Type:", file.type);
  
  try {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    // Ajoutez le suivi de progression si un callback est fourni
    if (progressCallback) {
      config.onUploadProgress = (progressEvent) => {
        const { loaded, total } = progressEvent;
        progressCallback(loaded, total);
      };
    }

    const response = await api.post("users/bulk-import/", formData, config);
    return response.data;
  } catch (error) {
    console.error("❌ Erreur import:", error.response?.data);
    throw error;
  }
}