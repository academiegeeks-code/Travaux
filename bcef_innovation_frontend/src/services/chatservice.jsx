// services/chatService.js
import api from '../api/api'; // Utilise votre instance axios configurée

const CHAT_BASE_URL = '/chat/'; // Relative à votre BASE_URL existante

class ChatService {
  
  // Récupérer les encadreurs disponibles
  async getAvailableEncadreurs() {
    const response = await api.get(`${CHAT_BASE_URL}available-encadreurs/`);
    return response.data;
  }

  // Conversations
  async getConversations() {
    const response = await api.get(`${CHAT_BASE_URL}conversations/`);
    return response.data;
  }

  async getConversation(conversationId) {
    const response = await api.get(`${CHAT_BASE_URL}conversations/${conversationId}/`);
    return response.data;
  }

  async startConversation(encadreurId, attributionId = null) {
    const response = await api.post(
      `${CHAT_BASE_URL}conversations/start_with_encadreur/`,
      { 
        encadreur_id: encadreurId,
        attribution_id: attributionId 
      }
    );
    return response.data;
  }

  async getConversationMessages(conversationId) {
    const response = await api.get(
      `${CHAT_BASE_URL}conversations/${conversationId}/messages/`
    );
    return response.data;
  }

  // Messages
  async sendMessage(conversationId, content) {
    const response = await api.post(`${CHAT_BASE_URL}messages/`, {
      conversation: conversationId,
      content: content
    });
    return response.data;
  }

  async markConversationAsRead(conversationId) {
    const response = await api.post(
      `${CHAT_BASE_URL}messages/mark_conversation_read/`,
      { conversation_id: conversationId }
    );
    return response.data;
  }

  // Supprimer une conversation (optionnel)
  async deleteConversation(conversationId) {
    const response = await api.delete(`${CHAT_BASE_URL}conversations/${conversationId}/`);
    return response.data;
  }
}

export default new ChatService();