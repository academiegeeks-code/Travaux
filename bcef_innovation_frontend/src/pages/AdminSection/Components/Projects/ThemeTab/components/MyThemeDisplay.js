// components/themes/MyThemeDisplay.jsx
import React from 'react';
import { useMyTheme } from '../../../..//Hooks/internship/useMyTheme';

export default function MyThemeDisplay() {
  const { theme, loading } = useMyTheme();

  if (loading) return <p>Chargement...</p>;
  if (!theme) return <p className="text-center py-12 text-gray-500">Aucun thème attribué pour le moment.</p>;

  return (
    <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">Votre thème de stage</h2>
      <h3 className="text-xl font-bold">{theme.title}</h3>
      <p className="mt-4 text-gray-700">{theme.description}</p>
      <p className="mt-4 text-sm text-gray-600">
        Attribué le : {new Date(theme.assignment_date).toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}