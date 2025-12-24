// UserProfile.jsx
import React, {useState,  useRef } from 'react';
import InternSideBar from '../InternSideBar';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  CameraAlt as CameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styles personnalisés
const ProfileContainer = styled(Paper)(({ theme }) => ({
  maxWidth: 1200,
  margin: '0 auto',
  overflow: 'hidden',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
}));

const BannerSection = styled(Box)(({ theme, bannerUrl }) => ({
  height: 200,
  background: bannerUrl 
    ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${bannerUrl})`
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  padding: theme.spacing(3),
}));

const AvatarContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  marginBottom: theme.spacing(-8),
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 160,
  height: 160,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
}));

const CameraFab = styled(Fab)(({ theme }) => ({
  position: 'absolute',
  bottom: 8,
  right: 8,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const InfoCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(8),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
  fontWeight: 600,
}));

export default function UserProfile() {
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Données utilisateur simulées
  const [userData, setUserData] = useState({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@email.com',
    phoneNumber: '+33 6 12 34 56 78',
    address: '123 Avenue de la République, 75011 Paris',
    university: 'Université Paris-Saclay',
    filiere: 'Informatique',
    niveauEtudes: 'Master 2',
    domainStudy: 'Intelligence Artificielle',
    encadreur: 'Dr. Marie Curie',
    debutStage: '2024-09-01',
    profession: 'Étudiant',
    avatarUrl: '',
    bannerUrl: '',
  });

  // Données en cours d'édition
  const [editData, setEditData] = useState({});

  const handleEditClick = (section, data) => {
    setCurrentSection(section);
    setEditData(data);
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    setUserData(prev => ({
      ...prev,
      ...editData
    }));
    setEditDialogOpen(false);
    setEditData({});
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData(prev => ({ ...prev, avatarUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData(prev => ({ ...prev, bannerUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const personalInfoFields = [
    { label: 'Prénom', value: userData.firstName, key: 'firstName', icon: <PersonIcon /> },
    { label: 'Nom', value: userData.lastName, key: 'lastName', icon: <PersonIcon /> },
    { label: 'Email', value: userData.email, key: 'email', icon: <EmailIcon /> },
    { label: 'Téléphone', value: userData.phoneNumber, key: 'phoneNumber', icon: <PhoneIcon /> },
    { label: 'Adresse', value: userData.address, key: 'address', icon: <LocationIcon /> },
  ];

  const academicInfoFields = [
    { label: 'Université', value: userData.university, key: 'university', icon: <SchoolIcon /> },
    { label: 'Filière', value: userData.filiere, key: 'filiere', icon: <SchoolIcon /> },
    { label: 'Niveau d\'études', value: userData.niveauEtudes, key: 'niveauEtudes', icon: <SchoolIcon /> },
    { label: 'Domaine d\'étude', value: userData.domainStudy, key: 'domainStudy', icon: <WorkIcon /> },
  ];

  const internshipInfoFields = [
    { label: 'Encadreur', value: userData.encadreur, key: 'encadreur', icon: <PersonIcon /> },
    { label: 'Début de stage', value: userData.debutStage, key: 'debutStage', icon: <CalendarIcon /> },
    { label: 'Profession', value: userData.profession, key: 'profession', icon: <WorkIcon /> },
  ];

  const renderInfoSection = (title, fields, sectionKey) => (
    <Box sx={{ mb: 4 }}>
      <SectionTitle variant="h6">
        {title}
        <IconButton 
          size="small" 
          onClick={() => handleEditClick(sectionKey, userData)}
          sx={{ ml: 1 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </SectionTitle>
      
      <Grid container spacing={2}>
        {fields.map((field, index) => (
          <Grid item xs={12} md={6} key={field.key}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.light, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}>
              <Box sx={{ 
                color: 'primary.main', 
                mr: 2,
                display: 'flex',
                alignItems: 'center'
              }}>
                {field.icon}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {field.label}
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {field.value}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (

    
    <ProfileContainer>
      {/* Bannière avec photo de profil */}
      <BannerSection bannerUrl={userData.bannerUrl}>
        <input
          type="file"
          accept="image/*"
          ref={bannerInputRef}
          onChange={handleBannerChange}
          style={{ display: 'none' }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
    <InternSideBar  open={sidebarOpen} setOpen={setSidebarOpen} />
          <AvatarContainer>
            <StyledAvatar src={userData.avatarUrl}>
              {!userData.avatarUrl && `${userData.firstName[0]}${userData.lastName[0]}`}
            </StyledAvatar>
            <input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <CameraFab size="small" onClick={() => avatarInputRef.current?.click()}>
              <CameraIcon />
            </CameraFab>
          </AvatarContainer>
          
          <Box sx={{ flexGrow: 1, ml: 20, mb: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="white">
              {userData.firstName} {userData.lastName}
            </Typography>
            <Typography variant="h6" color="white" sx={{ opacity: 0.9 }}>
              {userData.profession} • {userData.filiere}
            </Typography>
          </Box>
          
          <Fab 
            color="primary" 
            onClick={() => bannerInputRef.current?.click()}
            sx={{ mb: 2 }}
          >
            <CameraIcon />
          </Fab>
        </Box>
      </BannerSection>

      {/* Contenu du profil */}
      <InfoCard>
        <CardContent sx={{ p: 4 }}>
          {/* Informations personnelles */}
          {renderInfoSection('Informations Personnelles', personalInfoFields, 'personal')}
          
          <Divider sx={{ my: 3 }} />
          
          {/* Informations académiques */}
          {renderInfoSection('Informations Académiques', academicInfoFields, 'academic')}
          
          <Divider sx={{ my: 3 }} />
          
          {/* Informations de stage */}
          {renderInfoSection('Stage', internshipInfoFields, 'internship')}
          
          {/* Badges de statut */}
          <Box sx={{ mt: 4, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="Profil Completé" 
              color="success" 
              variant="outlined"
            />
            <Chip 
              label="Stagiaire Actif" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={`${userData.niveauEtudes}`} 
              color="secondary" 
              variant="outlined"
            />
          </Box>
        </CardContent>
      </InfoCard>

      {/* Dialogue d'édition */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Modifier les informations {currentSection}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {Object.keys(editData).map(key => (
              <TextField
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={editData[key] || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            startIcon={<CancelIcon />}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </ProfileContainer>
 
  );
}