// components/formations/SessionLauncher.js
import React, { useState } from 'react';
import { useSessions } from '../../../../Hooks/trainings/useSessions';
import './SessionLauncher.css';

const SessionLauncher = ({ formation, onBack, onSuccess }) => {
  const { createSession, loading, error } = useSessions();

  const [sessionData, setSessionData] = useState({
    date_debut: '',
    date_fin: '',
    formateur_id: '',
  });

  // Date minimale = maintenant (arrondi à la minute pour éviter les millisecondes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setSeconds(0, 0); // optionnel : arrondir à la minute
    return now.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSessionData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation supplémentaire côté client (au cas où)
    if (new Date(sessionData.date_debut) < new Date()) {
      alert('La date de début ne peut pas être antérieure à aujourd’hui.');
      return;
    }

    try {
      await createSession({
        formation_type_id: formation.id,
        ...sessionData,
      });
      onSuccess();
    } catch (err) {
      console.error('Erreur création session:', err);
    }
  };

  return (
    <div className="session-launcher">
      <div className="session-launcher__header">
        <button type="button" onClick={onBack} className="session-launcher__back">
          ← Retour
        </button>
        <h2 className="session-launcher__title">
          Lancement d’une session — {formation.nom}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="session-launcher__form">
        <div className="form-group">
          <label htmlFor="date_debut" className="form-group__label">
            Date et heure de début <span className="required">*</span>
          </label>
          <input
            id="date_debut"
            type="datetime-local"
            name="date_debut"
            min={getMinDateTime()}
            value={sessionData.date_debut}
            onChange={handleChange}
            required
            className="form-group__input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date_fin" className="form-group__label">
            Date et heure de fin
          </label>
          <input
            id="date_fin"
            type="datetime-local"
            name="date_fin"
            min={sessionData.date_debut || getMinDateTime()}
            value={sessionData.date_fin}
            onChange={handleChange}
            className="form-group__input"
          />
          <p className="form-group__help">
            Optionnel — peut être précisé ultérieurement
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="formateur_id" className="form-group__label">
            Formateur assigné
          </label>
          <select
            id="formateur_id"
            name="formateur_id"
            value={sessionData.formateur_id}
            onChange={handleChange}
            className="form-group__select"
          >
            <option value="">Aucun formateur assigné</option>
            {/* À remplir avec la liste réelle des formateurs */}
            {/* <option value="1">Marie Dupont</option> */}
          </select>
        </div>

        {error && (
          <div className="session-launcher__error">
            Une erreur est survenue : {error.message || 'Impossible de créer la session'}
          </div>
        )}

        <div className="session-launcher__actions">
          <button
            type="button"
            onClick={onBack}
            className="session-launcher__btn session-launcher__btn--secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !sessionData.date_debut}
            className="session-launcher__btn session-launcher__btn--primary"
          >
            {loading ? 'Création en cours…' : 'Lancer la session'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SessionLauncher;