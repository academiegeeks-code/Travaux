// components/themes/ThemeDetailModal.jsx
import React, { useState } from 'react';
import { 
  X, UserPlus, Calendar, Loader2, CheckCircle, 
  FileText, Users, Clock, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useAvailableInterns } from '../../../../Hooks/internship/useThemes';

const ThemeDetailModal = ({ theme, isOpen, onClose, onAssign, onUnassign, isAdmin }) => {
  const { interns, loading: loadingInterns } = useAvailableInterns();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedIntern) {
      alert("Veuillez sélectionner un stagiaire");
      return;
    }
    
    setIsAssigning(true);
    try {
      await onAssign(theme.id, parseInt(selectedIntern));
      setSelectedIntern('');
      alert("Thème attribué avec succès !");
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'attribution");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen || !theme) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{theme.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                theme.status === "attribue"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {theme.status_display || (theme.status === "attribue" ? "Attribué" : "Disponible")}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </h3>
            <p className="text-gray-600">{theme.description}</p>
          </div>

          {theme.objectives && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Objectifs</h3>
              <p className="text-gray-600">{theme.objectives}</p>
            </div>
          )}

          {theme.required_skills && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Compétences requises</h3>
              <p className="text-gray-600">{theme.required_skills}</p>
            </div>
          )}

          {theme.duration_weeks && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              Durée: {theme.duration_weeks} semaines
            </div>
          )}

          {theme.assigned_to_details && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Stagiaire assigné
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {theme.assigned_to_details.full_name}
                  </div>
                  <div className="text-sm text-gray-600">{theme.assigned_to_details.email}</div>
                  {theme.assignment_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      Attribué le {new Date(theme.assignment_date).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onUnassign(theme.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Désattribuer
                  </button>
                )}
              </div>
            </div>
          )}

          {isAdmin && theme.is_assignable && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Attribuer à un stagiaire
                </h3>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-3">
                  {loadingInterns ? (
                    <p className="text-sm text-gray-500">Chargement des stagiaires...</p>
                  ) : interns.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Aucun stagiaire disponible</p>
                  ) : (
                    <>
                      <select
                        value={selectedIntern}
                        onChange={(e) => setSelectedIntern(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un stagiaire</option>
                        {interns.map((intern) => (
                          <option key={intern.id} value={intern.id}>
                            {intern.full_name || intern.email} - {intern.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={!selectedIntern || isAssigning}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isAssigning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Attribution en cours...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Attribuer ce thème
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeDetailModal;