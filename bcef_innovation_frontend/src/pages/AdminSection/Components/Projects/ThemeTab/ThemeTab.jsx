// components/themes/ThemeManagementSystem.jsx
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useThemes, useThemeActions } from '../../../Hooks/internship/useThemes';
import ThemeHeader from './components/ThemeHeader';
import ThemeList from './components/ThemeList';
import ThemeFormModal from './components/ThemeFormModal';
import ThemeDetailModal from './components/ThemeDetailModal';
import AuthError from './components/AuthError';

// Fonction utilitaire simplifiée
const getCurrentUser = () => {
  const userData = localStorage.getItem("user");
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error('Erreur parsing user:', e);
    }
  }
  return null;
};

export default function ThemeManagementSystem() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Charger l'user au montage
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsAdmin(currentUser ? ['admin', 'supervisor'].includes(currentUser.role) : false);
    
    console.log('User chargé:', currentUser);
    console.log('Is admin:', currentUser ? ['admin', 'supervisor'].includes(currentUser.role) : false);
  }, []);
  
  // Hooks personnalisés
  const { themes, loading, error, refetch, setThemes } = useThemes();
  const { createTheme, updateTheme, assignTheme, unassignTheme, deleteTheme } = useThemeActions();
  
  // États locaux
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [editingTheme, setEditingTheme] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Gestion des erreurs d'authentification
  if (error && (error.includes("authentif") || error.includes("autorisé") || error.includes("401"))) {
    return <AuthError error={error} onRetry={refetch} />;
  }

  // Affichage du chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calcul des statistiques
  const stats = {
    total: themes.length,
    available: themes.filter(t => t.status === 'disponible').length,
    assigned: themes.filter(t => t.status === 'attribue').length
  };

  // Handlers (gardez les mêmes que précédemment)
  const handleCreateTheme = async (formData) => {
    try {
      const newTheme = await createTheme(formData);
      setThemes(prev => [...prev, newTheme]);
    } catch (error) {
      console.error("Erreur création:", error);
      throw error;
    }
  };

  const handleUpdateTheme = async (formData) => {
    try {
      await updateTheme(editingTheme.id, formData);
      setThemes(prev => prev.map(t => 
        t.id === editingTheme.id ? { ...t, ...formData } : t
      ));
      setEditingTheme(null);
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      throw error;
    }
  };

  const handleDeleteTheme = async (themeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce thème ?')) return;
    
    try {
      await deleteTheme(themeId);
      setThemes(prev => prev.filter(t => t.id !== themeId));
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression du thème");
    }
  };

  const handleAssignTheme = async (themeId, internId) => {
    try {
      await assignTheme(themeId, internId);
      setIsDetailModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Erreur attribution:", error);
      throw error;
    }
  };

  const handleUnassignTheme = async (themeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désattribuer ce thème ?')) return;
    
    try {
      await unassignTheme(themeId);
      setIsDetailModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Erreur désattribution:", error);
      alert("Erreur lors de la désattribution du thème");
    }
  };

  const handleEdit = (theme) => {
    setEditingTheme(theme);
    setIsFormModalOpen(true);
  };

  const handleView = (theme) => {
    setSelectedTheme(theme);
    setIsDetailModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTheme(null);
    setIsFormModalOpen(true);
  };

  // Filtrage
  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || theme.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Bannière debug - temporaire */}
        {!user && (
          <div className="bg-yellow-100 border border-yellow-400 p-3 rounded mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>Attention:</strong> Utilisateur non connecté ou données manquantes
            </p>
          </div>
        )}

        <ThemeHeader
          stats={stats}
          isAdmin={isAdmin}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onSearchChange={setSearchTerm}
          onFilterChange={setFilterStatus}
          onCreateNew={handleCreateNew}
        />

        <ThemeList
          themes={filteredThemes}
          isAdmin={isAdmin}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onEdit={handleEdit}
          onDelete={handleDeleteTheme}
          onView={handleView}
        />

        {/* Modals */}
        <ThemeFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingTheme(null);
          }}
          onSubmit={editingTheme ? handleUpdateTheme : handleCreateTheme}
          editTheme={editingTheme}
        />

        <ThemeDetailModal
          theme={selectedTheme}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTheme(null);
          }}
          onAssign={handleAssignTheme}
          onUnassign={handleUnassignTheme}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}