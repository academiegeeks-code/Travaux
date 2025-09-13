import React from 'react';
import { Box, Typography, Tooltip, IconButton, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { Search, TableChart, Schema, Settings, CloudUpload } from '@mui/icons-material';

const UserToolbar = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  setImportDialogOpen,
  setShowForm,
}) => (
  <Box sx={{ mb: 2, p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="h4" component="h1">Utilisateurs</Typography>
      <Box>
        <Tooltip title="Mode tableau">
          <IconButton color={viewMode === 'table' ? 'primary' : 'default'} onClick={() => setViewMode('table')}>
            <TableChart />
          </IconButton>
        </Tooltip>
        <Tooltip title="Vue organigramme">
          <IconButton color={viewMode === 'organigramme' ? 'primary' : 'default'} onClick={() => setViewMode('organigramme')}>
            <Schema />
          </IconButton>
        </Tooltip>
        <Tooltip title="Paramètres d'affichage">
          <IconButton><Settings /></IconButton>
        </Tooltip>
      </Box>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
      <TextField
        placeholder="Rechercher un utilisateur..."
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        sx={{ minWidth: 250, mr: 2 }}
      />
      <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
        <InputLabel>Rôle</InputLabel>
        <Select value={roleFilter} label="Rôle" onChange={(e) => setRoleFilter(e.target.value)}>
          <MenuItem value="Tous">Tous les rôles</MenuItem>
          <MenuItem value="Administrateur">Administrateur</MenuItem>
          <MenuItem value="Encadreur">Encadreur</MenuItem>
          <MenuItem value="Stagiaire">Stagiaire</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
        <InputLabel>Statut</InputLabel>
        <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
          <MenuItem value="Tous">Tous les statuts</MenuItem>
          <MenuItem value="Actif">Actif</MenuItem>
          <MenuItem value="Inactif">Inactif</MenuItem>
          <MenuItem value="En attente">En attente</MenuItem>
        </Select>
      </FormControl>
      <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => setImportDialogOpen(true)} sx={{ mr: 1 }}>
        Importer
      </Button>
      <Button variant="contained" onClick={() => setShowForm(true)}>
        Nouvel utilisateur
      </Button>
    </Box>
  </Box>
);

export default UserToolbar;