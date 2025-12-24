// src/views/AdvancedUserView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import UserForm from "./../Components/Formulaire";
import AdminSideBar from "./../AdminSideBar";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline, Collapse } from '@mui/material';
import { useUsers } from './../Hooks/users/useUsers';
import UserDetailsDrawer from './../Components/UserDetailsDrawer';
import UserToolbar from './../Components/UserToolbar'; // ← La version sticky corrigée
import AISuggestions from './../Components/AISuggestions';
import BulkActionSuggestion from './../Components/BulkActionSuggestion';
import UserTableView from './../Components/UserTableView';
import UserOrganigram from './../Components/UserOrganigram';
import ImportDialog from './../Components/ImportDialog';
import LoadingSpinner from '../Components/LoadingSpinner';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? { background: { default: '#f5f5f5', paper: '#ffffff' } }
      : { background: { default: '#121212', paper: '#1e1e1e' } }),
  },
});

const AdvancedUserView = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode] = useState('light');
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
  const [bulkSuggestion, setBulkSuggestion] = useState(null);

  const {
    users,
    loading,
    selected,
    handleSelectAllClick,
    handleClick,
    isSelected,
    archiveUser,
    restoreUser,
    addSingleUser,
    getBulkActionSuggestions,
    exportUsers,
  } = useUsers();

  useEffect(() => {
    const suggestion = getBulkActionSuggestions();
    setBulkSuggestion(suggestion);
  }, [selected, getBulkActionSuggestions]);

  // Filtrage + tri + pagination (inchangé)
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'Tous' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'Tous' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return order === 'asc'
      ? a[orderBy] < b[orderBy] ? -1 : 1
      : a[orderBy] > b[orderBy] ? -1 : 1;
  });

  const currentUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openUserDetail = (user) => {
    setSelectedUser(user);
    setDetailSidebarOpen(true);
  };

  const handleBulkActionConfirm = async () => {
    if (bulkSuggestion?.action) {
      await bulkSuggestion.action();
      setBulkSuggestion(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* STRUCTURE CORRIGÉE */}
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AdminSideBar open={sidebarOpen} setOpen={setSidebarOpen} />
        <UserDetailsDrawer
          open={detailSidebarOpen}
          onClose={() => setDetailSidebarOpen(false)}
          user={selectedUser}
        />

        {/* CONTENU PRINCIPAL */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

          {/* TOOLBAR FIXE EN HAUT (sortie du flux) */}
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
            onExport={exportUsers}
          />

          {/* CONTENU SCROLLABLE */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              pb: 6,
              overflow: 'auto',
              bgcolor: 'background.default',
            }}
          >
            {/* Suggestions IA */}
            <Collapse in={aiSuggestionsOpen}>
              <Box sx={{ mb: 3 }}>
                <AISuggestions
                  open={aiSuggestionsOpen}
                  onClose={() => setAiSuggestionsOpen(false)}
                />
              </Box>
            </Collapse>

            <BulkActionSuggestion
              suggestion={bulkSuggestion?.message}
              type={bulkSuggestion?.type}
              onConfirm={handleBulkActionConfirm}
              onClose={() => setBulkSuggestion(null)}
            />

            {/* Vue principale */}
            {viewMode === 'table' ? (
              <UserTableView
                users={currentUsers}
                filteredUsers={filteredUsers}
                order={order}
                orderBy={orderBy}
                handleRequestSort={(prop) => {
                  const isAsc = orderBy === prop && order === 'asc';
                  setOrder(isAsc ? 'desc' : 'asc');
                  setOrderBy(prop);
                }}
                page={page}
                rowsPerPage={rowsPerPage}
                handleChangePage={(_, newPage) => setPage(newPage)}
                handleChangeRowsPerPage={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                selected={selected}
                handleSelectAllClick={handleSelectAllClick}
                handleClick={handleClick}
                isSelected={isSelected}
                openUserDetail={openUserDetail}
                onUserArchive={archiveUser}
                onUserRestore={restoreUser}
              />
            ) : (
              <UserOrganigram users={users} />
            )}
          </Box>
        </Box>
      </Box>

      {/* Dialogs */}
      <UserForm open={showForm} onClose={() => setShowForm(false)} onAddUser={addSingleUser} />
      <ImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} onUsersImported={() => {}} />
    </ThemeProvider>
  );
};

export default AdvancedUserView;