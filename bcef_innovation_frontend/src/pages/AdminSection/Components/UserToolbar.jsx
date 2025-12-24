// src/Components/UserToolbar.jsx
import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Menu,
  alpha,
} from '@mui/material';
import {
  Search,
  TableChart,
  Schema,
  Settings,
  CloudUpload,
  Download,
  Add,
  TableView,
  TextSnippet,
} from '@mui/icons-material';

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
  onExport,
  users = [],
}) => {
  const [exportAnchor, setExportAnchor] = React.useState(null);

  const handleExportClick = (event) => setExportAnchor(event.currentTarget);
  const handleExportClose = () => setExportAnchor(null);
  const handleExport = (format) => {
    onExport?.(format, users);
    handleExportClose();
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: { xs: 12, sm: 16, md: 0 },
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1, // Au-dessus de tout
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        pt: 3,
        pb: 2.5,
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>

        {/* Titre + Boutons vue */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              background: 'linear-gradient(90deg, #1976d2 0%, #9c27b0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Gestion des utilisateurs
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5, bgcolor: alpha('#000', 0.04), p: 0.5, borderRadius: 3 }}>
            <Tooltip title="Vue tableau">
              <IconButton
                size="small"
                color={viewMode === 'table' ? 'primary' : 'default'}
                onClick={() => setViewMode('table')}
                sx={{
                  borderRadius: 2,
                  bgcolor: viewMode === 'table' ? 'primary.main' : 'transparent',
                  color: viewMode === 'table' ? 'white' : 'inherit',
                }}
              >
                <TableChart />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vue organigramme">
              <IconButton
                size="small"
                color={viewMode === 'organigramme' ? 'primary' : 'default'}
                onClick={() => setViewMode('organigramme')}
                sx={{
                  borderRadius: 2,
                  bgcolor: viewMode === 'organigramme' ? 'primary.main' : 'transparent',
                  color: viewMode === 'organigramme' ? 'white' : 'inherit',
                }}
              >
                <Schema />
              </IconButton>
            </Tooltip>
            <Tooltip title="Paramètres d'affichage">
              <IconButton size="small">
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Recherche + Filtres */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Rechercher un utilisateur..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            }}
            sx={{
              flex: '1 1 320px',
              minWidth: 280,
              '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.default' },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Rôle</InputLabel>
            <Select value={roleFilter} label="Rôle" onChange={(e) => setRoleFilter(e.target.value)}>
              <MenuItem value="Tous">Tous les rôles</MenuItem>
              <MenuItem value="Administrateur">Administrateur</MenuItem>
              <MenuItem value="Encadreur">Encadreur</MenuItem>
              <MenuItem value="Stagiaire">Stagiaire</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Statut</InputLabel>
            <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="Tous">Tous les statuts</MenuItem>
              <MenuItem value="Actif">Actif</MenuItem>
              <MenuItem value="Inactif">Inactif</MenuItem>
              <MenuItem value="En attente">En attente</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Boutons d'action avec Tooltip partout */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Importer des utilisateurs (CSV, Excel)">
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => setImportDialogOpen(true)}
                size="medium"
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
              >
                Importer
              </Button>
            </Tooltip>

            <Tooltip title="Exporter la liste actuelle">
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportClick}
                size="medium"
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
              >
                Exporter
              </Button>
            </Tooltip>
          </Box>

          {/* Bouton + avec Tooltip cohérent */}
          <Tooltip title="Ajouter un nouvel utilisateur">
            <IconButton
              onClick={() => setShowForm(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 56,
                height: 56,
                boxShadow: '0 8px 28px rgba(25, 118, 210, 0.4)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 36px rgba(25, 118, 210, 0.5)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Add fontSize="large" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Menu Export */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={handleExportClose}
        PaperProps={{ sx: { borderRadius: 3, mt: 1, boxShadow: 6 } }}
      >
        <MenuItem onClick={() => handleExport('excel')}>
          <TableView sx={{ mr: 2, color: 'success.main' }} /> Excel
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <TextSnippet sx={{ mr: 2, color: 'info.main' }} /> CSV
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserToolbar;