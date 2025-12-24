// src/Components/UserDetailsDrawer.jsx
import React from 'react';
import {
  Drawer,
  Box,
  Avatar,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  alpha,
} from '@mui/material';
import { Close, Visibility, Edit, Archive, Restore, Group, FiberManualRecord } from '@mui/icons-material';
import { motion } from 'framer-motion';

const UserDetailsDrawer = ({ open, onClose, user }) => {
  if (!user) return null;

  const isActive = user.status === 'Actif';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{
        keepMounted: true,
        BackdropProps: { sx: { bgcolor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' } },
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: 360,
          maxWidth: '92vw',
          height: 'fit-content',        // ← La clé magique
          maxHeight: '96vh',
          my: '2vh',                     // ← Centré verticalement
          mx: 'auto',
          mr: 3,                         // Légèrement détaché du bord droit
          borderRadius: '20px 0 0 20px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)',
        },
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, x: 100 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.92, opacity: 0, x: 100 }}
        transition={{ type: 'spring', damping: 28, stiffness: 400 }}
        style={{ height: '100%' }}
      >
        {/* Header compact */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {user.name}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, pb: 3 }}>
          {/* Avatar + badge statut */}
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{
                width: 78,
                height: 78,
                border: '4px solid white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: -4,
                width: 24,
                height: 24,
                bgcolor: isActive ? '#4caf50' : '#757575',
                border: '3px solid white',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <FiberManualRecord sx={{ color: 'white', fontSize: 14 }} />
            </Box>
          </Box>

          {/* Infos rapides */}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {user.email}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, my: 2, flexWrap: 'wrap' }}>
            <Chip label={user.role} size="small" color="primary" variant="outlined" />
            <Chip label={user.status} size="small" color={isActive ? 'success' : 'default'} />
          </Box>

          {/* Actions ultra-compactes */}
          <List sx={{ pt: 1 }}>
            {[
              { icon: <Visibility />, text: 'Voir le profil' },
              { icon: <Edit />, text: 'Modifier' },
              { icon: isActive ? <Archive /> : <Restore />, text: isActive ? 'Archiver' : 'Réactiver' },
              user.role === 'Encadreur' && { icon: <Group />, text: 'Voir les stagiaires' },
            ]
              .filter(Boolean)
              .map((item, i) => (
                <ListItem
                  key={i}
                  button
                  sx={{
                    borderRadius: 2,
                    mb: 0.8,
                    py: 1.2,
                    '&:hover': { bgcolor: alpha('#1976d2', 0.08), transform: 'translateX(-3px)' },
                    transition: 'all 0.22s ease',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: item.text.includes('Réactiver') ? 'success.main' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItem>
              ))}
          </List>
        </Box>
      </motion.div>
    </Drawer>
  );
};

export default UserDetailsDrawer;