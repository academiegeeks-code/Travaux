// ChatTab.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ChatService from '../../../../../services/chatservice';
import useWebSocket from '../../../../../hooks/useWebSocket';

// Styles personnalisés
const ChatContainer = styled(Paper)(({ theme }) => ({
  height: '70vh',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.grey[50], 0.5),
  display: 'flex',
  flexDirection: 'column',
}));

const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1),
}));

const MessageBubble = styled(Box)(({ theme, isown }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  backgroundColor: isown ? theme.palette.primary.main : theme.palette.background.paper,
  color: isown ? 'white' : theme.palette.text.primary,
  marginLeft: isown ? 'auto' : 0,
  marginRight: isown ? 0 : 'auto',
  marginBottom: theme.spacing(1.5),
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: isown ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.3)}`,
  wordBreak: 'break-word',
}));

const Timestamp = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  opacity: 0.6,
  marginTop: theme.spacing(0.5),
}));

const OnlineIndicator = styled(Box)(({ theme, isonline }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: isonline ? theme.palette.success.main : theme.palette.grey[400],
  marginLeft: theme.spacing(1),
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const ConversationItem = styled(Box)(({ theme, isselected }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  backgroundColor: isselected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  '&:hover': {
    backgroundColor: isselected 
      ? alpha(theme.palette.primary.main, 0.2) 
      : theme.palette.action.hover,
  },
  transition: 'background-color 0.2s',
}));

export default function ChatTab() {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // État utilisateur local (récupéré du localStorage ou simulé)
  const [user, setUser] = useState(() => {
    // Essayer de récupérer l'utilisateur depuis le localStorage
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('access');
      
      if (userData && token) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    
    // Utilisateur simulé pour les tests (à retirer en production)
    return {
      id: 1,
      email: 'stagiaire@example.com',
      first_name: 'Jean',
      last_name: 'Dupont',
      role: 'intern',
      full_name: 'Jean Dupont'
    };
  });
  
  // États pour la gestion du chat
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [encadreurs, setEncadreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConversationList, setShowConversationList] = useState(false);

  // Utilisation du hook WebSocket
  const { messages, sendMessage, isConnected, addMessageLocally } = useWebSocket(activeConversation?.id);

  // Auto-scroll vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Chargement des données initiales
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  // Marquer la conversation comme lue quand on la sélectionne
  useEffect(() => {
    if (activeConversation) {
      ChatService.markConversationAsRead(activeConversation.id);
    }
  }, [activeConversation]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadConversations(),
        user?.role === 'intern' && loadEncadreurs()
      ]);
      
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await ChatService.getConversations();
      setConversations(data);
      
      // Sélectionner la première conversation par défaut
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      throw err;
    }
  };

  const loadEncadreurs = async () => {
    try {
      const data = await ChatService.getAvailableEncadreurs();
      setEncadreurs(data);
    } catch (err) {
      console.error('Erreur chargement encadreurs:', err);
      throw err;
    }
  };

  const startNewConversation = async (encadreurId) => {
    try {
      setLoading(true);
      const conversation = await ChatService.startConversation(encadreurId);
      
      // Ajouter à la liste des conversations
      setConversations(prev => {
        const exists = prev.some(conv => conv.id === conversation.id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
      
      setActiveConversation(conversation);
      setShowConversationList(false);
      setSuccess('Conversation démarrée avec succès');
      
    } catch (err) {
      console.error('Erreur démarrage conversation:', err);
      setError('Erreur lors du démarrage de la conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const content = message.trim();
    if (!content || !activeConversation || !user) return;

    try {
      // Message optimiste
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: content,
        sender: user,
        timestamp: new Date().toISOString(),
        is_read: true
      };

      addMessageLocally(tempMessage);
      setMessage('');

      // Tentative d'envoi via WebSocket
      const sent = sendMessage(content);
      
      if (!sent) {
        // Fallback: API REST si WebSocket déconnecté
        const savedMessage = await ChatService.sendMessage(activeConversation.id, content);
        console.log('Message sent via API:', savedMessage);
      }

    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError('Erreur lors de l\'envoi du message');
      setMessage(content);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getConversationPartner = (conversation) => {
    if (!conversation || !user) return null;
    
    return user.role === 'intern' ? conversation.encadreur : conversation.stagiaire;
  };

  const getAvatarText = (userInfo) => {
    if (!userInfo) return '?';
    return `${userInfo.first_name?.[0] || ''}${userInfo.last_name?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Affichage si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <ChatContainer>
        <LoadingContainer>
          <Typography variant="h6" color="text.secondary">
            Non connecté
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Veuillez vous connecter pour accéder au chat
          </Typography>
        </LoadingContainer>
      </ChatContainer>
    );
  }

  // Affichage pendant le chargement
  if (loading && conversations.length === 0) {
    return (
      <ChatContainer>
        <LoadingContainer>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Chargement des conversations...
          </Typography>
        </LoadingContainer>
      </ChatContainer>
    );
  }

  return (
    <>
      {/* Notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      <ChatContainer>
        {/* En-tête du chat */}
        <ChatHeader>
          {showConversationList ? (
            <>
              <IconButton 
                size="small" 
                onClick={() => setShowConversationList(false)}
              >
                <BackIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Conversations
              </Typography>
              {user?.role === 'intern' && encadreurs.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Nouvelle discussion</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => startNewConversation(e.target.value)}
                    label="Nouvelle discussion"
                  >
                    {encadreurs.map((encadreur) => (
                      <MenuItem key={encadreur.id} value={encadreur.id}>
                        {encadreur.full_name || `${encadreur.first_name} ${encadreur.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          ) : (
            <>
              <IconButton 
                size="small" 
                onClick={() => setShowConversationList(true)}
              >
                <BackIcon />
              </IconButton>
              
              {activeConversation ? (
                <>
                  <Avatar 
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      width: 40,
                      height: 40
                    }}
                  >
                    {getAvatarText(getConversationPartner(activeConversation))}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600">
                      {getConversationPartner(activeConversation)?.full_name || 
                       `${getConversationPartner(activeConversation)?.first_name} ${getConversationPartner(activeConversation)?.last_name}`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {user?.role === 'intern' ? 'Votre encadreur' : 'Votre stagiaire'}
                        {activeConversation.attribution_title && ` • ${activeConversation.attribution_title}`}
                      </Typography>
                      <OnlineIndicator isonline={isConnected} />
                    </Box>
                  </Box>

                  <IconButton 
                    size="small" 
                    onClick={loadInitialData}
                    disabled={loading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </>
              ) : (
                <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Aucune conversation sélectionnée
                  </Typography>
                </Box>
              )}
            </>
          )}
        </ChatHeader>

        {/* Contenu principal */}
        {showConversationList ? (
          // Liste des conversations
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {conversations.length === 0 ? (
              <LoadingContainer>
                <Typography variant="body1" color="text.secondary">
                  Aucune conversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.role === 'intern' 
                    ? 'Commencez une nouvelle conversation avec votre encadreur'
                    : 'Vos stagiaires apparaîtront ici'
                  }
                </Typography>
              </LoadingContainer>
            ) : (
              conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  isselected={activeConversation?.id === conversation.id}
                  onClick={() => {
                    setActiveConversation(conversation);
                    setShowConversationList(false);
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: theme.palette.primary.main,
                        width: 40,
                        height: 40
                      }}
                    >
                      {getAvatarText(getConversationPartner(conversation))}
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {getConversationPartner(conversation)?.full_name || 
                         `${getConversationPartner(conversation)?.first_name} ${getConversationPartner(conversation)?.last_name}`}
                      </Typography>
                      
                      {conversation.last_message && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px'
                          }}
                        >
                          {conversation.last_message.content}
                        </Typography>
                      )}
                      
                      {conversation.attribution_title && (
                        <Typography variant="caption" color="primary">
                          {conversation.attribution_title}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      {conversation.last_message && (
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(conversation.last_message.timestamp)}
                        </Typography>
                      )}
                      {conversation.unread_count > 0 && (
                        <Box
                          sx={{
                            backgroundColor: theme.palette.error.main,
                            color: 'white',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            marginTop: 0.5
                          }}
                        >
                          {conversation.unread_count}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </ConversationItem>
              ))
            )}
          </Box>
        ) : activeConversation ? (
          // Chat actif
          <>
            {/* Zone des messages */}
            <MessagesArea>
              {messages.length === 0 ? (
                <LoadingContainer>
                  <Typography variant="body1" color="text.secondary">
                    Aucun message
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Soyez le premier à envoyer un message !
                  </Typography>
                </LoadingContainer>
              ) : (
                messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    isown={msg.sender.id === user.id}
                  >
                    <Typography variant="body1" sx={{ lineHeight: 1.4 }}>
                      {msg.content}
                    </Typography>
                    <Timestamp sx={{ textAlign: msg.sender.id === user.id ? 'right' : 'left' }}>
                      {formatTime(msg.timestamp)}
                      {msg.sender.id === user.id && (msg.is_read ? ' ✓✓' : ' ✓')}
                    </Timestamp>
                  </MessageBubble>
                ))
              )}
              <div ref={messagesEndRef} />
            </MessagesArea>

            <Divider />

            {/* Zone de saisie */}
            <InputArea>
              <IconButton size="small" disabled>
                <AttachFileIcon />
              </IconButton>
              
              <IconButton size="small" disabled>
                <EmojiIcon />
              </IconButton>
              
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder={isConnected ? "Tapez votre message..." : "Connexion en cours..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="outlined"
                size="small"
                disabled={!isConnected}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: theme.spacing(3),
                  }
                }}
              />
              
              <IconButton 
                color="primary" 
                onClick={handleSendMessage}
                disabled={!message.trim() || !isConnected || !activeConversation}
                sx={{
                  backgroundColor: message.trim() && isConnected ? theme.palette.primary.main : 'transparent',
                  color: message.trim() && isConnected ? 'white' : theme.palette.action.active,
                  '&:hover': {
                    backgroundColor: message.trim() && isConnected ? theme.palette.primary.dark : theme.palette.action.hover,
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </InputArea>
          </>
        ) : (
          // Aucune conversation sélectionnée
          <LoadingContainer>
            <Typography variant="h6" color="text.secondary">
              Bienvenue dans le chat
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 300 }}>
              {conversations.length === 0 
                ? "Commencez une nouvelle conversation avec votre encadreur"
                : "Sélectionnez une conversation dans la liste pour commencer à discuter"
              }
            </Typography>
            {conversations.length === 0 && user?.role === 'intern' && (
              <IconButton 
                color="primary" 
                onClick={() => setShowConversationList(true)}
                sx={{ mt: 2 }}
              >
                <RefreshIcon />
              </IconButton>
            )}
          </LoadingContainer>
        )}
      </ChatContainer>
    </>
  );
}