// src/components/ImportDialog.jsx
import React, { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
  List, ListItem, ListItemIcon, ListItemText, Chip, LinearProgress, Alert, Snackbar
} from '@mui/material';
import { CloudUpload, WorkHistory, CheckCircle, Error } from '@mui/icons-material';

// Service d'importation (à adapter selon votre implémentation)
import { importUsersFromCSV } from '../../../services/userImportService';

const ImportDialog = ({ open, onClose }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérification du type de fichier
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
        setSnackbar({ open: true, message: 'Format de fichier non supporté', severity: 'error' });
        return;
    }

    // Vérification de la taille
    if (file.size > 10 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Fichier trop volumineux (max 10MB)', severity: 'error' });
        return;
    }

    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
        // Configuration du suivi de progression
        const progressCallback = (loaded, total) => {
        const percentage = Math.round((loaded / total) * 100);
        setProgress(percentage);
        };

      // Appel du service d'importation
      const result = await importUsersFromCSV(file, "user", progressCallback);

      setImportResult(result);
      
      if (result.success > 0) {
        setSnackbar({ 
          open: true, 
          message: `${result.success} utilisateur(s) importé(s) avec succès`, 
          severity: 'success' 
        });
      }
      
      if (result.errors.length > 0) {
        setSnackbar({
          open: true,
          message: `Import terminé avec ${result.errors.length} erreur(s)`,
          severity: 'warning'
        });
      }

    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setSnackbar({ 
        open: true, 
        message: `Erreur lors de l'importation: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseDialog = () => {
    if (!isImporting) {
      setProgress(0);
      setImportResult(null);
      onClose();
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      const inputEvent = { target: { files: [file] } };
      handleFileSelect(inputEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CloudUpload sx={{ mr: 1 }} />
            Importer des utilisateurs
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Zone de dépôt de fichier */}
          <Box 
            sx={{ 
              p: 2, 
              border: '2px dashed', 
              borderColor: isImporting ? 'primary.main' : 'divider', 
              textAlign: 'center', 
              borderRadius: 1, 
              mb: 2,
              backgroundColor: isImporting ? 'action.hover' : 'background.paper',
              transition: 'all 0.3s ease'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {isImporting ? (
              <>
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" color="primary.main">
                  Import en cours...
                </Typography>
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {progress}% complété
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6">Glissez-déposez votre fichier ici</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>ou</Typography>
                <Button 
                  variant="contained" 
                  component="label"
                  disabled={isImporting}
                >
                  Parcourir les fichiers
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".csv,.xlsx"
                  />
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Formats supportés: CSV, XLSX (max. 10MB)
                </Typography>
              </>
            )}
          </Box>

          {/* Résultats de l'importation */}
          {importResult && (
            <Box sx={{ mb: 2 }}>
              <Alert 
                severity={importResult.errors.length > 0 ? 'warning' : 'success'} 
                icon={importResult.errors.length > 0 ? <Error /> : <CheckCircle />}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Résultat de l'importation
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>{importResult.success} utilisateur(s) importé(s) avec succès</li>
                  {importResult.skipped > 0 && (
                    <li>{importResult.skipped} ligne(s) ignorée(s)</li>
                  )}
                  {importResult.errors.length > 0 && (
                    <li>{importResult.errors.length} erreur(s) détectée(s)</li>
                  )}
                </Box>
              </Alert>

              {/* Détails des erreurs */}
              {importResult.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Détails des erreurs:
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} severity="error" sx={{ mb: 1 }}>
                        Ligne {error.line}: {error.error}
                      </Alert>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Historique d'importation */}
          <Typography variant="h6" gutterBottom>Historique d'importation</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><WorkHistory /></ListItemIcon>
              <ListItemText primary="Import du 15/09/2025" secondary="07 utilisateurs importés, 2 erreurs" />
              <Chip label="Terminé" color="success" size="small" />
            </ListItem>
            <ListItem>
              <ListItemIcon><WorkHistory /></ListItemIcon>
              <ListItemText primary="Import du 10/11/2025" secondary="3 utilisateurs importés" />
              <Chip label="Terminé" color="success" size="small" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isImporting}>
            {importResult ? 'Fermer' : 'Annuler'}
          </Button>
          <Button 
            variant="contained" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
          >
            Importer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ImportDialog;