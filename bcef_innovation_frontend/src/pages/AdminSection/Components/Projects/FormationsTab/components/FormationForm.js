// components/formations/FormationForm.js
import React, { useState, useEffect } from 'react';
import { useFormations } from '../../../../Hooks/trainings/useFormations';
import './FormationForm.css';

const FormationForm = ({ formation, onSuccess, onCancel }) => {
  const { createFormation, updateFormation, loading, error } = useFormations();
  
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    duree_estimee: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Initialiser le formulaire avec les données de la formation si édition
  useEffect(() => {
    if (formation) {
      setFormData({
        nom: formation.nom || '',
        description: formation.description || '',
        duree_estimee: formation.duree_estimee || ''
      });
    }
  }, [formation]);

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nom.trim()) {
      errors.nom = 'Le nom est obligatoire';
    }
    
    if (!formData.duree_estimee || formData.duree_estimee <= 0) {
      errors.duree_estimee = 'La durée doit être supérieure à 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gestion de la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (formation) {
        // Mode édition
        await updateFormation(formation.id, formData);
      } else {
        // Mode création
        await createFormation(formData);
      }
      onSuccess();
    } catch (err) {
      // Les erreurs sont déjà gérées dans le hook
      console.error('Erreur lors de la sauvegarde:', err);
    }
  };

  // Gestion des changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ quand l'utilisateur tape
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="formation-form-container">
      <div className="form-header">
        <h2>{formation ? 'Modifier la formation' : 'Créer une nouvelle formation'}</h2>
        <button onClick={onCancel} className="back-btn">
          ← Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="formation-form">
        <div className="form-group">
          <label htmlFor="nom">Nom de la formation *</label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            className={formErrors.nom ? 'error' : ''}
            placeholder="Ex: Formation React Avancé"
          />
          {formErrors.nom && <span className="field-error">{formErrors.nom}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Description détaillée de la formation..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="duree_estimee">Durée estimée (heures) *</label>
          <input
            type="number"
            id="duree_estimee"
            name="duree_estimee"
            value={formData.duree_estimee}
            onChange={handleChange}
            min="1"
            step="0.5"
            className={formErrors.duree_estimee ? 'error' : ''}
            placeholder="Ex: 3.5"
          />
          {formErrors.duree_estimee && (
            <span className="field-error">{formErrors.duree_estimee}</span>
          )}
        </div>

        {/* Affichage des erreurs globales */}
        {error && (
          <div className="form-error">
            {typeof error === 'object' ? (
              Object.entries(error).map(([key, value]) => (
                <div key={key}>{key}: {value}</div>
              ))
            ) : (
              <div>{error}</div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-btn"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : (formation ? 'Modifier' : 'Créer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormationForm;