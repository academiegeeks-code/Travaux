// components/themes/AssignModal.jsx
import React, { useState } from 'react';
import { useAssignTheme } from '../../../../Hooks/internship/useAssignTheme';
import { useAvailableInterns } from '../../../../Hooks/internship/useAvailableInterns';

export default function AssignModal({ theme, isOpen, onClose, onSuccess }) {
  const [internId, setInternId] = useState('');
  const { interns } = useAvailableInterns();
  const { assign, loading } = useAssignTheme();

  const handleAssign = async () => {
    const result = await assign(theme.id, Number(internId));
    if (result.success) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Attribuer : {theme.title}</h2>
        <select
          value={internId}
          onChange={(e) => setInternId(e.target.value)}
          className="w-full p-3 border rounded mb-4"
        >
          <option value="">Choisir un stagiaire</option>
          {interns.map(i => (
            <option key={i.id} value={i.id}>
              {i.full_name || i.email} - {i.filiere || 'NC'}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">Annuler</button>
          <button
            onClick={handleAssign}
            disabled={!internId || loading}
            className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {loading ? '...' : 'Attribuer'}
          </button>
        </div>
      </div>
    </div>
  );
}