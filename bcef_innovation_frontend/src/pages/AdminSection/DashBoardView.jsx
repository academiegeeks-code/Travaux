import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Zoom
} from '@mui/material';
import {
  TrendingUp,
  People,
  School,
  Chat,
  Assessment,
  CalendarToday,
  Notifications
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animation d'apparition en fondu
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Animation de glissement vers le haut
const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// Composants stylisés
const DashboardPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
  height: '100%',
  animation: `${fadeIn} 0.5s ease-in-out`,
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px 0 rgba(0,0,0,0.12)'
  }
}));

const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 4px 10px 0 rgba(0,0,0,0.05)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  animation: `${slideUp} 0.5s ease-out`,
  '&:hover': {
    transform: 'translateY(-6px) scale(1.02)',
    boxShadow: '0 12px 20px 0 rgba(0,0,0,0.15)',
    zIndex: 1
  }
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  padding: theme.spacing(1.5),
  backgroundColor: color || theme.palette.primary.light,
  color: 'white',
  width: '50px',
  height: '50px',
  transition: 'transform 0.3s ease-in-out',
  [`${StatCard}:hover &`]: {
    transform: 'scale(1.1)'
  }
}));

// Composant de carte de statistique
const StatisticCard = ({ title, value, change, icon, color, index }) => {
  return (
    <Grow in={true} timeout={index * 200}>
      <StatCard>
        <CardContent>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <IconWrapper color={color}>
                {icon}
              </IconWrapper>
            </Grid>
            <Grid item xs>
              <Typography color="textSecondary" gutterBottom variant="body2">
                {title}
              </Typography>
              <Typography variant="h5" component="div">
                {value}
              </Typography>
              <Typography variant="caption" color={change >= 0 ? "success.main" : "error.main"}>
                {change >= 0 ? `+${change}%` : `${change}%`} depuis le mois dernier
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </StatCard>
    </Grow>
  );
};

// Composant de widget
const Widget = ({ title, children, action }) => {
  return (
    <Fade in={true} timeout={800}>
      <DashboardPaper>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          {action && <Typography variant="body2" color="primary">{action}</Typography>}
        </Box>
        {children}
      </DashboardPaper>
    </Fade>
  );
};

// Composant principal DashboardView
const DashboardView = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Déterminer le nombre de colonnes en fonction de la taille de l'écran
  const getGridColumns = () => {
    if (isMobile) return 12;
    if (isTablet) return 6;
    return 3;
  };
  
  // Déterminer la taille du graphique en fonction de la taille de l'écran
  const getChartSize = () => {
    if (isMobile) return 12;
    return 8;
  };
  
  // Déterminer la taille de la sidebar en fonction de la taille de l'écran
  const getSidebarSize = () => {
    if (isMobile) return 12;
    return 4;
  };

  // Données factices pour les démonstrations
  const [stats] = useState([
    {
      title: 'Utilisateurs Actifs',
      value: '3',
      change: 12,
      icon: <People />,
      color: theme.palette.primary.main
    },
    {
      title: 'Projets en Cours',
      value: '156',
      change: 3,
      icon: <School />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Formations Complétées',
      value: '5',
      change: 18,
      icon: <Assessment />,
      color: theme.palette.success.main
    }
  ]);

  // Activités récentes factices
  const [recentActivities] = useState([
    { user: 'Marie Dupont', action: 'a complété la formation React', time: '10 min' },
    { user: 'Pierre Martin', action: 'a créé un nouveau projet', time: '30 min' },
    { user: 'Sophie Lambert', action: 'a rejoint la plateforme', time: '1 h' },
    { user: 'Thomas Bernard', action: 'a terminé un cours avancé', time: '2 h' },
    { user: 'Julie Petit', action: 'a commenté un projet', time: '5 h' }
  ]);

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: isMobile ? 2 : 3,
      transition: 'padding 0.3s ease-in-out'
    }}>
      <Zoom in={true} timeout={500}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 600, 
          mb: 4,
          color: theme.palette.text.primary
        }}>
          Tableau de Bord
        </Typography>
      </Zoom>
      
      {/* Cartes de statistiques */}
      <Grid 
        container 
        spacing={3} 
        sx={{ 
          mb: 4,
          display: 'flex',
          flexWrap: 'wrap'
        }}
      >
        {stats.map((stat, index) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={6} 
            lg={3} 
            key={index}
            sx={{
              display: 'flex',
              flexGrow: isMobile ? 1 : 0,
              flexShrink: isMobile ? 1 : 0,
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <StatisticCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              color={stat.color}
              index={index}
            />
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3}>
        {/* Graphique des activités (placeholder) */}
        <Grid item xs={12} lg={getChartSize()}>
          <Widget title="Activité des Utilisateurs" action="Voir le rapport">
            <Box sx={{ 
              height: isMobile ? 250 : 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'height 0.3s ease-in-out'
            }}>
              <Box textAlign="center">
                <TrendingUp sx={{ 
                  fontSize: isMobile ? 48 : 64, 
                  color: 'primary.main', 
                  mb: 2,
                  transition: 'font-size 0.3s ease-in-out'
                }} />
                <Typography variant="body1" color="textSecondary">
                  Graphique d'activité des utilisateurs
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  (Visualisation des données de connexion et d'engagement)
                </Typography>
              </Box>
            </Box>
          </Widget>
        </Grid>
        
        {/* Calendrier et notifications (placeholder) */}
        <Grid item xs={12} lg={getSidebarSize()}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={12}>
              <Widget title="Calendrier" action="Voir tout">
                <Box sx={{ 
                  height: isMobile ? 120 : 150, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'height 0.3s ease-in-out'
                }}>
                  <Box textAlign="center">
                    <CalendarToday sx={{ 
                      fontSize: isMobile ? 36 : 48, 
                      color: 'secondary.main', 
                      mb: 1,
                      transition: 'font-size 0.3s ease-in-out'
                    }} />
                    <Typography variant="body2" color="textSecondary">
                      Prochains événements et échéances
                    </Typography>
                  </Box>
                </Box>
              </Widget>
            </Grid>
            <Grid item xs={12} md={6} lg={12}>
              <Widget title="Notifications" action="Tout marquer comme lu">
                <Box sx={{ 
                  height: isMobile ? 120 : 150, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'height 0.3s ease-in-out'
                }}>
                  <Box textAlign="center">
                    <Notifications sx={{ 
                      fontSize: isMobile ? 36 : 48, 
                      color: 'warning.main', 
                      mb: 1,
                      transition: 'font-size 0.3s ease-in-out'
                    }} />
                    <Typography variant="body2" color="textSecondary">
                      Alertes et notifications récentes
                    </Typography>
                  </Box>
                </Box>
              </Widget>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Activités récentes */}
        <Grid item xs={12}>
          <Widget title="Activité Récente" action="Voir toute l'activité">
            <Box>
              {recentActivities.map((activity, index) => (
                <Fade in={true} timeout={800} key={index}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    py: 1.5,
                    borderBottom: index < recentActivities.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                    transition: 'background-color 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderRadius: 1
                    }
                  }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1">
                        <Box component="span" sx={{ fontWeight: 600 }}>{activity.user}</Box> {activity.action}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {activity.time}
                    </Typography>
                  </Box>
                </Fade>
              ))}
            </Box>
          </Widget>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardView;