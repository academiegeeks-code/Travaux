import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Tooltip,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

const FormationCalendar = ({ currentDate, formations, onFormationClick, onDropFormation }) => {
  const theme = useTheme();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getFormationStatus = (formation) => {
    if (!formation.date_debut) return 'planned';
    const now = new Date();
    const start = new Date(formation.date_debut);
    const end = new Date(formation.date_fin);

    if (now > end) return 'completed';
    if (now >= start && now <= end) return 'in-progress';
    return 'scheduled';
  };

  const CalendarDay = ({ day }) => {
    const dayFormations = formations.filter(f => {
      if (!f.date_debut || !f.date_fin) return false;
      return isWithinInterval(day, {
        start: new Date(f.date_debut),
        end: new Date(f.date_fin),
      });
    });

    const statusColors = {
      'planned': theme.palette.grey[500],
      'scheduled': theme.palette.info.main,
      'in-progress': theme.palette.warning.main,
      'completed': theme.palette.success.main,
    };
    const isToday = isSameDay(day, new Date());

    const handleDrop = (event) => {
      event.preventDefault();
      try {
        const data = JSON.parse(event.dataTransfer.getData('application/json'));
        console.log('CalendarDay: Dropped data:', data, 'on day:', day);
        onDropFormation(data.formation_type_id, day);
      } catch (err) {
        console.error('CalendarDay: Error parsing drop data:', err);
      }
    };

    const handleDragOver = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    };

    return (
      <Paper
        elevation={isToday ? 3 : 0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          minHeight: 50,
          p: 1,
          backgroundColor: isSameMonth(day, currentDate)
            ? (isToday ? alpha(theme.palette.primary.main, 0.1) : 'background.paper')
            : alpha(theme.palette.action.disabled, 0.05),
          border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid',
          borderColor: theme.palette.divider,
          position: 'relative',
        }}
      >
        <Typography
          variant="body2"
          align="center"
          sx={{
            fontWeight: isToday ? 'bold' : 'normal',
            color: isToday ? 'primary.main' : 'text.primary',
            mb: 0,
          }}
        >
          {format(day, 'd')}
        </Typography>

        {isToday && (
          <Typography variant="caption" align="center" color="text.secondary" sx={{ mb: 1 }}>
            {format(day, 'eee', { locale: fr })}
          </Typography>
        )}

        {dayFormations.slice(0, 3).map(formation => {
          const status = getFormationStatus(formation);
          return (
            <Tooltip key={formation.id} title={formation.nom} arrow>
              <Box
                onClick={() => onFormationClick(formation)}
                sx={{
                  backgroundColor: alpha(statusColors[status], 0.2),
                  borderRadius: 1,
                  p: 0.5,
                  mb: 0.5,
                  cursor: 'pointer',
                }}
              >
                <Typography variant="caption" noWrap>
                  {formation.nom}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
        {dayFormations.length > 3 && (
          <Typography variant="caption" color="text.secondary" align="center">
            +{dayFormations.length - 3} autres
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="bold">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </Typography>
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={1}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <Grid item xs key={day} sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                {day}
              </Typography>
            </Grid>
          ))}
          {weeks.map((week, idx) => (
            <React.Fragment key={idx}>
              {week.map(day => (
                <Grid item xs key={day.toString()}>
                  <CalendarDay day={day} />
                </Grid>
              ))}
            </React.Fragment>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FormationCalendar;