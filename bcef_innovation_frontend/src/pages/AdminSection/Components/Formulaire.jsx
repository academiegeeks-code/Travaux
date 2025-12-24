// UserForm.jsx - Version améliorée pour ajout manuel
import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, IconButton, 
  FormControl, InputLabel, Select, MenuItem, Box,
  Alert, Snackbar, Typography
} from '@mui/material';
import {
  Close, PersonAdd, Email, Badge, Phone, 
  Work, School, CheckCircle, SupervisorAccount
} from '@mui/icons-material';

const UserForm = ({ open, onClose, onAddUser }) => {
  const [formData, setFormData] = useState({
  email: '',
  firstName: '',
  lastName: '',
  role: 'intern', // Utiliser les valeurs anglaises
  phone: '',
  supervisor_email: ''
});
  
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Rôles adaptés à votre contexte
  const roles = [
    { value: 'intern', label: 'intern' },
    { value: 'superviseur', label: 'Superviseur' },
    { value: 'administrateur', label: 'Administrateur' }
  ];

  // Validation adaptée
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email invalide';
    }
    
    if (!formData.prenom) newErrors.prenom = 'Prénom requis';
    if (!formData.nom) newErrors.nom = 'Nom requis';
    
    // Validation conditionnelle pour l'email du superviseur
    if (formData.role === 'intern' && formData.supervisor_email && !/\S+@\S+\.\S+/.test(formData.supervisor_email)) {
      newErrors.supervisor_email = 'Format email superviseur invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Préparer les données au format cohérent avec votre CSV
      const userData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        supervisor_email: formData.supervisor_email || '', // Garder vide si non renseigné
        role: formData.role,
        telephone: formData.telephone,
        date_creation: new Date().toISOString().split('T')[0] // Ajouter date de création
      };

      // Appeler la fonction parent pour ajouter l'utilisateur
      await onAddUser(userData);
      
      // Afficher le succès
      setShowSuccess(true);
      
      // Fermer et réinitialiser après un délai
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      setErrors({ submit: 'Erreur lors de la création de l\'utilisateur' });
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      supervisor_email: '',
      role: 'intern',
      telephone: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <PersonAdd color="primary" />
              <Typography variant="h6" component="span">
                Ajouter un Utilisateur
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ajoutez un nouvel utilisateur manuellement. Les champs marqués d'un * sont obligatoires.
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Informations personnelles */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom *"
                  value={formData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  error={!!errors.nom}
                  helperText={errors.nom}
                  InputProps={{ startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  placeholder="Ex: Nanga"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom *"
                  value={formData.prenom}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  error={!!errors.prenom}
                  helperText={errors.prenom}
                  InputProps={{ startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  placeholder="Ex: Benewende"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  placeholder="Ex: utilisateur@email.com"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.telephone}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  placeholder="Ex: +33 1 23 45 67 89"
                />
              </Grid>
              
              {/* Rôle et relations */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel>Rôle *</InputLabel>
                  <Select
                    value={formData.role}
                    label="Rôle *"
                    onChange={(e) => handleChange('role', e.target.value)}
                    startAdornment={<Work sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    {roles.map(role => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Email du superviseur - conditionnel */}
              {(formData.role === 'intern' || formData.role === 'superviseur') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email du superviseur"
                    type="email"
                    value={formData.supervisor_email}
                    onChange={(e) => handleChange('supervisor_email', e.target.value)}
                    error={!!errors.supervisor_email}
                    helperText={errors.supervisor_email || "Optionnel - pour lier à un superviseur"}
                    InputProps={{ startAdornment: <SupervisorAccount sx={{ mr: 1, color: 'text.secondary' }} /> }}
                    placeholder="Ex: superviseur@email.com"
                  />
                </Grid>
              )}
              
              {errors.submit && (
                <Grid item xs={12}>
                  <Alert severity="error">{errors.submit}</Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleClose} variant="outlined">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            startIcon={<CheckCircle />}
            size="large"
          >
            Créer l'utilisateur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification de succès */}
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" icon={<CheckCircle />}>
          Utilisateur créé avec succès !
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserForm;