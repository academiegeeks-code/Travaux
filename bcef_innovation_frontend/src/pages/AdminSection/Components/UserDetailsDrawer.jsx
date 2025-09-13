import React from 'react';
import { Drawer, Box, Avatar, Typography, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Visibility, Edit, Archive, Restore, Group } from '@mui/icons-material';

const UserDetailsDrawer = ({ open, onClose, user }) => {
  if (!user) return null;
  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: 320,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: 320, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar src={user.avatar} sx={{ width: 64, height: 64, mr: 2 }} />
          <Box>
            <Typography variant="h6">{user.name}</Typography>
            <Chip label={user.role} size="small" color={user.role.toLowerCase()} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
        <List>
          <ListItem button>
            <ListItemIcon><Visibility /></ListItemIcon>
            <ListItemText primary="Voir le profil complet" />
          </ListItem>
          <ListItem button>
            <ListItemIcon><Edit /></ListItemIcon>
            <ListItemText primary="Modifier" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>{user.status === 'Actif' ? <Archive /> : <Restore />}</ListItemIcon>
            <ListItemText primary={user.status === 'Actif' ? 'Désactiver' : 'Réactiver'} />
          </ListItem>
          {user.role === 'Encadreur' && (
            <ListItem button>
              <ListItemIcon><Group /></ListItemIcon>
              <ListItemText primary="Voir les stagiaires" />
            </ListItem>
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default UserDetailsDrawer;