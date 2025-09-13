// src/components/UserOrganigrammeView.jsx
import React from 'react';
import { Paper, Typography, Grid, Card, CardContent, Box, Avatar, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';

const UserOrganigrammeView = ({ users }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>Vue Organigramme</Typography>
    <Grid container spacing={2}>
      {users.filter(user => user.role === 'Encadreur').map(encadreur => (
        <Grid item xs={12} md={6} key={encadreur.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar src={encadreur.avatar} sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{encadreur.name}</Typography>
                  <Chip label={`${encadreur.trainees || 0} stagiaires`} size="small" color="primary" variant="outlined" />
                </Box>
              </Box>
              <List dense>
                {users.filter(user => user.encadreur === encadreur.name).map(stagiaire => (
                  <ListItem key={stagiaire.id}>
                    <ListItemIcon><Avatar src={stagiaire.avatar} sx={{ width: 32, height: 32 }} /></ListItemIcon>
                    <ListItemText primary={stagiaire.name} secondary={stagiaire.email} />
                    <Chip
                      label={stagiaire.status}
                      size="small"
                      color={stagiaire.status === 'Actif' ? 'success' : stagiaire.status === 'Inactif' ? 'error' : 'warning'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Paper>
); export default UserOrganigrammeView;