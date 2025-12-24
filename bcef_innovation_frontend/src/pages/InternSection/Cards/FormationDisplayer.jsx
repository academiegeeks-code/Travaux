import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Avatar,
  IconButton,
  useTheme
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  AccessTime as InProgressIcon,
  Group as ParticipantsIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { styled } from '@mui/material/styles';

// Remplacer le styled(Paper) existant
const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%', // Prend toute la hauteur
  minHeight: '600px',
  width: '100%', // Prend toute la largeur disponible
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
}));

const FormationEnCoursCard = ({ formation, onStart, onAssign, onEdit, onDelete }) => {
  const theme = useTheme();

  const getStatus = (formation) => {
    // Map backend statut to UI status, using get_statut_display equivalent
    const statutMap = {
      'PLAN': 'planned',
      'ENCOURS': 'in-progress',
      'TERMINEE': 'completed'
    };
    
    const statut = formation.statut ? statutMap[formation.statut] || 'planned' : 'planned';
    
    // Override with date-based logic if dates are available
    if (formation.date_debut && formation.date_fin) {
      const now = new Date();
      const start = new Date(formation.date_debut);
      const end = new Date(formation.date_fin);
      if (now > end) return 'completed';
      if (now >= start && now <= end) return 'in-progress';
    }
    return statut;
  };

  const status = getStatus(formation);
  
  const statusConfig = {
    'planned': { label: 'Planifiée', color: 'default', icon: <ScheduleIcon /> },
    'in-progress': { label: 'En Cours', color: 'warning', icon: <InProgressIcon /> },
    'completed': { label: 'Terminée', color: 'success', icon: <CompletedIcon /> }
  };

  const { label, color, icon } = statusConfig[status] || statusConfig['planned'];

  const formateurName = formation.formateur 
    ? `${formation.formateur.first_name || ''} ${formation.formateur.last_name || ''}`.trim() || formation.formateur.username 
    : null;

  return (
    <Card 
      sx={{ 
        mb: 3, 
        transition: 'all 0.3s ease',
        borderLeft: `4px solid ${theme.palette[color]?.main || theme.palette.grey[500]}`,
        borderRadius: theme.spacing(2),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
        [theme.breakpoints.down('sm')]: {
          mb: 2,
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {formation.formation_type?.nom || 'Formation sans nom'}
          </Typography>
          <Chip 
            icon={icon}
            label={label}
            color={color}
            size="medium"
            sx={{ fontSize: '1rem' }}
          />
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7, fontSize: '1.1rem' }}>
          {formation.formation_type?.description || 'Aucune description'}
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <ParticipantsIcon sx={{ mr: 0.5, fontSize: 20 }} />
            <Typography variant="body2">
              {formation.nombre_participants || 0} participants
            </Typography>
          </Box>
          <Typography variant="body2">
            Durée: {formation.formation_type?.duree_estimee || 'N/A'}h
          </Typography>
        </Box>

        {formation.date_debut && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
            📅 {format(new Date(formation.date_debut), 'dd MMMM yyyy', { locale: fr })} 
            {formation.date_fin && ` au ${format(new Date(formation.date_fin), 'dd MMMM yyyy', { locale: fr })}`}
          </Typography>
        )}

        <Box display="flex" alignItems="center" mt={1}>
          {formation.formateur ? (
            <Box display="flex" alignItems="center" flexGrow={1}>
              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                {formateurName?.charAt(0) || 'F'}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {formateurName || 'Formateur inconnu'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Formateur assigné
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic" flexGrow={1}>
              ⚠️ Aucun formateur assigné
            </Typography>
          )}
        </Box>

        <Box display="flex" gap={1.5} mt={2}>
          {!formation.formateur && (
            <Button 
              size="medium" 
              variant="outlined" 
              startIcon={<PersonIcon />}
              onClick={() => onAssign(formation)}
              sx={{ flex: 1 }}
            >
              Assigner
            </Button>
          )}
          {status === 'planned' && (
            <Button 
              size="medium" 
              variant="contained" 
              startIcon={<StartIcon />}
              onClick={() => onStart(formation)}
              sx={{ flex: 1 }}
            >
              Démarrer
            </Button>
          )}
          <IconButton size="medium" onClick={() => onEdit(formation)}>
            <EditIcon />
          </IconButton>
          <IconButton size="medium" color="error" onClick={() => onDelete(formation.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

const FormationsEnCours = ({ formations = [], onStart, onAssign, onEdit, onDelete }) => {
  return (
    <SectionPaper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SchoolIcon color="primary" sx={{ fontSize: 25 }} />
          Sessions
        </Typography>
        
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {formations.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Aucune session de formation
          </Typography>
        ) : (
          formations.map((formation) => (
            <FormationEnCoursCard 
              key={formation.id} 
              formation={formation} 
              onStart={onStart} 
              onAssign={onAssign} 
              onEdit={onEdit} 
              onDelete={onDelete} 
            />
          ))
        )}
      </Box>
    </SectionPaper>
  );
};

export default FormationsEnCours;