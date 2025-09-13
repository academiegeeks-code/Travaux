// src/components/LoadingSpinner.jsx
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';

// Importation du logo
import LogoTracker from '../../../LogoTracker.png';

// Animation d'accélération et de ralentissement
const accelerateDecelerate = keyframes`
  0% {
    transform: rotate(0deg);
    animation-timing-function: cubic-bezier(0.4, 0, 1, 1);
  }
  50% {
    transform: rotate(180deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Animation de pulsation pour simuler le chargement
const pulse = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const LoadingSpinner = ({ isLoading = true, progress = 0 }) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isAlmostDone, setIsAlmostDone] = useState(false);

  useEffect(() => {
    // Simulation de progression (à remplacer par votre logique réelle)
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 5, 100);
          
          // Quand on atteint 90%, on active le mode "presque fini"
          if (newProgress >= 90 && !isAlmostDone) {
            setIsAlmostDone(true);
          }
          
          return newProgress;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isLoading, isAlmostDone]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        gap: 2,
        backgroundColor: 'background.default',
        transition: 'opacity 0.5s ease-out',
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? 'auto' : 'none'
      }}
    >
      {/* Logo avec animation variable */}
      <Box
        component="img"
        src={LogoTracker}
        alt="Logo Tracker"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
        sx={{
          width: 80,
          height: 80,
          animation: isAlmostDone 
            ? `${pulse} 1s ease-in-out infinite` 
            : `${accelerateDecelerate} 1.2s infinite`,
          filter: isAlmostDone ? 'brightness(1.1)' : 'none',
          transition: 'all 0.5s ease-out'
        }}
      />
      
      {/* Fallback visuel si le logo ne charge pas */}
      <Box
        sx={{
          width: 80,
          height: 80,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          color: 'white',
          fontSize: '2rem',
          fontWeight: 'bold',
          animation: isAlmostDone 
            ? `${pulse} 1s ease-in-out infinite` 
            : `${accelerateDecelerate} 1.2s infinite`,
        }}
      >
        T
      </Box>
      
      <Typography 
        variant="h6" 
        color="textSecondary"
        sx={{
          animation: isAlmostDone ? `${pulse} 1s ease-in-out infinite` : 'none'
        }}
      >
        {isAlmostDone ? 'Presque terminé...' : 'Chargement...'}
      </Typography>
      
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress 
          variant="determinate" 
          value={currentProgress} 
          size={60}
          thickness={4}
          sx={{
            transition: 'all 0.3s ease-out',
            color: isAlmostDone ? 'success.main' : 'primary.main'
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            component="div"
            color="text.secondary"
            sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
          >
            {`${Math.round(currentProgress)}%`}
          </Typography>
        </Box>
      </Box>
      
      {/* Barre de progression linéaire */}
      <Box sx={{ width: 200, mt: 1 }}>
        <Box 
          sx={{
            width: `${currentProgress}%`,
            height: 6,
            backgroundColor: isAlmostDone ? 'success.main' : 'primary.main',
            borderRadius: 3,
            transition: 'all 0.3s ease-out',
            boxShadow: isAlmostDone ? 2 : 0
          }}
        />
      </Box>
    </Box>
  );
};

export default LoadingSpinner;