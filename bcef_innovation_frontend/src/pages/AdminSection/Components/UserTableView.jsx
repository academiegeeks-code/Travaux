// src/components/UserTableView.jsx
import React from 'react';
import { Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody, Checkbox, Box, Avatar, Chip, Tooltip, IconButton, TablePagination } from '@mui/material';
import { Visibility, Edit } from '@mui/icons-material';

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
}) => (
  <Paper>
    <TableContainer>
      <Table>
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
              <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleRequestSort('name')}>
                Nom
              </TableSortLabel>
            </TableCell>
            <TableCell>Email</TableCell>
            <TableCell>
              <TableSortLabel active={orderBy === 'role'} direction={orderBy === 'role' ? order : 'asc'} onClick={() => handleRequestSort('role')}>
                Rôle
              </TableSortLabel>
            </TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>
              <TableSortLabel active={orderBy === 'lastLogin'} direction={orderBy === 'lastLogin' ? order : 'asc'} onClick={() => handleRequestSort('lastLogin')}>
                Dernière connexion
              </TableSortLabel>
            </TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => {
            const itemSelected = isSelected(user.id);
            return (
              <TableRow hover key={user.id} selected={itemSelected} onClick={() => handleClick(user.id)} sx={{ cursor: 'pointer' }}>
                <TableCell padding="checkbox"><Checkbox checked={itemSelected} /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src={user.avatar} sx={{ width: 32, height: 32, mr: 1 }} />
                    {user.name}
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><Chip label={user.role} size="small" color={user.role.toLowerCase()} /></TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={user.status === 'Actif' ? 'success' : user.status === 'Inactif' ? 'error' : 'warning'}
                  />
                </TableCell>
                <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Jamais'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title="Voir détails">
                      <IconButton size="small" onClick={() => openUserDetail(user)} aria-label="Voir les détails">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton size="small"><Edit /></IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      rowsPerPageOptions={[5, 10, 25]}
      component="div"
      count={filteredUsers.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="Lignes par page:"
    />
  </Paper>
); export default UserTableView;