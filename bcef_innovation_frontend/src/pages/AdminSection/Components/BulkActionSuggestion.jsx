// src/components/BulkActionSuggestion.jsx
import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';

const BulkActionSuggestion = ({ suggestion }) => {
  if (!suggestion) return null;
  return (
    <Paper sx={{ mb: 2, p: 2, bgcolor: 'warning.light' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography>{suggestion}</Typography>
        <Button size="small" variant="contained">Appliquer</Button>
      </Box>
    </Paper>
  );
}; export default BulkActionSuggestion;