import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Chip,
  Button,
  Avatar,
  Divider
} from '@mui/material';
import { Announcement, Assignment } from '@mui/icons-material';

// Données simulées pour les annonces
const annoncesData = [
  {
    id: 1,
    titre: 'Nouveau Sondage Disponible',
    date: '2024-01-10',
    type: 'sondage',
    urgent: true,
    description: 'Participez au sondage sur l\'amélioration de la plateforme'
  },
  {
    id: 2,
    titre: 'Maintenance Planifiée',
    date: '2024-01-12',
    type: 'systeme',
    urgent: false,
    description: 'La plateforme sera indisponible le 15 janvier de 2h à 4h'
  },
];

export default function Annonces() {
  return (
    // Remplacer le Paper principal
<Paper sx={{ 
  p: 3, 
  height: '100%', // Prend toute la hauteur
  minHeight: '600px',
  width: '100%', // Prend toute la largeur
  display: 'flex',
  flexDirection: 'column'
}}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 2 }}>
        <Announcement sx={{ mr: 2, color: 'secondary.main', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">
          Annonces
        </Typography>
      </Box>

      <List sx={{ width: '100%' }}>
        {annoncesData.map((annonce, index) => (
          <React.Fragment key={annonce.id}>
            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Avatar sx={{ 
                  bgcolor: annonce.urgent ? 'error.main' : 
                          annonce.type === 'sondage' ? 'warning.main' : 
                          annonce.type === 'formation' ? 'success.main' : 'info.main'
                }}>
                  <Assignment />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ flexGrow: 1, mr: 1 }}>
                      {annonce.titre}
                    </Typography>
                    {annonce.urgent && (
                      <Chip 
                        label="URGENT" 
                        color="error" 
                        size="small"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {annonce.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Publié le {new Date(annonce.date).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < annoncesData.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>

      <Button 
        variant="outlined" 
        fullWidth 
        sx={{ mt: 2 }}
        startIcon={<Announcement />}
      >
        Voir toutes les annonces
      </Button>
    </Paper>
  );
}