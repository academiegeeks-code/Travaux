// components/themes/ThemeCard.jsx
import React from 'react';
import { Edit2, Trash2, FileText, UserPlus } from 'lucide-react';

const ThemeCard = ({ theme, onEdit, onDelete, onView, isAdmin }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onView(theme)}
          >
            {theme.title}
          </h3>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              theme.status === "attribue"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {theme.status_display || (theme.status === "attribue" ? "Attribué" : "Disponible")}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{theme.description}</p>

        {theme.assigned_to_details && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded mb-3">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">
                {theme.assigned_to_details.full_name}
              </div>
              <div className="text-xs text-gray-500">{theme.assigned_to_details.email}</div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => onView(theme)}
              className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <FileText className="w-4 h-4" />
              Détails
            </button>
            <button
              onClick={() => onEdit(theme)}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(theme.id)}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeCard;