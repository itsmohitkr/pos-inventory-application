import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

const ScheduledSalesPanel = ({ promotions, onCreate, onEdit, onDelete, isPromotionActive }) => (
  <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0b1d39' }}>
          Scheduled Sales & Price Reductions
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
        sx={{
          bgcolor: '#0b1d39',
          borderRadius: 2,
          px: 3,
          '&:hover': { bgcolor: '#1b3e6f' },
        }}
      >
        Create New Sale
      </Button>
    </Box>

    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Schedule temporary price reductions and create sales events.
    </Typography>

    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Promo Name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {promotions.map((promo) => (
            <TableRow key={promo.id}>
              <TableCell sx={{ fontWeight: 600 }}>{promo.name}</TableCell>
              <TableCell>{new Date(promo.startDate).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(promo.endDate).toLocaleDateString()}</TableCell>
              <TableCell>{promo.items?.length || 0} Products</TableCell>
              <TableCell>
                {isPromotionActive(promo) ? (
                  <Chip label="ACTIVE" color="success" size="small" sx={{ fontWeight: 700 }} />
                ) : new Date() < new Date(promo.startDate) ? (
                  <Chip label="UPCOMING" color="primary" size="small" sx={{ fontWeight: 700 }} />
                ) : (
                  <Chip label="EXPIRED" color="default" size="small" sx={{ fontWeight: 700 }} />
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(promo)} color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(promo.id)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {promotions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No sale events scheduled. Click 'Create New Sale' to begin.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

export default ScheduledSalesPanel;
