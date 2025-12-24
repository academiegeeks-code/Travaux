// UploadTab.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  useTheme,
  alpha,
  Snackbar,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Schedule as PendingIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import documentService from '../../../../../services/documentservice'; // Chemin vers ton service

// Styles personnalisés (garder les mêmes que précédemment)
const UploadContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
  minHeight: '60vh',
}));

const DropZone = styled(Box)(({ theme, isDragActive, isDragReject }) => ({
  border: `3px dashed ${
    isDragReject ? theme.palette.error.main :
    isDragActive ? theme.palette.primary.main :
    theme.palette.divider
  }`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(6),
  textAlign: 'center',
  backgroundColor: isDragActive 
    ? alpha(theme.palette.primary.main, 0.05)
    : isDragReject
    ? alpha(theme.palette.error.main, 0.05)
    : alpha(theme.palette.background.default, 0.5),
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  marginBottom: theme.spacing(4),
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}));

const FileCard = styled(Card)(({ theme, status }) => ({
  marginBottom: theme.spacing(2),
  borderLeft: `4px solid ${
    status === 'completed' ? theme.palette.success.main :
    status === 'error' ? theme.palette.error.main :
    status === 'uploading' ? theme.palette.info.main :
    theme.palette.warning.main
  }`,
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
}));

const FileIconWrapper = styled(Box)(({ theme, filetype }) => ({
  width: 48,
  height: 48,
  borderRadius: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 
    filetype === 'pdf' ? alpha('#FF5252', 0.1) :
    filetype === 'doc' || filetype === 'docx' ? alpha('#2196F3', 0.1) :
    filetype === 'ppt' || filetype === 'pptx' ? alpha('#FF9800', 0.1) :
    filetype === 'xls' || filetype === 'xlsx' ? alpha('#4CAF50', 0.1) :
    filetype === 'zip' ? alpha('#9C27B0', 0.1) :
    filetype === 'py' ? alpha('#3776AB', 0.1) :
    filetype === 'js' ? alpha('#F7DF1E', 0.1) :
    filetype === 'java' ? alpha('#ED8B00', 0.1) :
    alpha(theme.palette.primary.main, 0.1),
  color: 
    filetype === 'pdf' ? '#FF5252' :
    filetype === 'doc' || filetype === 'docx' ? '#2196F3' :
    filetype === 'ppt' || filetype === 'pptx' ? '#FF9800' :
    filetype === 'xls' || filetype === 'xlsx' ? '#4CAF50' :
    filetype === 'zip' ? '#9C27B0' :
    filetype === 'py' ? '#3776AB' :
    filetype === 'js' ? '#F7DF1E' :
    filetype === 'java' ? '#ED8B00' :
    theme.palette.primary.main,
}));

const FileSize = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
}));

const UploadDate = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.8rem',
  marginTop: theme.spacing(0.5),
}));

