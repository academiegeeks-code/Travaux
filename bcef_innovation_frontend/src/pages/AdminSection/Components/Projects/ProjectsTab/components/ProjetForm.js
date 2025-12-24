import React, { useState } from 'react';
import useProjets from '../../../../Hooks/project/useProjets';
import { useFormations } from '../../../../Hooks/trainings/useFormations';

function ProjetForm({ onSuccess, onCancel }) {
  const { createProjet } = useProjets();
  const { formations, loading: loadingFormations, error: errorFormations } = useFormations();

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    objectifs: '',
    formation: '',
    statut: 'en_attente',
    date_debut: '',
    date_fin_prevue: '',
    fichier: null,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, fichier: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProjet(formData);
      alert('Projet créé avec succès !');
      onSuccess?.();
    } catch (err) {
      alert('Erreur lors de la création : ' + (err.message || 'Veuillez réessayer'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '32px 24px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      border: '1px solid #e0e0e0',
    }}>
      {/* En-tête avec titre + bouton retour */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        paddingBottom: '16px',
        borderBottom: '2px solid #f0f0f0',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.8rem',
          color: '#2c3e50',
          fontWeight: '600',
        }}>
          Nouveau Projet
        </h2>

        <button
          type="button"
          onClick={handleCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ecf0f1',
            color: '#7f8c8d',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#d5dbdb'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#ecf0f1'}
        >
          ← Retour
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Titre */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
            Titre du projet <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <input
            type="text"
            name="titre"
            required
            value={formData.titre}
            onChange={handleChange}
            placeholder="Ex: Refonte du site web institutionnel"
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #ddd',
              borderRadius: '10px',
              fontSize: '1rem',
              transition: 'border 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#007bff'}
            onBlur={e => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Description & Objectifs en deux colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Décrivez brièvement le projet..."
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Objectifs
            </label>
            <textarea
              name="objectifs"
              value={formData.objectifs}
              onChange={handleChange}
              rows={4}
              placeholder="Quels sont les objectifs principaux ?"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Formation */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
            Formation associée <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          {loadingFormations ? (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>Chargement des formations...</p>
          ) : errorFormations ? (
            <p style={{ color: '#e74c3c' }}>Erreur de chargement des formations</p>
          ) : (
            <select
              name="formation"
              value={formData.formation}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                backgroundColor: 'white',
              }}
            >
              <option value="">— Choisir une formation —</option>
              {formations.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          )}
        </div>

        {/* Statut + Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Statut
            </label>
            <select
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '10px',
              }}
            >
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Date de début
            </label>
            <input
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '10px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Date de fin prévue
            </label>
            <input
              type="date"
              name="date_fin_prevue"
              value={formData.date_fin_prevue}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '10px',
              }}
            />
          </div>
        </div>

        {/* Fichier */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
            Document joint (PDF, Word, image, ZIP...)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.zip,.txt,.jpg,.jpeg,.png"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed #bdc3c7',
              borderRadius: '10px',
              backgroundColor: '#f8f9fa',
            }}
          />
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: '12px 24px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '1rem',
            }}
            disabled={submitting}
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 32px',
              backgroundColor: submitting ? '#95a5a6' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              minWidth: '160px',
            }}
          >
            {submitting ? 'Création en cours...' : 'Créer le projet'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjetForm;