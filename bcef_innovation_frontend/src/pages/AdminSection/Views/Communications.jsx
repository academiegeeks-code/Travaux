// components/Communications.jsx
import React, { useState } from 'react';
import { useAnnouncements, useAnnouncementActions } from '../Hooks/announcements/useAnnouncements';
//import useAuth from '../../../hooks/useAuth';
import AdminSideBar from "../AdminSideBar";
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stack,
  IconButton
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  PriorityHigh as PriorityHighIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const Communications = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAnnouncementId, setCurrentAnnouncementId] = useState(null);
  
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
    publication_date: new Date(Date.now() + 60000).toISOString().slice(0, 16),
    is_active: true
  });

  const { announcements, loading, error, refetch } = useAnnouncements();
  const { createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncementActions();
  //const { user } = useAuth();
  const isAdmin = true; //user?.role === 'admin';

  const handleAnnouncementSubmit = async () => {
    try {
      console.log('Soumission de l\'annonce:', newAnnouncement);
      
      const dataToSend = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        publication_date: new Date(newAnnouncement.publication_date).toISOString(),
        is_active: newAnnouncement.is_active
      };
      
      console.log('Données envoyées:', dataToSend);
      
      let result;
      if (editMode && currentAnnouncementId) {
        result = await updateAnnouncement(currentAnnouncementId, dataToSend);
      } else {
        result = await createAnnouncement(dataToSend);
      }
      
      console.log('Résultat:', result);
      
      if (result && result.success) {
        handleDialogClose();
        refetch();
      } else {
        console.error('Erreur lors de l\'opération:', result);
        const errorMessage = result?.error?.publication_date 
          ? `Erreur de date: ${result.error.publication_date.join(', ')}`
          : 'Erreur lors de l\'opération. Vérifiez la console.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Exception lors de l\'opération:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditMode(true);
    setCurrentAnnouncementId(announcement.id);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      publication_date: new Date(announcement.publication_date).toISOString().slice(0, 16),
      is_active: announcement.is_active
    });
    setAnnouncementDialogOpen(true);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      const result = await deleteAnnouncement(id);
      if (result.success) {
        refetch();
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleDialogClose = () => {
    setAnnouncementDialogOpen(false);
    setEditMode(false);
    setCurrentAnnouncementId(null);
    setNewAnnouncement({
      title: '',
      content: '',
      priority: 'medium',
      publication_date: new Date(Date.now() + 60000).toISOString().slice(0, 16),
      is_active: true
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'primary';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'high' || priority === 'urgent') {
      return <PriorityHighIcon sx={{ fontSize: 16 }} />;
    }
    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AdminSideBar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, maxWidth: 1200, mx: 'auto' }}>
        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Communications
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refetch}
                disabled={loading}
              >
                Actualiser
              </Button>
              
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAnnouncementDialogOpen(true)}
                >
                  Créer une annonce
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Contenu principal */}
        <Card>
          <CardContent>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message || error}
              </Alert>
            )}

            {!loading && announcements.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AnnouncementIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucune annonce
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Les annonces apparaîtront ici
                </Typography>
              </Box>
            )}

            {!loading && announcements.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  {announcements.length} annonce{announcements.length > 1 ? 's' : ''}
                </Typography>

                <List sx={{ p: 0 }}>
                  {announcements.map((announcement, index) => (
                    <React.Fragment key={announcement.id}>
                      <ListItem 
                        alignItems="flex-start" 
                        sx={{ 
                          px: 0,
                          py: 2.5
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <AnnouncementIcon />
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="h6" component="span">
                                {announcement.title}
                              </Typography>
                              <Chip 
                                icon={getPriorityIcon(announcement.priority)}
                                label={announcement.priority_display} 
                                size="small" 
                                color={getPriorityColor(announcement.priority)}
                                variant="outlined" 
                              />
                              {!announcement.is_active && (
                                <Chip 
                                  label="Inactive" 
                                  size="small" 
                                  color="default"
                                  variant="outlined" 
                                />
                              )}
                            </Stack>
                          }
                          secondary={
                            <>
                              <Typography 
                                variant="body2" 
                                color="text.primary" 
                                sx={{ mt: 1, mb: 1.5 }}
                              >
                                {announcement.content}
                              </Typography>
                              
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(announcement.publication_date)}
                                  </Typography>
                                  {announcement.created_by_name && (
                                    <>
                                      <Typography variant="caption" color="text.secondary">
                                        •
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {announcement.created_by_name}
                                      </Typography>
                                    </>
                                  )}
                                </Stack>

                                {isAdmin && (
                                  <Stack direction="row" spacing={1}>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEditAnnouncement(announcement)}
                                      title="Modifier"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                                      title="Supprimer"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                )}
                              </Stack>
                            </>
                          }
                        />
                      </ListItem>
                      
                      {index < announcements.length - 1 && (
                        <Divider component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialogue de création/modification */}
        <Dialog 
          open={announcementDialogOpen} 
          onClose={handleDialogClose} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            {editMode ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Titre"
                fullWidth
                variant="outlined"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                required
              />
              
              <TextField
                label="Contenu"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                required
              />
              
              <FormControl fullWidth>
                <InputLabel>Priorité</InputLabel>
                <Select
                  value={newAnnouncement.priority}
                  label="Priorité"
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                >
                  <MenuItem value="low">Basse</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="high">Haute</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Date de publication"
                type="datetime-local"
                fullWidth
                variant="outlined"
                value={newAnnouncement.publication_date}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, publication_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newAnnouncement.is_active}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, is_active: e.target.checked})}
                  />
                }
                label="Annonce active"
              />
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleDialogClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleAnnouncementSubmit} 
              variant="contained"
              disabled={!newAnnouncement.title || !newAnnouncement.content}
            >
              {editMode ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Communications;