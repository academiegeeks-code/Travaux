// UserTableView.jsx - VERSION CORRIGÉE
import React, { useState } from 'react';
import { 
  Paper, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableSortLabel, 
  TableBody, 
  Checkbox, 
  Box, 
  Avatar, 
  Chip, 
  Tooltip, 
  IconButton, 
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { Visibility, Archive, Restore } from '@mui/icons-material'; // ← AJOUT de Restore

const UserTableView = ({
  users,
  filteredUsers,
  order,
  orderBy,
  handleRequestSort,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  selected,
  handleSelectAllClick,
  handleClick,
  isSelected,
  openUserDetail,
  onUserArchive,
  onUserRestore, // ← AJOUT de cette prop
  currentUserRole
}) => {
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [userToArchive, setUserToArchive] = useState(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [userToRestore, setUserToRestore] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState('');

  // Ouvrir la dialog de confirmation d'archivage
  const handleOpenArchiveDialog = (user, event) => {
    event.stopPropagation();
    setUserToArchive(user);
    setArchiveDialogOpen(true);
  };

  // Confirmer l'archivage
  const handleConfirmArchive = async () => {
    if (userToArchive && onUserArchive) {
      const result = await onUserArchive(userToArchive.id);
      
      if (result.success) {
        setArchiveMessage(result.message);
      } else {
        setArchiveMessage(result.message);
      }
      setSnackbarOpen(true);
    }
    setArchiveDialogOpen(false);
    setUserToArchive(null);
  };

  // Annuler l'archivage
  const handleCancelArchive = () => {
    setArchiveDialogOpen(false);
    setUserToArchive(null);
  };

  // Ouvrir la dialog de restauration
  const handleOpenRestoreDialog = (user, event) => {
    event.stopPropagation();
    setUserToRestore(user);
    setRestoreDialogOpen(true);
  };

  // Confirmer la restauration
  const handleConfirmRestore = async () => {
    if (userToRestore && onUserRestore) {
      const result = await onUserRestore(userToRestore.id);
      if (result.success) {
        setArchiveMessage(result.message);
      } else {
        setArchiveMessage(result.message);
      }
      setSnackbarOpen(true);
    }
    setRestoreDialogOpen(false);
    setUserToRestore(null);
  };

  // Annuler la restauration
  const handleCancelRestore = () => {
    setRestoreDialogOpen(false);
    setUserToRestore(null);
  };

  // Fermer le snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Paper sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        minHeight: 0
      }}>
        {/* Table Container avec scroll */}
        <TableContainer sx={{ 
          flex: 1, 
          overflow: 'auto',
          minHeight: 0
        }}>
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < users.length}
                    checked={users.length > 0 && selected.length === users.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={orderBy === 'name'} 
                    direction={orderBy === 'name' ? order : 'asc'} 
                    onClick={() => handleRequestSort('name')}
                  >
                    Nom
                  </TableSortLabel>
                </TableCell>
                <TableCell>Email</TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={orderBy === 'role'} 
                    direction={orderBy === 'role' ? order : 'asc'} 
                    onClick={() => handleRequestSort('role')}
                  >
                    Rôle
                  </TableSortLabel>
                </TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={orderBy === 'lastLogin'} 
                    direction={orderBy === 'lastLogin' ? order : 'asc'} 
                    onClick={() => handleRequestSort('lastLogin')}
                  >
                    Dernière connexion
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const itemSelected = isSelected(user.id);
                return (
                  <TableRow 
                    hover 
                    key={user.id} 
                    selected={itemSelected} 
                    onClick={() => handleClick(user.id)} 
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={itemSelected} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={user.avatar} sx={{ width: 32, height: 32, mr: 1 }} />
                        {user.name}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={user.status === 'Actif' ? 'success' : user.status === 'Inactif' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Jamais'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Voir détails">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserDetail(user);
                            }}
                            color="info"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                                              
                      {user.is_active ? (
  currentUserRole !== 'admin' && (
    <Tooltip title="Archiver l'utilisateur">
      <IconButton 
        size="small" 
        onClick={(e) => handleOpenArchiveDialog(user, e)}
        color="warning"
      >
        <Archive />
      </IconButton>
    </Tooltip>
  )
) : (
  <Tooltip title="Restaurer l'utilisateur">
    <IconButton 
      size="small" 
      onClick={(e) => handleOpenRestoreDialog(user, e)}
      color="success"
    >
      <Restore />
    </IconButton>
  </Tooltip>
)}


                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
          sx={{
            flexShrink: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        />
      </Paper>

      {/* Dialog de confirmation d'archivage */}
      <Dialog
        open={archiveDialogOpen}
        onClose={handleCancelArchive}
        aria-labelledby="archive-dialog-title"
      >
        <DialogTitle id="archive-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Archive color="warning" />
            Confirmer l'archivage
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir archiver l'utilisateur <strong>{userToArchive?.name}</strong> ?
            <br />
            <br />
            <strong>L'archivage :</strong>
            <ul>
              <li>Rend l'utilisateur inactif</li>
              <li>Conserve ses données pour référence</li>
              <li>Peut être annulé ultérieurement</li>
              <li>N'affecte pas les statistiques historiques</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelArchive} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmArchive} 
            color="warning"
            variant="contained"
            startIcon={<Archive />}
          >
            Confirmer l'archivage
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de restauration */}
      <Dialog
        open={restoreDialogOpen}
        onClose={handleCancelRestore}
        aria-labelledby="restore-dialog-title"
      >
        <DialogTitle id="restore-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Restore color="success" />
            Confirmer la restauration
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir restaurer l'utilisateur <strong>{userToRestore?.name}</strong> ?
            <br />
            <br />
            <strong>La restauration :</strong>
            <ul>
              <li>Rend l'utilisateur actif</li>
              <li>Rétablit tous ses accès</li>
              <li>Conserve son historique</li>
              <li>Le rend à nouveau visible dans les listes</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRestore} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmRestore} 
            color="success"
            variant="contained"
            startIcon={<Restore />}
          >
            Confirmer la restauration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de confirmation */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
          icon={archiveMessage.includes('archivé') ? <Archive /> : <Restore />}
        >
          {archiveMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserTableView;