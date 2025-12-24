// FeedBackTab.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Attachment as AttachmentIcon,
  Grade as GradeIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styles personnalisés
const FeedbackContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
}));

const DocumentCard = styled(Card)(({ theme, status }) => ({
  marginBottom: theme.spacing(2),
  borderLeft: `4px solid ${
    status === 'approved' ? theme.palette.success.main :
    status === 'revisions' ? theme.palette.warning.main :
    status === 'pending' ? theme.palette.info.main :
    theme.palette.grey[500]
  }`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const CommentBubble = styled(Box)(({ theme, type }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1.5),
  backgroundColor: type === 'critical' 
    ? alpha(theme.palette.error.main, 0.1) 
    : alpha(theme.palette.warning.main, 0.1),
  border: `1px solid ${
    type === 'critical' 
      ? alpha(theme.palette.error.main, 0.3)
      : alpha(theme.palette.warning.main, 0.3)
  }`,
  marginBottom: theme.spacing(1),
}));

const PriorityIndicator = styled(Box)(({ theme, priority }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: 
    priority === 'high' ? theme.palette.error.main :
    priority === 'medium' ? theme.palette.warning.main :
    theme.palette.success.main,
  marginRight: theme.spacing(1),
}));

export default function FeedBackTab() {
  const theme = useTheme();
  const [expandedDoc, setExpandedDoc] = useState(null);

  // Données simulées des feedbacks
  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: 'Rapport de Stage - Version Finale',
      fileName: 'rapport_final_v2.pdf',
      uploadDate: new Date('2024-01-10'),
      status: 'revisions', // approved, revisions, pending
      grade: '16/20',
      overallComment: 'Excellent travail dans l\'ensemble. Quelques améliorations nécessaires sur la méthodologie et la bibliographie.',
      supervisor: {
        name: 'Dr. Marie Curie',
        avatar: 'MC'
      },
      feedbackDate: new Date('2024-01-12'),
      comments: [
        {
          id: 1,
          type: 'critical', // critical, suggestion
          priority: 'high',
          page: 12,
          section: 'Méthodologie',
          text: 'La méthode de collecte des données doit être plus détaillée. Précisez les outils utilisés et le processus.',
          suggestion: 'Ajouter une section détaillant le questionnaire et le processus d\'entretien.'
        },
        {
          id: 2,
          type: 'suggestion',
          priority: 'medium',
          page: 8,
          section: 'Introduction',
          text: 'Le contexte pourrait être mieux contextualisé avec les travaux récents.',
          suggestion: 'Consulter les publications de Smith et al. (2023) pour enrichir le contexte.'
        },
        {
          id: 3,
          type: 'suggestion',
          priority: 'low',
          page: 15,
          section: 'Bibliographie',
          text: 'Quelques références manquantes dans la bibliographie.',
          suggestion: 'Ajouter les références complètes pour les citations pages 5 et 7.'
        }
      ],
      attachments: [
        { id: 1, name: 'exemple_bibliographie.pdf', type: 'document' },
        { id: 2, name: 'guide_methodologie.docx', type: 'document' }
      ]
    },
    {
      id: 2,
      title: 'Présentation Soutenance',
      fileName: 'soutenance_finale.pptx',
      uploadDate: new Date('2024-01-08'),
      status: 'approved',
      grade: '18/20',
      overallComment: 'Présentation très professionnelle. Structure claire et supports visuels de qualité.',
      supervisor: {
        name: 'Dr. Marie Curie',
        avatar: 'MC'
      },
      feedbackDate: new Date('2024-01-09'),
      comments: [
        {
          id: 1,
          type: 'suggestion',
          priority: 'low',
          page: 6,
          section: 'Diapositive 6',
          text: 'Le graphique pourrait être plus lisible avec des couleurs plus contrastées.',
          suggestion: 'Utiliser le template couleur fourni pour une meilleure cohérence.'
        }
      ],
      attachments: [
        { id: 1, name: 'template_couleurs.pptx', type: 'template' }
      ]
    },
    {
      id: 3,
      title: 'Analyse Données Préliminaire',
      fileName: 'analyse_preliminaire.xlsx',
      uploadDate: new Date('2024-01-05'),
      status: 'pending',
      grade: null,
      overallComment: 'En cours de correction...',
      supervisor: {
        name: 'Dr. Marie Curie',
        avatar: 'MC'
      },
      feedbackDate: null,
      comments: [],
      attachments: []
    }
  ]);

  const handleAccordionChange = (docId) => (event, isExpanded) => {
    setExpandedDoc(isExpanded ? docId : null);
  };

  const getStatusConfig = (status) => {
    const config = {
      approved: { label: 'Approuvé', color: 'success', icon: <CheckCircleIcon /> },
      revisions: { label: 'Révisions Requises', color: 'warning', icon: <WarningIcon /> },
      pending: { label: 'En Attente', color: 'info', icon: <ScheduleIcon /> }
    };
    return config[status] || config.pending;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Élevée',
      medium: 'Moyenne', 
      low: 'Basse'
    };
    return labels[priority] || 'Basse';
  };

  return (
    <FeedbackContainer>
      <Typography variant="h4" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: theme.palette.primary.main,
        mb: 4 
      }}>
        <CommentIcon />
        Corrections & Retours
      </Typography>

      {documents.map((doc) => {
        const statusConfig = getStatusConfig(doc.status);
        
        return (
          <DocumentCard key={doc.id} status={doc.status}>
            <Accordion 
              expanded={expandedDoc === doc.id}
              onChange={handleAccordionChange(doc.id)}
              sx={{ 
                boxShadow: 'none',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <EditIcon />
                    </Avatar>
                  </ListItemIcon>
                  
                  <Box sx={{ flexGrow: 1, ml: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {doc.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip 
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                      />
                      
                      <Typography variant="body2" color="text.secondary">
                        {doc.fileName}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        📅 Soumis le {doc.uploadDate.toLocaleDateString('fr-FR')}
                      </Typography>

                      {doc.grade && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <GradeIcon color="primary" fontSize="small" />
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {doc.grade}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 0 }}>
                <Divider sx={{ mb: 3 }} />

                {/* En-tête du feedback */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2, 
                  mb: 3,
                  p: 2,
                  backgroundColor: alpha(theme.palette.primary.light, 0.05),
                  borderRadius: theme.spacing(1)
                }}>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                    {doc.supervisor.avatar}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600">
                      {doc.supervisor.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {doc.overallComment}
                    </Typography>
                    {doc.feedbackDate && (
                      <Typography variant="caption" color="text.secondary">
                        Retour donné le {doc.feedbackDate.toLocaleDateString('fr-FR')}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Commentaires détaillés */}
                {doc.comments.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CommentIcon /> Commentaires Détaillés
                    </Typography>
                    
                    <List>
                      {doc.comments.map((comment) => (
                        <ListItem key={comment.id} sx={{ alignItems: 'flex-start', px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 40, mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PriorityIndicator priority={comment.priority} />
                            </Box>
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <CommentBubble type={comment.type}>
                                <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                  <Chip 
                                    label={`Page ${comment.page}`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={comment.section} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={`Priorité ${getPriorityLabel(comment.priority)}`}
                                    size="small"
                                    color={comment.priority === 'high' ? 'error' : 'default'}
                                  />
                                </Box>
                                
                                <Typography variant="body1" paragraph>
                                  {comment.text}
                                </Typography>
                                
                                {comment.suggestion && (
                                  <>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                      💡 Suggestion :
                                    </Typography>
                                    <Typography variant="body2">
                                      {comment.suggestion}
                                    </Typography>
                                  </>
                                )}
                              </CommentBubble>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Documents de l'encadreur */}
                {doc.attachments.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachmentIcon /> Ressources de l'Encadreur
                    </Typography>
                    
                    <List>
                      {doc.attachments.map((file) => (
                        <ListItem 
                          key={file.id}
                          secondaryAction={
                            <IconButton>
                              <DownloadIcon />
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            <AttachmentIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={file.type === 'template' ? 'Template fourni' : 'Document de référence'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {doc.comments.length === 0 && doc.status === 'pending' && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      En attente de correction...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Votre encadreur examinera bientôt ce document.
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </DocumentCard>
        );
      })}

      {documents.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CommentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun retour pour le moment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Les retours de votre encadreur apparaîtront ici après soumission de vos travaux.
          </Typography>
        </Box>
      )}
    </FeedbackContainer>
  );
}