export default function UploadTab() {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [currentUpload, setCurrentUpload] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  // Charger les documents existants au montage du composant
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const documents = await documentService.getMyDocuments();
      const formattedDocuments = documents.map(doc => ({
        id: doc.id,
        name: doc.titre,
        size: doc.taille_fichier,
        type: getFileType(doc.fichier),
        uploadDate: new Date(doc.date_upload),
        status: doc.statut,
        documentData: doc,
        statut: doc.statut,
        fichier: doc.fichier
      }));
      setUploadHistory(formattedDocuments);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      showSnackbar('Erreur lors du chargement des documents', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getFileType = (fileName) => {
    if (!fileName) return 'autre';
    const extension = fileName.split('.').pop().toLowerCase();
    return extension;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, error: `Fichier trop volumineux. Maximum: ${formatFileSize(MAX_FILE_SIZE)}` };
    }
    
    const allowedTypes = [
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 
      'xls', 'xlsx', 'txt', 'zip', 'py', 'js', 'java', 'c', 'cpp'
    ];
    const fileType = getFileType(file.name);
    
    if (!allowedTypes.includes(fileType)) {
      return { isValid: false, error: 'Type de fichier non supporté' };
    }
    
    return { isValid: true };
  };

  const handleFiles = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      showSnackbar(validation.error, 'error');
      return;
    }

    // Préparer les données pour l'upload
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('titre', file.name);
    formData.append('type_document', 'autre');
    formData.append('description', `Fichier uploadé: ${file.name}`);

    // Ajouter à l'historique avec statut "uploading"
    const newFile = {
      id: `temp-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: getFileType(file.name),
      uploadDate: new Date(),
      status: 'uploading',
      progress: 0,
    };

    setCurrentUpload(newFile);

    try {
      // Upload réel vers le backend
      const uploadedDocument = await documentService.uploadDocument(
        formData,
        (progress) => {
          setCurrentUpload(prev => prev ? { ...prev, progress } : null);
        }
      );

      // Recharger les documents depuis le serveur
      await loadDocuments();
      
      showSnackbar('Fichier téléversé avec succès!', 'success');
      
    } catch (error) {
      console.error('Erreur upload:', error);
      const errorMessage = error.response?.data?.fichier?.[0] || 
                          error.response?.data?.detail || 
                          'Erreur lors du téléversement du fichier';
      showSnackbar(errorMessage, 'error');
      
      // Marquer comme erreur
      setUploadHistory(prev => [{
        ...newFile,
        status: 'error',
        error: errorMessage
      }, ...prev]);
    } finally {
      setCurrentUpload(null);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
    
    const files = Array.from(e.dataTransfer.items);
    const hasInvalidFile = files.some(item => {
      const file = item.getAsFile();
      return file ? !validateFile(file).isValid : false;
    });
    
    setIsDragReject(hasInvalidFile);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragReject(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragActive(false);
    setIsDragReject(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
    e.target.value = ''; // Reset input
  }, [handleFiles]);

  const handleDeleteFile = useCallback(async (fileId, e) => {
    e?.stopPropagation();
    
    try {
      await documentService.deleteDocument(fileId);
      setUploadHistory(prev => prev.filter(file => file.id !== fileId));
      showSnackbar('Fichier supprimé avec succès', 'success');
    } catch (error) {
      console.error('Erreur suppression:', error);
      showSnackbar('Erreur lors de la suppression du fichier', 'error');
    }
  }, []);

  const handleDownloadFile = useCallback(async (fileId, fileName, fileUrl) => {
    try {
      // Pour le téléchargement, on utilise l'URL directe du fichier
      if (fileUrl) {
        await documentService.downloadDocument(fileUrl, fileName);
        showSnackbar('Téléchargement démarré', 'success');
      } else {
        showSnackbar('URL du fichier non disponible', 'error');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      showSnackbar('Erreur lors du téléchargement', 'error');
    }
  }, []);

  const handleMenuOpen = (event, document) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDocument(null);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedDocument) return;
    
    try {
      await documentService.updateDocumentStatus(selectedDocument.id, newStatus);
      showSnackbar(`Statut mis à jour: ${newStatus}`, 'success');
      await loadDocuments(); // Recharger les données
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      showSnackbar('Erreur lors de la mise à jour du statut', 'error');
    } finally {
      handleMenuClose();
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      ppt: '📊',
      pptx: '📊',
      xls: '📈',
      xlsx: '📈',
      zip: '📦',
      rar: '📦',
      txt: '📃',
      py: '🐍',
      js: '📜',
      java: '☕',
      c: '🔧',
      cpp: '⚙️'
    };
    return icons[fileType] || '📁';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approuve':
        return <CheckIcon color="success" />;
      case 'rejete':
        return <ErrorIcon color="error" />;
      case 'en_attente':
        return <PendingIcon color="warning" />;
      case 'uploading':
        return <PendingIcon color="info" />;
      case 'completed':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <FileIcon />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'approuve': 'Approuvé',
      'rejete': 'Rejeté',
      'en_attente': 'En attente',
      'uploading': 'En cours',
      'completed': 'Terminé',
      'error': 'Erreur'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'approuve': 'success',
      'rejete': 'error',
      'en_attente': 'warning',
      'uploading': 'info',
      'completed': 'success',
      'error': 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <UploadContainer>
      <Typography variant="h4" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: theme.palette.primary.main,
        mb: 4 
      }}>
        <UploadIcon />
        Téléversement de Fichiers
      </Typography>

      {/* Zone de Drag & Drop */}
      <DropZone
        isDragActive={isDragActive}
        isDragReject={isDragReject}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.py,.js,.java,.c,.cpp"
        />
        
        <UploadIcon 
          sx={{ 
            fontSize: 64, 
            color: isDragReject ? 'error.main' : 'primary.main',
            mb: 2 
          }} 
        />
        
        <Typography variant="h5" gutterBottom>
          {isDragReject ? 'Fichier non supporté' : 
           isDragActive ? 'Déposez le fichier ici' : 
           'Glissez-déposez votre fichier ici'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          ou cliquez pour sélectionner un fichier
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Formats supportés: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, PY, JS, JAVA, C, CPP
        </Typography>
        
        <Alert 
          severity="info" 
          sx={{ 
            mt: 2, 
            maxWidth: 400, 
            margin: '0 auto',
            backgroundColor: alpha(theme.palette.info.main, 0.1)
          }}
        >
          Taille maximale: {formatFileSize(MAX_FILE_SIZE)}
        </Alert>
      </DropZone>

      {/* Upload en cours */}
      {currentUpload && (
        <FileCard status={currentUpload.status}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FileIconWrapper filetype={currentUpload.type}>
                <Typography variant="h6">
                  {getFileIcon(currentUpload.type)}
                </Typography>
              </FileIconWrapper>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" noWrap>
                  {currentUpload.name}
                </Typography>
                <FileSize>
                  {formatFileSize(currentUpload.size)}
                </FileSize>
                <LinearProgress 
                  variant="determinate" 
                  value={currentUpload.progress} 
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(currentUpload.progress)}% téléversé
                </Typography>
              </Box>
              
              <Box>
                {getStatusIcon(currentUpload.status)}
              </Box>
            </Box>
          </CardContent>
        </FileCard>
      )}

      {/* Historique des téléversements */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Mes Documents ({uploadHistory.length})
      </Typography>

      {uploadHistory.length > 0 ? (
        <List>
          {uploadHistory.map((file) => (
            <FileCard key={file.id} status={file.statut}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FileIconWrapper filetype={file.type}>
                    <Typography variant="h6">
                      {getFileIcon(file.type)}
                    </Typography>
                  </FileIconWrapper>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="500">
                      {file.name}
                    </Typography>
                    <UploadDate>
                      📅 Téléversé le {file.uploadDate.toLocaleDateString('fr-FR')} à{' '}
                      {file.uploadDate.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </UploadDate>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={formatFileSize(file.size)} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        label={file.type.toUpperCase()} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                      <Chip 
                        icon={getStatusIcon(file.statut)}
                        label={getStatusLabel(file.statut)}
                        size="small"
                        color={getStatusColor(file.statut)}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleDownloadFile(file.id, file.name, file.fichier)}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Message d'erreur */}
                {file.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {file.error}
                  </Alert>
                )}
              </CardContent>
            </FileCard>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Aucun fichier téléversé
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Les fichiers que vous téléversez apparaîtront ici.
          </Typography>
        </Box>
      )}

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </UploadContainer>
  );
}