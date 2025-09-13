// src/components/AISuggestions.jsx
import React from 'react';
import { Fade, Paper, Box, Typography, IconButton, Button } from '@mui/material';
import { Insights, NotificationsActive } from '@mui/icons-material';

const AISuggestions = ({ open, onClose }) => (
  <Fade in={open}>
    <Paper sx={{ mb: 2, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Insights sx={{ mr: 1 }} />
          <Typography variant="h6">Suggestions</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <NotificationsActive />
        </IconButton>
      </Box>
      <Typography sx={{ mt: 1 }}>
        "2 stagiaires n'ont pas été actifs depuis 30 jours, souhaitez-vous les désactiver?"
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Button size="small" variant="contained" sx={{ mr: 1 }}>Voir les détails</Button>
        <Button size="small" variant="outlined">Ignorer</Button>
      </Box>
    </Paper>
  </Fade>
) ; export default AISuggestions;