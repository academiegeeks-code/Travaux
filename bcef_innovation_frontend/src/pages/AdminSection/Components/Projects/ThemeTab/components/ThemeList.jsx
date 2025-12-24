// components/themes/ThemeList.jsx
import React from 'react';
import { FileText } from 'lucide-react';
import ThemeCard from './ThemeCard';

const ThemeList = ({ 
  themes, 
  isAdmin, 
  searchTerm, 
  filterStatus, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  if (themes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun thème trouvé</h3>
        <p className="text-gray-600">
          {searchTerm || filterStatus !== 'all' 
            ? 'Essayez de modifier vos filtres de recherche'
            : isAdmin 
              ? 'Commencez par créer votre premier thème de stage'
              : 'Aucun thème disponible pour le moment'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

export default ThemeList;