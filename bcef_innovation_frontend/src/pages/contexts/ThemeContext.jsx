import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { arEG } from '@mui/material/locale';
import { deepmerge } from '@mui/utils';

// Création du contexte
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Fournisseur de thème avec fonctionnalités avancées
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [direction, setDirection] = useState('ltr');

  // Récupération des préférences depuis le localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    const savedAutoMode = localStorage.getItem('themeAutoMode');
    const savedDirection = localStorage.getItem('themeDirection');
    
    if (savedMode) setMode(savedMode);
    if (savedAutoMode !== null) setIsAutoMode(JSON.parse(savedAutoMode));
    if (savedDirection) setDirection(savedDirection);
  }, []);

  // Sauvegarde des préférences dans le localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    localStorage.setItem('themeAutoMode', JSON.stringify(isAutoMode));
    localStorage.setItem('themeDirection', direction);
  }, [mode, isAutoMode, direction]);

  // Adaptation automatique du thème selon l'heure et les préférences système
  useEffect(() => {
    if (!isAutoMode) return;

    const updateThemeBasedOnTime = () => {
      const hour = new Date().getHours();
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Activer le mode sombre après 19h ou avant 6h, ou selon la préférence système
      const shouldBeDark = (hour >= 19 || hour < 6) || prefersDark;
      setMode(shouldBeDark ? 'dark' : 'light');
    };

    // Mise à jour initiale
    updateThemeBasedOnTime();

    // Vérifier toutes les heures
    const intervalId = setInterval(updateThemeBasedOnTime, 3600000);
    
    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (isAutoMode) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      clearInterval(intervalId);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [isAutoMode]);

  // Création du thème MUI avec personnalisation avancée
  const theme = useMemo(() => {
    const baseTheme = createTheme({
      direction,
      palette: {
        mode,
        primary: {
          main: mode === 'dark' ? '#90caf9' : '#1976d2',
          light: mode === 'dark' ? '#e3f2fd' : '#42a5f5',
          dark: mode === 'dark' ? '#42a5f5' : '#1565c0',
        },
        secondary: {
          main: mode === 'dark' ? '#ce93d8' : '#9c27b0',
          light: mode === 'dark' ? '#f3e5f5' : '#ba68c8',
          dark: mode === 'dark' ? '#ab47bc' : '#7b1fa2',
        },
        background: {
          default: mode === 'dark' ? '#121212' : '#f5f5f5',
          paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          subtle: mode === 'dark' ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        },
        gradient: {
          primary: mode === 'dark' 
            ? 'linear-gradient(135deg, #1976d2 0%, #7b1fa2 100%)' 
            : 'linear-gradient(135deg, #42a5f5 0%, #ba68c8 100%)',
          secondary: mode === 'dark' 
            ? 'linear-gradient(135deg, #0d47a1 0%, #4a148c 100%)' 
            : 'linear-gradient(135deg, #bbdefb 0%, #e1bee7 100%)',
        },
        // Ajout de couleurs personnalisées
        custom: {
          success: '#4caf50',
          warning: '#ff9800',
          error: '#f44336',
          info: '#2196f3',
        }
      },
      shape: {
        borderRadius: 12,
      },
      typography: {
        fontFamily: [
          '"Inter"',
          '"Roboto"',
          '"Helvetica"',
          'Arial',
          'sans-serif',
        ].join(','),
        h6: {
          fontWeight: 600,
        },
        subtitle1: {
          fontWeight: 500,
        },
        button: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
      shadows: mode === 'dark' 
        ? [
            'none',
            '0px 2px 4px rgba(0, 0, 0, 0.3)',
            '0px 4px 8px rgba(0, 0, 0, 0.3)',
            ...Array(22).fill('0px 8px 16px rgba(0, 0, 0, 0.3)')
          ] 
        : [
            'none',
            '0px 2px 4px rgba(0, 0, 0, 0.1)',
            '0px 4px 8px rgba(0, 0, 0, 0.1)',
            ...Array(22).fill('0px 8px 16px rgba(0, 0, 0, 0.1)')
          ],
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              scrollbarColor: mode === 'dark' ? '#6b6b6b #2b2b2b' : '#6b6b6b #f5f5f5',
              '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                width: 8,
                height: 8,
              },
              '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                borderRadius: 8,
                backgroundColor: mode === 'dark' ? '#6b6b6b' : '#c1c1c1',
              },
              '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                backgroundColor: mode === 'dark' ? '#909090' : '#a8a8a8',
              },
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backdropFilter: 'blur(12px)',
              background: mode === 'dark' 
                ? 'linear-gradient(180deg, rgba(18, 18, 18, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)' 
                : 'linear-gradient(180deg, rgba(245, 245, 245, 0.9) 0%, rgba(255, 255, 255, 0.9) 100%)',
              borderRight: mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.12)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backdropFilter: 'blur(8px)',
              background: mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.7)' 
                : 'rgba(255, 255, 255, 0.7)',
              boxShadow: mode === 'dark' 
                ? '0px 4px 8px rgba(0, 0, 0, 0.3)' 
                : '0px 4px 8px rgba(0, 0, 0, 0.1)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              padding: '8px 16px',
            },
            contained: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: mode === 'dark' 
                  ? '0px 4px 8px rgba(0, 0, 0, 0.4)' 
                  : '0px 4px 8px rgba(0, 0, 0, 0.2)',
              },
            },
          },
        },
      },
    }, arEG); // Support de la localisation française

    // Personnalisations supplémentaires
    return createTheme(deepmerge(baseTheme, {
      cssVariables: true,
      customShadows: {
        widget: mode === 'dark' 
          ? '0px 4px 16px rgba(0, 0, 0, 0.4)' 
          : '0px 4px 16px rgba(0, 0, 0, 0.1)',
        navbar: mode === 'dark' 
          ? '0px 2px 8px rgba(0, 0, 0, 0.4)' 
          : '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }));
  }, [mode, direction]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
    setIsAutoMode(false); // Désactiver le mode auto lors d'un changement manuel
  };

  // Fonction pour basculer le mode automatique
  const toggleAutoMode = () => {
    setIsAutoMode(prev => !prev);
  };

  // Fonction pour changer la direction (RTL/LTR)
  const toggleDirection = () => {
    setDirection(prevDir => (prevDir === 'ltr' ? 'rtl' : 'ltr'));
  };

  // Valeur du contexte
  const contextValue = {
    mode,
    direction,
    isAutoMode,
    toggleTheme,
    toggleAutoMode,
    toggleDirection,
    theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;