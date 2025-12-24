import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const DecorativeHeader = () => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        textAlign: 'center', 
        mb: 2, // Reduced from 4 to bring it closer to content
        py: 1, // Reduced padding for tighter integration
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Typography 
          variant="h3" 
          sx={{ 
            fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
            fontSize: { xs: '1.8rem', sm: '2rem', md: '2.5rem' }, // Responsive font size
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976D2 30%, #4FC3F7 70%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            position: 'relative',
            display: 'inline-block',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              width: '30px', // Slightly shorter lines for subtlety
              height: '1px', // Thinner lines
              background: theme.palette.primary.main,
              opacity: 0.4,
            },
            '&::before': {
              left: '-40px',
            },
            '&::after': {
              right: '-40px',
            },
          }}
        >
          CALENDRIER
        </Typography>
      </motion.div>
      <Typography 
        variant="subtitle1" 
        color="text.secondary" 
        sx={{ 
          mt: 0.5, // Reduced margin for tighter integration
          fontSize: { xs: '0.85rem', md: '0.95rem' },
          fontWeight: 400,
          maxWidth: '500px',
          mx: 'auto',
        }}
      >
        Gestion et planification des formations d'entreprise
      </Typography>
    </Box>
  );
};

export default DecorativeHeader;