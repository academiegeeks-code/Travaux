import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  Box,
  Tooltip,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
  Collapse,
  Fade,
  alpha
} from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Chat as ChatIcon,
  School as TrainingIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import Faq from './views/Faq.jsx';

// Constants
const DRAWER_WIDTH = 260;
const COMPACT_DRAWER_WIDTH = 68;
const LOCAL_STORAGE_KEY = 'traineeSidebarState';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideIn = keyframes`
  from { height: 0; opacity: 0; }
  to { height: 24px; opacity: 1; }
`;

// Styled Components
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.primary.dark, 0.8)
    : alpha(theme.palette.primary.light, 0.2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const ActiveIndicator = styled('div')(({ theme }) => ({
  width: 4,
  height: 24,
  backgroundColor: theme.palette.secondary.main,
  borderRadius: '0 2px 2px 0',
  position: 'absolute',
  left: 0,
  animation: `${slideIn} 0.3s ease-out`,
}));

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[3],
    borderRadius: 8,
    padding: theme.spacing(1),
    fontSize: '0.875rem',
  },
}));

const MenuItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'compact',
})(({ theme, selected, compact }) => ({
  position: 'relative',
  margin: theme.spacing(0.5, 1),
  borderRadius: 10,
  minHeight: 44,
  animation: `${fadeIn} 0.3s ease-out`,
  transition: theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: compact ? 'none' : 'translateX(2px)',
  },
  ...(selected && {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.15),
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  }),
}));

const TraineeSidebar = ({ open, setOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [footerExpanded, setFooterExpanded] = useState(false);


  // Items du menu adaptés au stagiaire
  const menuItems = useMemo(() => [
    {
      id: 'dashboard',
      text: 'Home',
      icon: <HomeIcon />,
      path: '/intern-board',
      badge: 0,
      description: 'Vue d\'ensemble de votre stage et activités'
    },
    {
      id: 'profile',
      text: 'Mon Profil',
      icon: <PersonIcon />,
      path: '/user-profile',
      badge: 0,
      description: 'Gérer vos informations personnelles'
    },
    {
      id: 'trainings',
      text: 'Travaux',
      icon: <TrainingIcon />,
      path: '/works',
      description: 'Planning et détails des formations'
    },
    {
      id: 'faq',
      text: 'FAQ ',
      icon: <HelpIcon />,
      path: '/Faq',
      badge: 0,
      description: 'Questions fréquentes et support'
    },
  ], []);

  // Récupération de l'état depuis le localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { isOpen, isFooterExpanded } = JSON.parse(savedState);
        setOpen(isOpen);
        setFooterExpanded(isFooterExpanded);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état de la sidebar:', error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [setOpen]);

  // Sauvegarde de l'état dans le localStorage
  useEffect(() => {
    const sidebarState = {
      isOpen: open,
      isFooterExpanded: footerExpanded
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sidebarState));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état de la sidebar:', error);
    }
  }, [open, footerExpanded]);

  const handleDrawerToggle = useCallback(() => {
    setOpen(prevOpen => !prevOpen);
  }, [setOpen]);

  const handleFooterToggle = useCallback(() => {
    setFooterExpanded(prev => !prev);
  }, []);

  const isItemSelected = useCallback((path) => {
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const drawer = (
    <>
      <DrawerHeader>
        <Fade in={open} timeout={400}>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 600,
              fontSize: '1.1rem',
              color: theme.palette.primary.main,
            }}
          >
            Espace Stagiaire
          </Typography>
        </Fade>
        <IconButton 
          onClick={handleDrawerToggle}
          size="small"
          sx={{
            transition: theme.transitions.create('transform', {
              duration: theme.transitions.duration.shorter,
            }),
            '&:hover': {
              transform: 'rotate(90deg)',
            }
          }}
          aria-label={open ? "Réduire le menu" : "Étendre le menu"}
        >
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      
      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />
      
      <List sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        {menuItems.map((item) => (
          <StyledTooltip 
            key={item.id} 
            title={!open ? item.description : ''} 
            placement="right"
            arrow
          >
            <MenuItem
              button
              component={Link}
              to={item.path}
              selected={isItemSelected(item.path)}
              compact={!open}
            >
              {isItemSelected(item.path) && <ActiveIndicator />}
              
              <ListItemIcon
                sx={{
                  minWidth: open ? 52 : 36,
                  color: 'inherit',
                  transition: theme.transitions.create('color'),
                }}
              >
                <Badge 
                  badgeContent={item.badge} 
                  color="error" 
                  max={9}
                  invisible={item.badge === 0}
                >
                  {item.icon}
                </Badge>
              </ListItemIcon>
              
              {open && (
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: isItemSelected(item.path) ? 600 : 400,
                    fontSize: '0.9rem',
                  }}
                />
              )}
            </MenuItem>
          </StyledTooltip>
        ))}
      </List>
      
      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />
      
      {/* Section profil stagiaire */}
      <Box sx={{ p: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <ListItem 
          button 
          onClick={handleFooterToggle}
          sx={{ 
            borderRadius: 2,
            mb: footerExpanded ? 1 : 0,
          }}
          aria-expanded={footerExpanded}
          aria-label="Options du profil"
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.success.main }}>
              S
            </Avatar>
          </ListItemIcon>
          {open && (
            <>
              <ListItemText 
                primary="Stagiaire" 
                secondary="En cours de stage" 
                secondaryTypographyProps={{ 
                  noWrap: true,
                  fontSize: '0.75rem'
                }}
                sx={{ overflow: 'hidden' }}
              />
              {footerExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </>
          )}
        </ListItem>
        
        <Collapse in={footerExpanded && open} timeout="auto">
          <Box sx={{ pl: 6, pr: 1, pb: 1 }}>
            {/* Accès rapide au chat avec l'encadreur */}
            <ListItem 
              button 
              sx={{ 
                borderRadius: 1,
                py: 0.5,
                px: 1,
                mb: 0.5
              }}
              component={Link}
              to="/trainee-chat"
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ChatIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Contacter mon encadreur" 
                primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }} 
              />
            </ListItem>
            
            {/* Déconnexion */}
            <ListItem 
              button 
              sx={{ 
                borderRadius: 1,
                py: 0.5,
                px: 1
              }}
              onClick={() => {
                // Logique de déconnexion
                console.log('Déconnexion du stagiaire');
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Déconnexion" 
                primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }} 
              />
            </ListItem>
          </Box>
        </Collapse>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isMobile ? open : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? '100%' : (open ? DRAWER_WIDTH : COMPACT_DRAWER_WIDTH),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? '75%' : (open ? DRAWER_WIDTH : COMPACT_DRAWER_WIDTH),
            boxSizing: 'border-box',
            overflowX: 'hidden',
            background: theme.palette.background.paper,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Bouton pour ouvrir la sidebar lorsqu'elle est réduite */}
      {!open && !isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: theme.spacing(1.5),
            left: theme.spacing(1),
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[1],
            transition: theme.transitions.create(['background-color', 'transform']),
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              transform: 'scale(1.05)',
            },
          }}
          aria-label="Ouvrir la navigation"
        >
          <MenuIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default React.memo(TraineeSidebar);