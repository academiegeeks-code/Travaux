import React, { useState, useEffect } from 'react';
import InternSidebar from './InternSection/InternSideBar';
import Banner from './InternSection/components/Banner';
import FormationsEnCours from './InternSection/Cards/FormationDisplayer';
import Annonces from './InternSection/Cards/PubDisplayer';
import { Box, styled } from '@mui/material';
 //import { }; Importez votre API
 import api from './../api/api';
 import {useFormations} from './AdminSection/Hooks/trainings/useFormations';

// Pilier stylisé entre les colonnes
const StyledPillar = styled(Box)(({ theme }) => ({
  width: '24px',
  background: '#ebcf7a',
  margin: '0',
  boxShadow: '0 4px 12px #fff',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  }
}));

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
// Dans votre useEffect du Dashboard
useEffect(() => {
  const fetchFormations = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des formations...');
      
      const response = await api.useFormations();
      console.log('✅ Réponse complète:', response);
      console.log('📊 Données reçues:', response.data);
      console.log('🔍 Structure:', typeof response.data, Array.isArray(response.data));
      
      // Essayez différentes structures de données
      const formationsData = response.data.results || response.data || [];
      console.log('🎯 Formations extraites:', formationsData);
      
      setFormations(formationsData);
    } catch (err) {
      console.error('❌ Erreur complète:', err);
      console.error('📡 Réponse erreur:', err.response);
      setError('Impossible de charger les formations');
    } finally {
      setLoading(false);
    }
  };

  fetchFormations();
}, []);



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Bannière en haut */}
     <Banner
        onCompleteProfile={() => console.log('Compléter le profil')}
        profileCompletion={45}
        daysUntilRestriction={3}
        sidebarOpen={sidebarOpen}
      />

    {/* Contenu principal avec sidebar et colonnes */}
    <Box sx={{ display: 'flex', flexGrow: 1, mt: '160px' }}>
        <InternSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        
        {/* Zone de contenu principale */}
       <Box 
          component="main"
          sx={{
            flexGrow: 1,
            width: sidebarOpen ? 'calc(100% - 240px)' : '100%',
            transition: (theme) => theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            p: 3,
          }}
        >
          {/* Les deux colonnes */}
        <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: { xs: 2, lg: 0 },
              minHeight: '80vh',
              width: '100%',
              alignItems: 'stretch',
            }}
          >
        {/* Colonne gauche */}
          <Box sx={{ 
              flex: 1, 
              display: 'flex',
              pr: { lg: 2 }
            }}>
              <FormationsEnCours 
                formations={formations}
                loading={loading}
                error={error}
              />
            </Box>

            {/* Pilier */}
            <StyledPillar />

            {/* Colonne droite */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex',
              pl: { lg: 2 }
            }}>
              <Annonces />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 