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
  TextField,
  InputAdornment,
  Badge,
  Switch,
  Avatar,
  Collapse,
  Fade,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  Archive as ArchiveIcon,
  Description as JournalIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

// Constants
const DRAWER_WIDTH = 280;
const COMPACT_DRAWER_WIDTH = 72;
const LOCAL_STORAGE_KEY = 'sidebarState';

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
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.secondary.dark, 0.6)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.3)} 0%, ${alpha(theme.palette.secondary.light, 0.2)} 100%)`,
  backdropFilter: 'blur(10px)',
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

const SearchField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2, 1.5, 1.5),
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.background.paper, 0.6),
    transition: theme.transitions.create(['background-color', 'box-shadow']),
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.background.paper, 0.9)
        : alpha(theme.palette.background.paper, 0.8),
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      boxShadow: theme.shadows[2],
    },
  },
}));

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[4],
    borderRadius: 12,
    padding: theme.spacing(1.5),
    maxWidth: 220,
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
}));

const FooterSection = styled('div')(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.7)
    : alpha(theme.palette.background.paper, 0.5),
  backdropFilter: 'blur(8px)',
}));

const MenuItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'compact',
})(({ theme, selected, compact }) => ({
  position: 'relative',
  margin: theme.spacing(0, 1, 0.5, 1),
  borderRadius: 12,
  minHeight: 48,
  animation: `${fadeIn} 0.3s ease-out`,
  transition: theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.shortest,
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: compact ? 'none' : 'translateX(4px)',
  },
  ...(selected && {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  }),
}));

const AdminSidebar = ({ open, setOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { toggleTheme, mode } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [footerExpanded, setFooterExpanded] = useState(false);
  const [notifications, setNotifications] = useState({
    activity: 3,
    chat: 12
  });

  // Menu items configuration
  const menuItems = useMemo(() => [
    {
      id: 'dashboard',
      text: 'Tableau de bord',
      icon: <HomeIcon />,
      description: 'Vue d\'ensemble des indicateurs clés avec widgets personnalisables.',
      path: '/admin-dashboard',
      badge: 0
    },
    {
      id: 'users',
      text: 'Utilisateurs',
      icon: <PeopleIcon />,
      description: 'Gestion complète des utilisateurs (filtrage, modification, import/export).',
      path: '/users-view',
      badge: 0
    },
    {
      id: 'projects',
      text: 'Travaux',
      icon: <SchoolIcon />,
      description: 'Analyse des projets, suivi des formations et reporting.',
      path: '/projects',
      badge: 0
    },
    {
      id: 'activity',
      text: 'Communications',
      icon: <ChatIcon />,
      description: 'Tableau des connexions, gestion et statistiques du chat.',
      path: '/activity',
      badge: notifications.activity
    },
    {
      id: 'archiving',
      text: 'Archivage',
      icon: <ArchiveIcon />,
      description: 'Gestion des archives et documents historiques.',
      path: '/archiving',
      badge: 0
    },
    {
      id: 'journal',
      text: 'Journal',
      icon: <JournalIcon />,
      description: 'Consultation des logs et activités système.',
      path: '/journal',
      badge: 0
    }
    
  ], [notifications.activity]);

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
      console.error('Error loading sidebar state from localStorage:', error);
      // Réinitialiser avec des valeurs par défaut en cas d'erreur
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
      console.error('Error saving sidebar state to localStorage:', error);
    }
  }, [open, footerExpanded]);

  // Adaptation automatique du thème selon l'heure
  useEffect(() => {
    const hour = new Date().getHours();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Activer le mode sombre après 19h ou selon la préférence système
    if ((hour >= 19 || hour < 6) && prefersDark && mode === 'light') {
      toggleTheme();
    }
  }, [mode, toggleTheme]);

  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const query = searchQuery.toLowerCase();
    return menuItems.filter(item => 
      item.text.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  }, [menuItems, searchQuery]);

  const handleDrawerToggle = useCallback(() => {
    setOpen(prevOpen => !prevOpen);
  }, [setOpen]);

  const handleFooterToggle = useCallback(() => {
    setFooterExpanded(prev => !prev);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const isItemSelected = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  const drawer = (
    <>
      <DrawerHeader>
        <Fade in={open} timeout={500}>
          <Typography variant="h6" noWrap component="div" sx={{ 
            fontWeight: 600,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #90caf9, #ce93d8)'
              : 'linear-gradient(45deg, #1976d2, #7b1fa2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            Administration
          </Typography>
        </Fade>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{
            transition: theme.transitions.create('transform', {
              duration: theme.transitions.duration.shortest,
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
      
      {/* Champ de recherche */}
      <Collapse in={open} timeout={600}>
        <SearchField
          size="small"
          placeholder="Rechercher un menu..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          aria-label="Rechercher dans le menu"
        />
      </Collapse>
      
      <List sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        {filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item) => (
            <StyledTooltip 
              key={item.id} 
              title={
                !open ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {item.text}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      {item.description}
                    </Typography>
                  </Box>
                ) : '' 
              } 
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
                    minWidth: open ? 56 : 40,
                    color: 'inherit',
                    transition: theme.transitions.create('color', {
                      duration: theme.transitions.duration.shortest,
                    }),
                  }}
                >
                  <Badge badgeContent={item.badge} color="error" max={9}>
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                
                {open && (
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontWeight: isItemSelected(item.path) ? 600 : 400,
                      transition: theme.transitions.create('font-weight', {
                        duration: theme.transitions.duration.shortest,
                      }),
                    }}
                  />
                )}
              </MenuItem>
            </StyledTooltip>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 2, px: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Aucun résultat trouvé
            </Typography>
          </Box>
        )}
      </List>
      
      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />
      
      {/* Pied de page avec profil */}
      <FooterSection>
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
          <ListItemIcon>
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
              A
            </Avatar>
          </ListItemIcon>
          {open && (
            <>
              <ListItemText 
                primary="Admin User" 
                secondary="Administrateur système" 
                secondaryTypographyProps={{ noWrap: true }}
                sx={{ overflow: 'hidden' }}
              />
              {footerExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </>
          )}
        </ListItem>
        
        <Collapse in={footerExpanded && open} timeout="auto">
          <Box sx={{ pl: 7, pr: 2, pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mode === 'dark' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Mode sombre
                </Typography>
              </Box>
              <Switch
                size="small"
                checked={mode === 'dark'}
                onChange={toggleTheme}
                color="primary"
                inputProps={{ 'aria-label': 'Basculer le mode sombre' }}
              />
            </Box>
            
            <ListItem 
              button 
              sx={{ 
                borderRadius: 1,
                py: 0.5,
                px: 1,
                mb: 0.5
              }}
              component={Link}
              to="/profile-settings"
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Paramètres" primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ 
                borderRadius: 1,
                py: 0.5,
                px: 1
              }}
              onClick={() => {
                // Logique de déconnexion
                console.log('Déconnexion');
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          </Box>
        </Collapse>
      </FooterSection>
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
            width: isMobile ? '80%' : (open ? DRAWER_WIDTH : COMPACT_DRAWER_WIDTH),
            boxSizing: 'border-box',
            overflowX: 'hidden',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
              : `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(12px)',
            border: 'none',
            boxShadow: theme.shadows[3],
            transition: theme.transitions.create(['width', 'background'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {!open && !isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: theme.spacing(2),
            left: theme.spacing(1.5),
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(8px)',
            boxShadow: theme.shadows[2],
            transition: theme.transitions.create(['background-color', 'transform'], {
              duration: theme.transitions.duration.shortest,
            }),
            '&:hover': {
              backgroundColor: theme.palette.background.paper,
              transform: 'scale(1.1)',
            },
          }}
          aria-label="Ouvrir la barre latérale"
        >
          <MenuIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default React.memo(AdminSidebar);