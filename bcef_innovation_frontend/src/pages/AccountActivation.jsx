// src/components/AccountActivation.jsx
import React, { useState } from 'react';
import { 
  Box, Paper, TextField, Button, Typography, Alert, 
  CircularProgress, Stepper, Step, StepLabel 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const steps = ['Vérification', 'Nouveau mot de passe', 'Activation réussie'];

const AccountActivation = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    activation_token: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStep1 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Vérification basique du token
    if (!formData.email || !formData.activation_token) {
      setError('Veuillez remplir tous les champs.');
      setLoading(false);
      return;
    }

    setActiveStep(1);
    setLoading(false);
  };

  const handleActivation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('activate/', formData);
      
      setActiveStep(2);
      setTimeout(() => navigate('/login'), 3000);
      
    } catch (error) {
      setError(error.response?.data?.detail || 
               Object.values(error.response?.data || {})[0]?.[0] || 
               'Erreur lors de l\'activation.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" onSubmit={handleStep1}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Token d'activation"
              value={formData.activation_token}
              onChange={(e) => setFormData({...formData, activation_token: e.target.value})}
              margin="normal"
              required
              helperText="Copiez le token reçu par email"
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
              Vérifier
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box component="form" onSubmit={handleActivation}>
            <TextField
              fullWidth
              type="password"
              label="Nouveau mot de passe"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              type="password"
              label="Confirmer le mot de passe"
              value={formData.confirm_password}
              onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              margin="normal"
              required
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Activer le compte'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Alert severity="success">
            Compte activé avec succès ! Redirection vers la page de connexion...
          </Alert>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h4" gutterBottom align="center">
          Activation du compte
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {renderStepContent(activeStep)}
      </Paper>
    </Box>
  );
};

export default AccountActivation;