import React, { useState, useEffect } from 'react';
import AdminSideBar from '../AdminSideBar';
import {
  Box,
  Grid,
  Typography,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  Restore as RestoreIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';

// Composant principal
const ArchivesAdmin = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Simuler des données d'archives
  useEffect(() => {
    // Simuler le chargement des données
    setLoading(true);
    
    setTimeout(() => {
      // Données d'utilisateurs archivés
      const sampleArchivedUsers = [
        {
          id: 1,
          firstName: '',
          lastName: '',
          email: 'academiegeeks@gmail.com',
          role: 'Intern',
          status: 'supprimé',
          archiveDate: new Date('2025-10-15'),
          avatar: '/static/images/avatar/1.jpg',
        },
        {
          id: 2,
          firstName: '',
          lastName: '',
          email: 'nangadonatello@outlook.com',
          role: 'Intern',
          status: 'supprimé',
          archiveDate: new Date('2025-09-22'),
          avatar: '/static/images/avatar/2.jpg',
        },
        {
          id: 3,
          firstName: '',
          lastName: '',
          email: 'utsboyz@outlook.com',
          role: 'Intern',
          status: 'archivé',
          archiveDate: new Date('2025-11-05'),
          avatar: '/static/images/avatar/3.jpg',
        },
        {
          id: 4,
          firstName: 'Luc',
          lastName: 'Moreau',
          email: 'sizeofkings@gmail.com',
          role: 'Intern',
          status: 'archivé',
          archiveDate: new Date('2025-11-05'),
          avatar: '/static/images/avatar/4.jpg',
        }
      ];

      // Données de projets archivés
      const sampleArchivedProjects = [

      ];

      setArchivedUsers(sampleArchivedUsers);
      setArchivedProjects(sampleArchivedProjects);
      setFilteredUsers(sampleArchivedUsers);
      setFilteredProjects(sampleArchivedProjects);
      setLoading(false);
    }, 1000);
  }, []);

  // Filtrage des données
  useEffect(() => {
    let filtered = archivedUsers;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, archivedUsers]);

  useEffect(() => {
    let filtered = archivedProjects;
    
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.interns.some(intern => intern.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredProjects(filtered);
  }, [searchTerm, archivedProjects]);

  // Gestionnaires d'événements
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm('');
    setStatusFilter('all');
  };

  const handleRestoreUser = (user) => {
    setSelectedUser(user);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = () => {
    // Dans un vrai projet, appel API pour restaurer l'utilisateur
    setArchivedUsers(archivedUsers.filter(user => user.id !== selectedUser.id));
    setRestoreDialogOpen(false);
    setSelectedUser(null);
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'archivé': return 'default';
      case 'supprimé': return 'error';
      case 'suspendu': return 'warning';
      default: return 'default';
    }
  };





  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar existante (supposée être importée) */}
      {/* <AdminSidebar /> */}
      <AdminSideBar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      {/* Contenu principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <ArchiveIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                  Archivage
                </Typography>
             
              </Box>
            </Box>
          </Toolbar>
        </AppBar>


        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab icon={<PeopleIcon />} label="Archive des Utilisateurs" />
          <Tab icon={<WorkIcon />} label="Archive des Projets" />
        </Tabs>

        {/* Barre de recherche et filtres */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder={`Rechercher ${activeTab === 0 ? 'un utilisateur' : 'un projet'}...`}
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          
          {activeTab === 0 && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Statut"
              >
                <MenuItem value="all">Tous les statuts</MenuItem>
                <MenuItem value="désactivé">Désactivé</MenuItem>
                <MenuItem value="supprimé">Supprimé</MenuItem>
                <MenuItem value="suspendu">Suspendu</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table sx={{ minWidth: 650 }} aria-label="table of archived users">
                  <TableHead>
                    <TableRow>
                      <TableCell>Utilisateur</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rôle</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Date d'archivage</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar src={user.avatar} sx={{ mr: 2 }}>
                              {user.firstName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {user.firstName} {user.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {user.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip label={user.role} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.status} 
                            size="small" 
                            color={getStatusColor(user.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {user.archiveDate.toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Restaurer l'utilisateur">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleRestoreUser(user)}
                            >
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Voir les détails">
                            <IconButton color="info">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsers.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <ArchiveIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary">
                      Aucun utilisateur archivé trouvé
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            )}

            {activeTab === 1 && (
              <Grid container spacing={3}>
                {filteredProjects.map((project) => (
                  <Grid item xs={12} md={6} key={project.id}>
                   
                  </Grid>
                ))}
                
                {filteredProjects.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <WorkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        Aucun projet archivé trouvé
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </>
        )}

        {/* Dialogue de restauration d'utilisateur */}
        <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
          <DialogTitle>Restaurer l'utilisateur</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Vous êtes sur le point de restaurer cet utilisateur.
            </Alert>
            {selectedUser && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar src={selectedUser.avatar} sx={{ mr: 2 }}>
                  {selectedUser.firstName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email} • {selectedUser.role}
                  </Typography>
                </Box>
              </Box>
            )}
            <Typography variant="body2">
              Cette action restaurera tous les droits et accès de l'utilisateur. 
              Êtes-vous sûr de vouloir continuer ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestoreDialogOpen(false)}>Annuler</Button>
            <Button onClick={confirmRestore} variant="contained" color="primary">
              Confirmer la restauration
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ArchivesAdmin;