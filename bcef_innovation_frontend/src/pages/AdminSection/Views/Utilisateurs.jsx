// src/views/AdvancedUserView.jsx (composant principal refactorisé)
import React, { useState, useMemo } from 'react';
import UserForm from "./../Components/Formulaire";
import AdminSideBar from "./../AdminSideBar";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline, Paper, Collapse } from '@mui/material';
import { useUsers } from './../Hooks/useUsers';
import UserDetailsDrawer from './../Components/UserDetailsDrawer';
import UserToolbar from './../Components/UserToolbar';
import AISuggestions from './../Components/AISuggestions';
import BulkActionSuggestion from './../Components/BulkActionSuggestion';
import UserTableView from './../Components/UserTableView';
import UserOrganigram from './../Components/UserOrganigram';
import ImportDialog from './../Components/ImportDialog';
import LoadingSpinner from '../Components/LoadingSpinner';

// Thème personnalisé (inchangé)
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light' ? { /* ... */ } : { /* ... */ }),
  },
  transitions: { /* ... */ },
});



const AdvancedUserView = () => {
  const [ sidebarOpen, setSidebarOpen ] = useState(true);
  const [mode, setMode] = useState('light');
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [viewMode, setViewMode] = useState('table');
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(true);

  const { users, loading, selected, handleSelectAllClick, handleClick, isSelected, addUser, setSelected } = useUsers();

  // Filtrage des données (inchangé, mais pourrait être extrait en hook si besoin)
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'Tous' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'Tous' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Tri des données
  const sortedUsers = filteredUsers.sort((a, b) => {
    if (order === 'asc') {
      return a[orderBy] < b[orderBy] ? -1 : 1;
    }
    return a[orderBy] > b[orderBy] ? -1 : 1;
  });

  const currentUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openUserDetail = (user) => {
    setSelectedUser(user);
    setDetailSidebarOpen(true);
  };

  const getBulkActionSuggestion = () => {
    if (selected.length === 0) return null;
    const selectedUsers = users.filter(user => selected.includes(user.id));
    const inactiveUsers = selectedUsers.filter(user => user.status === 'Inactif');
    if (inactiveUsers.length === selected.length) {
      return "Souhaitez-vous réactiver ces utilisateurs ?";
    }
    return null;
  };

  if (loading) return <LoadingSpinner/>;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* Intégration de la barre latérale */}
        <AdminSideBar open={sidebarOpen} setOpen={setSidebarOpen} />
        <UserDetailsDrawer open={detailSidebarOpen} onClose={() => setDetailSidebarOpen(false)} user={selectedUser} />
        <Box component="main" sx={{ 
          flexGrow: 1, 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden'
        }}>
          <Paper>
            <UserToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              setImportDialogOpen={setImportDialogOpen}
              setShowForm={setShowForm}
            />
          </Paper>
          
          {/* Suggestions IA avec animation de collapse */}
          <Collapse in={aiSuggestionsOpen} timeout={300}>
            <AISuggestions 
              open={aiSuggestionsOpen} 
              onClose={() => setAiSuggestionsOpen(false)} 
            />
          </Collapse>
          
          <BulkActionSuggestion suggestion={getBulkActionSuggestion()} />
          
          {/* Conteneur principal avec gestion d'espace dynamique */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 0.3s ease-in-out',
            height: aiSuggestionsOpen ? 'calc(100% - 180px)' : 'calc(100% - 60px)'
          }}>
            {viewMode === 'table' ? (
              <UserTableView
                users={currentUsers}
                filteredUsers={filteredUsers}
                order={order}
                orderBy={orderBy}
                handleRequestSort={handleRequestSort}
                page={page}
                rowsPerPage={rowsPerPage}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                selected={selected}
                handleSelectAllClick={handleSelectAllClick}
                handleClick={handleClick}
                isSelected={isSelected}
                openUserDetail={openUserDetail}
              />
            ) : (
              <UserOrganigram users={users} />
            )}
          </Box>
          
          <UserForm open={showForm} onClose={() => setShowForm(false)} onAddUser={addUser} />
          <ImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AdvancedUserView;