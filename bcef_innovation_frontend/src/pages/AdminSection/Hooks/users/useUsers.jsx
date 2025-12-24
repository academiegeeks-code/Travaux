import { useState, useEffect } from 'react';
import api from '../../../../api/api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fonction pour forcer le rafraîchissement
  const refreshUsers = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // FONCTION D'EXPORT 
  const exportUsers = async (format, filters = {}) => {
    try {
      // Appel à l'API Django pour l'export
      const response = await api.get('/api/users/export/', {
        params: {
          format,
          ...filters
        },
        responseType: 'blob' // Important pour les fichiers binaires
      });

      // Créer le blob et déclencher le téléchargement
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Déterminer l'extension et le nom du fichier
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.${extension}`;
      
      link.href = url;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { 
        success: true, 
        message: `Export ${format.toUpperCase()} réussi !` 
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      
      // Fallback : export côté client si le backend n'est pas disponible
      if (error.response?.status === 404 || error.response?.status === 500) {
        return fallbackExport(format, users, filters);
      }
      
      return { 
        success: false, 
        message: 'Erreur lors de l\'export vers le serveur' 
      };
    }
  };

  // FALLBACK : Export côté client
  const fallbackExport = (format, users, filters = {}) => {
    try {
      // Appliquer les filtres côté client
      let filteredUsers = [...users];
      
      if (filters.role && filters.role !== 'Tous') {
        filteredUsers = filteredUsers.filter(user => 
          user.role?.toLowerCase() === filters.role.toLowerCase()
        );
      }
      
      if (filters.status && filters.status !== 'Tous') {
        filteredUsers = filteredUsers.filter(user => {
          if (filters.status === 'Actif') return user.is_active;
          if (filters.status === 'Inactif') return !user.is_active;
          return true;
        });
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        );
      }

      // Préparer les données pour l'export
      const dataToExport = filteredUsers.map(user => ({
        'ID': user.id,
        'Nom': user.last_name || '',
        'Prénom': user.first_name || '',
        'Email': user.email,
        'Rôle': user.role,
        'Statut': user.is_active ? 'Actif' : 'Inactif',
        'Date de création': user.date_joined ? new Date(user.date_joined).toLocaleDateString('fr-FR') : '',
        'Dernière connexion': user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais',
        'En ligne': user.is_online ? 'Oui' : 'Non'
      }));

      if (format === 'csv') {
        exportToCSV(dataToExport, 'utilisateurs');
      } else {
        exportToExcel(dataToExport, 'utilisateurs');
      }
      
      return { 
        success: true, 
        message: `Export ${format.toUpperCase()} réalisé côté client (${filteredUsers.length} utilisateurs)` 
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'export côté client:', error);
      return { 
        success: false, 
        message: 'Erreur lors de l\'export' 
      };
    }
  };

  // Fonctions d'export côté client
  const exportToCSV = (data, filename) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map(row => 
        headers.map(header => 
          `"${String(row[header] || '').replace(/"/g, '""')}"`
        ).join(';')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
  };

  const exportToExcel = (data, filename) => {
    // Vérifier si la librairie xlsx est disponible
    if (typeof window !== 'undefined' && window.XLSX) {
      const XLSX = window.XLSX;
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Utilisateurs');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else {
      // Fallback vers CSV si Excel pas disponible
      console.warn('Librairie XLSX non disponible, export en CSV');
      exportToCSV(data, filename);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const addSingleUser = async (userData) => {
    try {
      const response = await api.post('users/usercreate/', 
        userData,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('access')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Recharger la liste des utilisateurs
      refreshUsers();
      
      return { 
        success: true, 
        message: 'Utilisateur créé avec succès',
        data: response.data
      };
      
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      
      let errorMessage = "Erreur lors de la création de l'utilisateur";
      if (error.response) {
        if (error.response.data) {
          // Gérer les erreurs de validation Django
          if (error.response.data.email) {
            errorMessage = `Email: ${error.response.data.email[0]}`;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          }
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  // Fonction pour charger les utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('users/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
      });
      const usersData = response.data.results || response.data || [];
      
      const normalizedUsers = usersData.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role || 'visitor',
        status: user.is_active ? 'Actif' : 'Inactif',
        is_active: user.is_active,
        last_login: user.last_login,
        lastLogin: user.last_login,
        is_online: user.last_login ? (new Date() - new Date(user.last_login)) < 5 * 60 * 1000 : false,
        date_joined: user.date_joined // Ajouté pour l'export
      }));
      
      setUsers(normalizedUsers);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  // Fonction pour archiver un utilisateur
  const archiveUser = async (userId) => {
    try {
      const response = await api.patch(`users/${userId}/`, 
        {
          is_active: false,
          status: 'Archivé'
        },
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('access')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Archivage réussi:', response.data);
      refreshUsers();
      
      return { 
        success: true, 
        message: response.data.detail || 'Utilisateur archivé avec succès',
        data: response.data
      };
      
    } catch (error) {
      console.error("❌ Erreur lors de l'archivage :", error);
      
      let errorMessage = "Erreur lors de l'archivage";
      if (error.response) {
        if (error.response.status === 500) {
          errorMessage = "Erreur serveur - vérifiez les logs Django";
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  // Fonction pour archiver plusieurs utilisateurs
  const archiveMultipleUsers = async (userIds) => {
    try {
      const archivePromises = userIds.map(userId => 
        api.patch(`users/${userId}/`, 
          { is_active: false, status: 'Archivé' },
          { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
        )
      );

      await Promise.all(archivePromises);
      refreshUsers();
      
      return { 
        success: true, 
        message: `${userIds.length} utilisateur(s) archivé(s) avec succès` 
      };
    } catch (error) {
      console.error("Erreur lors de l'archivage multiple :", error);
      return { 
        success: false, 
        message: "Erreur lors de l'archivage de certains utilisateurs" 
      };
    }
  };

  // Fonction pour restaurer un utilisateur
  const restoreUser = async (userId) => {
    try {
      const response = await api.patch(`users/${userId}/`, 
        {
          is_active: true,
          status: 'Actif',
          action: 'restore'
        },
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('access')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Restauration réussie:', response.data);
      refreshUsers();
      
      return { 
        success: true, 
        message: response.data.detail || 'Utilisateur restauré avec succès',
        data: response.data
      };
      
    } catch (error) {
      console.error("❌ Erreur lors de la restauration :", error);
      
      let errorMessage = "Erreur lors de la restauration";
      if (error.response) {
        if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  // Fonction pour restaurer plusieurs utilisateurs
  const restoreMultipleUsers = async (userIds) => {
    try {
      const restorePromises = userIds.map(userId => 
        api.patch(`users/${userId}/`, 
          { 
            is_active: true, 
            status: 'Actif',
            action: 'restore'
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
        )
      );

      await Promise.all(restorePromises);
      refreshUsers();
      
      return { 
        success: true, 
        message: `${userIds.length} utilisateur(s) restauré(s) avec succès` 
      };
    } catch (error) {
      console.error("Erreur lors de la restauration multiple :", error);
      return { 
        success: false, 
        message: "Erreur lors de la restauration de certains utilisateurs" 
      };
    }
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(users.map((n) => n.id));
      return;
    }
    setSelected([]);
  };

  const handleClick = (id) => {
    setSelected((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return [...newSelected];
    });
  };

  const isSelected = (id) => selected.includes(id);

  const addUser = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  // Vérifier si des utilisateurs sélectionnés peuvent être archivés
  const canArchiveSelected = () => {
    if (selected.length === 0) return false;
    const selectedUsers = users.filter(user => selected.includes(user.id));
    return selectedUsers.some(user => user.is_active);
  };

  // Obtenir les suggestions d'actions groupées
  const getBulkActionSuggestions = () => {
    if (selected.length === 0) return null;
    
    const selectedUsers = users.filter(user => selected.includes(user.id));
    const activeUsers = selectedUsers.filter(user => user.is_active);
    const inactiveUsers = selectedUsers.filter(user => !user.is_active);
    
    if (activeUsers.length === selected.length) {
      return {
        type: 'archive',
        message: `Souhaitez-vous archiver ces ${selected.length} utilisateur(s) ?`,
        action: () => archiveMultipleUsers(selected)
      };
    } else if (inactiveUsers.length === selected.length) {
      return {
        type: 'restore', 
        message: `Souhaitez-vous restaurer ces ${selected.length} utilisateur(s) ?`,
        action: () => restoreMultipleUsers(selected)
      };
    }
    
    return null;
  };

  return {
    users,
    loading,
    selected,
    handleSelectAllClick,
    handleClick,
    isSelected,
    addUser,
    addSingleUser,
    setSelected,
    refreshUsers,
    archiveUser,
    archiveMultipleUsers,
    restoreUser,
    restoreMultipleUsers,
    canArchiveSelected,
    getBulkActionSuggestions,
    exportUsers 
  };
};

export default useUsers;