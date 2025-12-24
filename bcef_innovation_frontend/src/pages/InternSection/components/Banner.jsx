import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { rgba } from 'framer-motion';

// Constants from InternSidebar for consistent sizing
const DRAWER_WIDTH = 260;
const COMPACT_DRAWER_WIDTH = 68;

// Styled Components
const BannerContainer = styled(Box)(({ theme, sidebarOpen }) => ({
  width: sidebarOpen
    ? `calc(100vw - ${DRAWER_WIDTH}px)`
    : `calc(100vw - ${COMPACT_DRAWER_WIDTH}px)`,
  marginLeft: sidebarOpen ? `${DRAWER_WIDTH}px` : `${COMPACT_DRAWER_WIDTH}px`,
  position: 'fixed',
  top: 0,
  zIndex: theme.zIndex.appBar,
  [theme.breakpoints.down('md')]: {
    width: '100vw',
    marginLeft: 0,
  },
}));

const BannerContent = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ebcf7a 100%)',
  color: 'white',
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  borderBottomLeftRadius: 0, //theme.spacing(2),
  borderBottomRightRadius: 0,//theme.spacing(2),
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  boxShadow: theme.shadows[3],
}));

const ActionButton = styled(Button)(({ theme }) => ({
  background: 'white',
  color: '#23a9f2',
  fontWeight: 'bold',
  padding: theme.spacing(1, 3),
  borderRadius: theme.spacing(0.5),
  textTransform: 'none',
  fontSize: '0.9rem',
  '&:hover': {
    background: '#f5f5f5',
    transform: 'translateY(-1px)',
  },
  transition: 'all 0.2s ease',
}));

const Banner = ({ 
  onCompleteProfile, 
  profileCompletion = 45,
  daysUntilRestriction = 3,
  sidebarOpen
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isVisible, setIsVisible] = useState(true);

  const isProfileIncomplete = profileCompletion < 100;

  const handleClose = () => {
    if (isProfileIncomplete) {
      return;
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <BannerContainer sidebarOpen={sidebarOpen} sx={{ height: isMobile ? 'auto' : '160px' }}>
      <BannerContent elevation={3}>
        {/* Conditional Close Button */}
        {isProfileIncomplete && (
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
            aria-label="Fermer la bannière"
          >
            <CloseIcon />
          </IconButton>
        )}

        <Box 
          display="grid" 
          gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }} 
          gap={3} 
          alignItems="center"
          height="100%"
        >
          {/* Text and Description Section */}
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#ffffff33',
                  flexShrink: 0,
                }}
              >
                <WarningIcon sx={{ color: 'yellow'}} />
              </Box>
              
              <Box>
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '1.1rem', md: '1.3rem' } }}
                >
                  Profil à compléter
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ opacity: 0.9, mt: 0.5 }}
                >
                   Vos données personnelles enrichissent votre experience. Veuillez poursuivre la complétion de votre profil pour continuer a avoir accès à toutes les fonctionnalités.
                </Typography>
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mt: 2, maxWidth: '400px' }}>
              <LinearProgress 
                variant="determinate" 
                value={profileCompletion}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'rgba(217, 57, 21, 0.85)',
                  }
                }}
              />
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                {100 - profileCompletion}% restant
              </Typography>
            </Box>
          </Box>

          {/* Action and Deadline Section */}
          <Box display="flex" flexDirection="column" alignItems={{ xs: 'flex-start', md: 'flex-end' }} gap={2}>
            <ActionButton
              onClick={onCompleteProfile}
              startIcon={<EditIcon />}
              size={isMobile ? "medium" : "large"}
            >
              Compléter mon profil
            </ActionButton>

          </Box>
        </Box>

        {/* Bottom Message */}
 <Box 
  sx={{ 
    mt: 2, 
    pt: 1, 
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}
>
  {/* Message à gauche */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <CheckCircleIcon sx={{ fontSize: 16, opacity: 0.7 }} />
    <Typography variant="caption" sx={{ opacity: 0.7, fontStyle: 'italic', color: 'orange' }}>
      Cette bannière est visible jusqu'à la complétion totale de votre profil
    </Typography>
  </Box>

  {/* Jour J à droite, sans encadrement */}
  <Typography 
    variant="caption" 
    fontWeight="medium" 
    sx={{ opacity: 0.8, color: 'white' }}
  >
    ⏳ J-{daysUntilRestriction} avant restrictions
  </Typography>
</Box>
      </BannerContent>
    </BannerContainer>
  );
};

export default Banner;