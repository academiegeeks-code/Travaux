import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, IconButton, Typography, 
  Autocomplete, Chip, Alert, Snackbar, Fade, Zoom,
  FormControl, InputLabel, Select, MenuItem, Box
} from '@mui/material';
import {
  Close, PersonAdd, Email, Lock, Badge, Phone, 
  LocationOn, Work, School, Star, CheckCircle
} from '@mui/icons-material';
import './Formulaire.css';

const UserForm = ({ open, onClose, onAddUser }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
    address: '',
    department: '',
    skills: []
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState({
    email: [],
    password: []
  });

  // Données pour l'autocomplétion
  const roleOptions = ['Administrateur', 'Encadreur', 'Stagiaire', 'Manager', 'Consultant'];
  const departmentOptions = ['Développement', 'Design', 'Marketing', 'Ressources Humaines', 'Finance'];
  const skillOptions = ['React', 'Node.js', 'UI/UX', 'GraphQL', 'TypeScript', 'Python', 'DevOps'];

  // Suggestions de mots de passe
  const passwordSuggestions = [
    'SecureP@ss123!',
    'Strong#Password2023',
    'N3wUs3r@App2023',
    'M@g1cWord$987',
    'T3mp0r@ryP@ss'
  ];

  // Validation en temps réel
  useEffect(() => {
    const newErrors = {};
    
    if (touched.firstName && !formData.firstName) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (touched.lastName && !formData.lastName) {
      newErrors.lastName = 'Le nom est requis';
    }
    
    if (touched.email) {
      if (!formData.email) {
        newErrors.email = 'L\'email est requis';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
    }
    
    if (touched.password) {
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
        newErrors.password = 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial';
      }
    }
    
    if (touched.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    if (touched.role && !formData.role) {
      newErrors.role = 'Le rôle est requis';
    }
    
    setErrors(newErrors);
  }, [formData, touched]);

  // Générer des suggestions d'email
  useEffect(() => {
    if (formData.firstName && formData.lastName) {
      const baseEmail = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`;
      const domains = ['company.com', 'entreprise.fr', 'organisation.org'];
      
      const emailSuggestions = domains.map(domain => `${baseEmail}@${domain}`);
      setSuggestions(prev => ({ ...prev, email: emailSuggestions }));
    }
  }, [formData.firstName, formData.lastName]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés pour afficher toutes les erreurs
    const allTouched = {};
    Object.keys(formData).forEach(key => { allTouched[key] = true; });
    setTouched(allTouched);
    
    // Vérifier s'il y a des erreurs
    const hasErrors = Object.values(errors).some(error => error);
    if (hasErrors) return;
    
    // Si validation réussie
    setShowSuccess(true);
    setTimeout(() => {
      onAddUser(formData);
      onClose();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        phone: '',
        address: '',
        department: '',
        skills: []
      });
      setTouched({});
      setShowSuccess(false);
    }, 1500);
  };

  const handleClose = () => {
    onClose();
    // Réinitialiser le formulaire
    setTimeout(() => {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        phone: '',
        address: '',
        department: '',
        skills: []
      });
      setTouched({});
      setErrors({});
    }, 300);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "glass-dialog"
        }}
      >
        <DialogTitle className="dialog-title">
          <div className="title-content">
            <PersonAdd className="title-icon" />
            <span>Ajouter un Nouvel Utilisateur</span>
          </div>
          <IconButton onClick={handleClose} className="close-button">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent className="dialog-content">
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  className="neon-field"
                  InputProps={{
                    startAdornment: <Badge className="field-icon" />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  className="neon-field"
                  InputProps={{
                    startAdornment: <Badge className="field-icon" />
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={suggestions.email}
                  value={formData.email}
                  onChange={(_, value) => handleChange('email', value || '')}
                  onInputChange={(_, value) => handleChange('email', value)}
                  onBlur={() => handleBlur('email')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Email"
                      error={!!errors.email}
                      helperText={errors.email}
                      className="neon-field"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <Email className="field-icon" />
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={passwordSuggestions}
                  value={formData.password}
                  onChange={(_, value) => handleChange('password', value || '')}
                  onInputChange={(_, value) => handleChange('password', value)}
                  onBlur={() => handleBlur('password')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      type="password"
                      label="Mot de passe"
                      error={!!errors.password}
                      helperText={errors.password}
                      className="neon-field"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <Lock className="field-icon" />
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirmer le mot de passe"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  className="neon-field"
                  InputProps={{
                    startAdornment: <Lock className="field-icon" />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.role} className="neon-select">
                  <InputLabel>Rôle</InputLabel>
                  <Select
                    value={formData.role}
                    label="Rôle"
                    onChange={(e) => handleChange('role', e.target.value)}
                    onBlur={() => handleBlur('role')}
                    startAdornment={<Work className="field-icon" />}
                  >
                    {roleOptions.map(role => (
                      <MenuItem key={role} value={role}>{role}</MenuItem>
                    ))}
                  </Select>
                  {errors.role && <div className="error-text">{errors.role}</div>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth className="neon-select">
                  <InputLabel>Département</InputLabel>
                  <Select
                    value={formData.department}
                    label="Département"
                    onChange={(e) => handleChange('department', e.target.value)}
                    startAdornment={<LocationOn className="field-icon" />}
                  >
                    {departmentOptions.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={skillOptions}
                  value={formData.skills}
                  onChange={(_, value) => handleChange('skills', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Compétences"
                      className="neon-field"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <School className="field-icon" />
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        className="neon-chip"
                      />
                    ))
                  }
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="neon-field"
                  InputProps={{
                    startAdornment: <Phone className="field-icon" />
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Adresse"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="neon-field"
                  InputProps={{
                    startAdornment: <LocationOn className="field-icon" />
                  }}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        
        <DialogActions className="dialog-actions">
          <Button onClick={handleClose} className="cancel-button">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="submit-button"
            disabled={Object.values(errors).some(error => error)}
          >
            <CheckCircle className="button-icon" />
            Créer l'utilisateur
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={showSuccess} 
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" className="success-alert">
          <Zoom in={showSuccess}>
            <div className="success-content">
              <CheckCircle className="success-icon" />
              Utilisateur créé avec succès !
            </div>
          </Zoom>
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserForm;