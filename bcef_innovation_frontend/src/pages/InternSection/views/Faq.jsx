// FAQPage.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Help as HelpIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import InternSideBar from '../InternSideBar';

// Styles personnalisés
const FAQContainer = styled(Paper)(({ theme }) => ({
  maxWidth: 1000,
  margin: '0 auto',
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
  minHeight: '80vh',
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(6),
  padding: theme.spacing(4),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  borderRadius: theme.spacing(3),
}));

const CategoryChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  fontWeight: selected ? 600 : 400,
  backgroundColor: selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1),
  color: selected ? 'white' : theme.palette.primary.main,
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.2),
  },
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1) + '!important',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  '&:before': { display: 'none' },
  '&.Mui-expanded': {
    marginBottom: theme.spacing(1),
  },
}));

const HelpfulSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.grey[200], 0.5),
  borderRadius: theme.spacing(1),
}));

export default function FAQPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [helpfulFeedback, setHelpfulFeedback] = useState({});

  // Catégories de FAQ
  const categories = [
    { id: 'all', label: 'Toutes les questions', icon: <HelpIcon /> },
    { id: 'account', label: 'Compte & Profil', icon: <PersonIcon /> },
    { id: 'upload', label: 'Téléversement', icon: <UploadIcon /> },
    { id: 'assignments', label: 'Travaux & Devoirs', icon: <AssignmentIcon /> },
    { id: 'communication', label: 'Communication', icon: <ChatIcon /> },
    { id: 'technical', label: 'Problèmes Techniques', icon: <SecurityIcon /> },
    { id: 'internship', label: 'Stage & Évaluation', icon: <SchoolIcon /> },
  ];

  // Questions et réponses
  const faqData = [
    {
      id: 1,
      question: "Comment compléter mon profil utilisateur ?",
      answer: "Rendez-vous dans l'onglet 'Mon Profil' depuis le menu principal. Cliquez sur l'icône d'édition à côté de chaque section pour modifier vos informations. N'oubliez pas de sauvegarder vos modifications.",
      category: 'account',
      tags: ['profil', 'compte']
    },
    {
      id: 2,
      question: "Quels formats de fichiers sont acceptés pour les travaux ?",
      answer: "Nous acceptons les formats suivants : PDF (recommandé), DOC/DOCX, PPT/PPTX, XLS/XLSX, et les archives ZIP/RAR. La taille maximale est de 10MB par fichier.",
      category: 'upload',
      tags: ['fichiers', 'format', 'taille']
    },
    {
      id: 3,
      question: "Comment soumettre un travail à mon encadreur ?",
      answer: "Allez dans l'onglet 'Travaux' → 'Soumission'. Glissez-déposez votre fichier ou cliquez pour le sélectionner. Ajoutez un titre et une description si nécessaire, puis confirmez l'envoi.",
      category: 'assignments',
      tags: ['soumission', 'travaux']
    },
    {
      id: 4,
      question: "Comment contacter mon encadreur rapidement ?",
      answer: "Utilisez l'onglet 'Chatroom' dans la section Travaux pour envoyer un message direct. Votre encadreur sera notifié et pourra vous répondre dans les plus brefs délais.",
      category: 'communication',
      tags: ['contact', 'encadreur', 'messagerie']
    },
    {
      id: 5,
      question: "Que faire si j'oublie mon mot de passe ?",
      answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Un lien de réinitialisation vous sera envoyé par email. Vérifiez également votre dossier spam.",
      category: 'account',
      tags: ['mot de passe', 'connexion']
    },
    {
      id: 6,
      question: "Comment savoir si mon travail a été corrigé ?",
      answer: "Consultez l'onglet 'Retours' dans la section Travaux. Les travaux corrigés affichent une note et les commentaires de votre encadreur. Vous recevrez également une notification.",
      category: 'assignments',
      tags: ['correction', 'notes', 'retour']
    },
    {
      id: 7,
      question: "Mon fichier ne s'upload pas, que faire ?",
      answer: "Vérifiez : 1) La taille du fichier (<10MB), 2) Le format accepté, 3) Votre connexion internet. Si le problème persiste, contactez le support technique.",
      category: 'technical',
      tags: ['upload', 'problème', 'technique']
    },
    {
      id: 8,
      question: "Comment télécharger les documents de mon encadreur ?",
      answer: "Dans l'onglet 'Retours', chaque travail corrigé contient une section 'Ressources' où vous pouvez télécharger les documents partagés par votre encadreur.",
      category: 'assignments',
      tags: ['téléchargement', 'ressources']
    },
    {
      id: 9,
      question: "Quand serai-je noté sur mes travaux ?",
      answer: "Votre encadreur a généralement 5 jours ouvrés pour corriger un travail. Vous recevrez une notification dès que la correction est disponible.",
      category: 'internship',
      tags: ['évaluation', 'délai']
    },
    {
      id: 10,
      question: "Comment mettre à jour mes informations de stage ?",
      answer: "Rendez-vous dans 'Mon Profil' → 'Informations de Stage'. Seules les informations non verrouillées peuvent être modifiées. Contactez votre administrateur pour les autres modifications.",
      category: 'internship',
      tags: ['stage', 'informations']
    },
    {
      id: 11,
      question: "La plateforme est-elle accessible sur mobile ?",
      answer: "Oui, la plateforme est entièrement responsive et fonctionne sur tous les appareils. Pour une meilleure expérience, nous recommandons l'utilisation de Chrome ou Safari.",
      category: 'technical',
      tags: ['mobile', 'accessibilité']
    },
    {
      id: 12,
      question: "Comment signaler un problème technique ?",
      answer: "Contactez le support à support@plateforme.com en décrivant : 1) Le problème rencontré, 2) Les étapes pour le reproduire, 3) Votre navigateur et système d'exploitation.",
      category: 'technical',
      tags: ['support', 'problème']
    }
  ];

  // Filtrer les questions basées sur la recherche et la catégorie
  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleHelpfulClick = (faqId, isHelpful) => {
    setHelpfulFeedback(prev => ({
      ...prev,
      [faqId]: isHelpful
    }));
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : <HelpIcon />;
  };

  const getQuestionsCount = (categoryId) => {
    if (categoryId === 'all') return faqData.length;
    return faqData.filter(faq => faq.category === categoryId).length;
  };

  return (
    <FAQContainer>
      <InternSideBar/>
      {/* En-tête */}
      <HeaderSection>
        <HelpIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" fontWeight="bold" gutterBottom color="primary">
          Centre d'Aide
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Trouvez rapidement des réponses à vos questions sur l'utilisation de la plateforme
        </Typography>

        {/* Barre de recherche */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher une question, un mot-clé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            maxWidth: 600, 
            margin: '0 auto',
            '& .MuiOutlinedInput-root': {
              borderRadius: theme.spacing(2),
              backgroundColor: 'white',
            }
          }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
        />
      </HeaderSection>

      {/* Catégories */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SchoolIcon /> Parcourir par catégorie
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              icon={category.icon}
              label={`${category.label} (${getQuestionsCount(category.id)})`}
              selected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
              clickable
            />
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Résultats */}
      <Box>
        <Typography variant="h5" gutterBottom>
          {filteredFAQs.length} question{filteredFAQs.length > 1 ? 's' : ''} trouvée{filteredFAQs.length > 1 ? 's' : ''}
          {selectedCategory !== 'all' && ` dans "${categories.find(c => c.id === selectedCategory)?.label}"`}
          {searchTerm && ` pour "${searchTerm}"`}
        </Typography>

        {filteredFAQs.length > 0 ? (
          <Box>
            {filteredFAQs.map((faq, index) => (
              <StyledAccordion key={faq.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                    <Box sx={{ 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: 40
                    }}>
                      {getCategoryIcon(faq.category)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                        {faq.question}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {faq.tags.map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph sx={{ lineHeight: 1.6, fontSize: '1rem' }}>
                    {faq.answer}
                  </Typography>
                  
                  <HelpfulSection>
                    <Typography variant="body2" color="text.secondary">
                      Cette réponse vous a-t-elle été utile ?
                    </Typography>
                    <IconButton 
                      size="small" 
                      color={helpfulFeedback[faq.id] === true ? "primary" : "default"}
                      onClick={() => handleHelpfulClick(faq.id, true)}
                    >
                      <ThumbUpIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color={helpfulFeedback[faq.id] === false ? "error" : "default"}
                      onClick={() => handleHelpfulClick(faq.id, false)}
                    >
                      <ThumbDownIcon />
                    </IconButton>
                  </HelpfulSection>
                </AccordionDetails>
              </StyledAccordion>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <HelpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune question trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Essayez de modifier vos critères de recherche ou consultez une autre catégorie.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Section d'aide supplémentaire */}
      <Box sx={{ mt: 6, p: 3, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: theme.spacing(2) }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon /> Besoin d'aide supplémentaire ?
        </Typography>
        <Typography variant="body1" paragraph>
          Si vous n'avez pas trouvé réponse à votre question, notre équipe de support est là pour vous aider.
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <PersonIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Contactez votre encadreur" 
              secondary="Pour les questions spécifiques à votre stage" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SchoolIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Support technique" 
              secondary="support@plateforme.com - 24h/24" 
            />
          </ListItem>
        </List>
      </Box>
    </FAQContainer>
  );
}