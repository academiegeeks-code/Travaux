import React, { useState, useEffect } from 'react';
import AdminSideBar from '../AdminSideBar';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Avatar,
  LinearProgress,
  Slider,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  ListAlt as ListAltIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

// Composant principal
const AnalyticsAdmin = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7days');
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  const [logFilters, setLogFilters] = useState({
    type: 'all',
    user: 'all',
    search: '',
    dateFrom: null,
    dateTo: null
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);



  // Simuler des logs système
  useEffect(() => {
    
    setTimeout(() => {
      const sampleLogs = [
        {
          id: 1,
          timestamp: new Date('2025-12-07 09:15:23'),
          type: 'connexion',
          level: 'info',
          user: 'donatellosaved@gmail.com',
          action: 'Connexion réussie',
          details: 'localhost',
          status: 'success'
        },
        {
          id: 2,
          timestamp: new Date('2025-10-07 10:30:12'),
          type: 'connexion',
          level: 'info',
          user: 'donatelloetudes@gmail.com',
          action: 'connexion réussie',
          details: 'localhost',
          status: 'success'
        },
        {
          id: 3,
          timestamp: new Date('2025-11-07 14:20:18'),
          type: 'connexion',
          level: 'error',
          user: 'nangabenewende4gmail.com',
          action: 'Connexion échouée',
          details: 'localhost',
          status: 'error'
        },
        {
          id: 4,
          timestamp: new Date('2025-11-07 16:55:47'),
          type: 'connexion',
          level: 'info',
          user: 'utsboyz@outlook.com',
          action: 'connexion réussie',
          details: 'localhost',
          status: 'success'
        }
      ];

      setLogs(sampleLogs);
      setFilteredLogs(sampleLogs);
    }, 1000);
  }, []);
  // Gérer le changement de plage temporelle
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };







  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#757575';
    }
  };

  // Composants stylisés
  const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4]
    }
  }));

  const MetricCard = ({ title, value, change, icon, color }) => (
    <StyledCard>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography color="textSecondary" variant="overline">
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: `${color}.light`, width: 40, height: 40 }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color={change >= 0 ? 'success.main' : 'error.main'}>
          {change >= 0 ? '+' : ''}{change}% vs période précédente
        </Typography>
      </CardContent>
    </StyledCard>
  );

  const LogEntry = ({ log }) => (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getStatusIcon(log.status)}
          <Chip 
            label={log.type} 
            size="small" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {log.timestamp.toLocaleDateString('fr-FR')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {log.timestamp.toLocaleTimeString('fr-FR')}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
          {log.user}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {log.action}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {log.details}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip 
          label={log.level} 
          size="small" 
          sx={{ 
            bgcolor: getLevelColor(log.level),
            color: 'white'
          }}
        />
      </TableCell>
    </TableRow>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ display: 'flex' }}>
        {/* Sidebar existante */}
        {/* <AdminSidebar /> */}
        <AdminSideBar open={sidebarOpen} setOpen={setSidebarOpen} />
        
        {/* Contenu principal */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <AnalyticsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Journal 
                  </Typography>
                 
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Période</InputLabel>
                  <Select
                    value={timeRange}
                    onChange={handleTimeRangeChange}
                    label="Période"
                  >
                    <MenuItem value="24h">24 heures</MenuItem>
                    <MenuItem value="7days">7 jours</MenuItem>
                    <MenuItem value="30days">30 jours</MenuItem>
                    <MenuItem value="90days">90 jours</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={() => window.location.reload()}
                >
                  Actualiser
                </Button>
              </Box>
            </Toolbar>
          </AppBar>

   

          {/* Contenu du journal */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                     
                    </Box>

                    {/* Tableau des logs */}
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Date/Heure</TableCell>
                            <TableCell>Utilisateur</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Niveau</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredLogs.map((log) => (
                            <LogEntry key={log.id} log={log} />
                          ))}
                        </TableBody>
                      </Table>
                      {filteredLogs.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                          <ListAltIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            Aucun log trouvé
                          </Typography>
                        </Box>
                      )}
                    </TableContainer>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {filteredLogs.length} événements trouvés
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Nettoyage automatique après 90 jours
                      </Typography>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          )

        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default AnalyticsAdmin;