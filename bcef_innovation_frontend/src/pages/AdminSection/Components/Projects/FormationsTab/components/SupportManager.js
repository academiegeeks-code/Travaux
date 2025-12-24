// components/SupportManager.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Divider,
  Tooltip,
  Collapse,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  UploadFile,
  Download,
  Delete,
  Description,
  Slideshow,
  Movie,
  Image,
  TableChart,
  Attachment,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useSupports } from '../../../../Hooks/trainings/useSupports';

const SupportManager = ({ formation, onBack }) => {
  const {
    supports,
    loading,
    error,
    createSupport,
    deleteSupport,
    downloadSupport,
  } = useSupports(formation.id);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    fichier: null,
    titre: '',
    description: '',
    type_support: 'PDF',
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        fichier: file,
        titre: file.name.split('.').slice(0, -1).join('.') || file.name,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.fichier) return;

    setUploading(true);
    try {
      await createSupport({
        ...formData,
        formation_type: formation.id,
      });

      setFormData({ fichier: null, titre: '', description: '', type_support: 'PDF' });
      setShowUploadForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer définitivement ce support ?')) {
      await deleteSupport(id);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF': return <Description color="error" />;
      case 'PPT': return <Slideshow color="primary" />;
      case 'DOC': return <Description color="info" />;
      case 'EXCEL': return <TableChart color="success" />;
      case 'VIDEO': return <Movie color="secondary" />;
      case 'IMAGE': return <Image color="warning" />;
      default: return <Attachment color="action" />;
    }
  };

  const getFileSize = (bytes) => {
    if (!bytes) return '—';
    const sizes = ['octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={onBack} size="large" color="primary">
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Supports de formation — {formation.nom}
        </Typography>
      </Box>

      {/* Upload Section */}
      <Paper elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            p: 3,
            bgcolor: 'primary.main',
            color: 'white',
            cursor: 'pointer',
          }}
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <UploadFile fontSize="large" />
              <Typography variant="h6" fontWeight={600}>
                {showUploadForm ? 'Masquer le formulaire' : 'Ajouter un nouveau support'}
              </Typography>
            </Box>
            {showUploadForm ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </Box>

        <Collapse in={showUploadForm}>
          <Box sx={{ p: 4 }}>
            <form onSubmit={handleUpload}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<UploadFile />}
                    sx={{ py: 3, borderStyle: 'dashed' }}
                  >
                    Sélectionner un fichier
                    <input type="file" hidden onChange={handleFileChange} accept="*" />
                  </Button>
                  {formData.fichier && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      Fichier sélectionné : {formData.fichier.name} ({getFileSize(formData.fichier.size)})
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Titre du support"
                    name="titre"
                    value={formData.titre}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type de support</InputLabel>
                    <Select
                      name="type_support"
                      value={formData.type_support}
                      label="Type de support"
                      onChange={handleChange}
                    >
                      <MenuItem value="PDF">PDF</MenuItem>
                      <MenuItem value="PPT">PowerPoint</MenuItem>
                      <MenuItem value="DOC">Word</MenuItem>
                      <MenuItem value="EXCEL">Excel</MenuItem>
                      <MenuItem value="VIDEO">Vidéo</MenuItem>
                      <MenuItem value="IMAGE">Image</MenuItem>
                      <MenuItem value="AUTRE">Autre</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description (facultatif)"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => setShowUploadForm(false)}
                      disabled={uploading}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={uploading || !formData.fichier}
                      startIcon={uploading && <CircularProgress size={20} />}
                    >
                      {uploading ? 'Upload en cours...' : 'Uploader le support'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Box>
        </Collapse>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur de chargement des supports
        </Alert>
      )}

      {/* Supports List */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Supports existants ({supports.length})
      </Typography>

      {supports.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Attachment sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography color="text.secondary">
            Aucun support disponible pour cette formation
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {supports.map((support) => (
            <Grid item xs={12} sm={6} md={4} key={support.id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getFileIcon(support.type_support)}
                    <Chip
                      label={support.type_support}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {support.titre}
                  </Typography>

                  {support.description ? (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {support.description}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled" fontStyle="italic">
                      Aucune description
                    </Typography>
                  )}

                  <Stack direction="row" spacing={2} mt={2} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={getFileSize(support.taille_fichier)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={new Date(support.date_ajout).toLocaleDateString('fr-FR')}
                      size="small"
                      color="default"
                    />
                  </Stack>
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Tooltip title="Télécharger">
                    <IconButton
                      color="primary"
                      onClick={() => downloadSupport(support)}
                    >
                      <Download />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Supprimer">
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(support.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SupportManager;