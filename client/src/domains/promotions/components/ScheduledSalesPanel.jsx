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
  <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', minHeight: '100%' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <CalendarIcon sx={{ color: '#0f172a' }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0b1d39', letterSpacing: '-0.5px' }}>
          Scheduled Sales & Campaigns
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
        sx={{
          bgcolor: '#0f172a',
          borderRadius: '10px',
          px: 4,
          fontWeight: 600,
          textTransform: 'none',
          '&:hover': { bgcolor: '#1e293b' },
        }}
      >
        Create New Event
      </Button>
    </Box>

    <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
      Schedule temporary price reductions and create targeted sales events for specific inventory.
    </Typography>

    <TableContainer
      elevation={0}
      sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Event Name</TableCell>
            <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Start Date</TableCell>
            <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>End Date</TableCell>
            <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Coverage</TableCell>
            <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Live Status</TableCell>
            <TableCell align="right" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {promotions.map((promo) => (
            <TableRow key={promo.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
              <TableCell sx={{ fontWeight: 500, color: '#0f172a', fontSize: '0.95rem' }}>{promo.name}</TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 600 }}>
                {new Date(promo.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </TableCell>
              <TableCell sx={{ color: '#475569', fontWeight: 600 }}>
                {new Date(promo.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </TableCell>
              <TableCell>
                <Chip
                  label={`${promo.items?.length || 0} Products`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f1f5f9' }}
                />
              </TableCell>
              <TableCell>
                {isPromotionActive(promo) ? (
                  <Chip
                    label="ACTIVE"
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #16a34a33' }}
                  />
                ) : new Date() < new Date(promo.startDate) ? (
                  <Chip
                    label="UPCOMING"
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: '#fffbeb', color: '#92400e', border: '1px solid #f59e0b33' }}
                  />
                ) : (
                  <Chip
                    label="EXPIRED"
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #ef444433' }}
                  />
                )}
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => onEdit(promo)} sx={{ color: '#3b82f6', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' }, borderRadius: '8px' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(promo.id)} sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, borderRadius: '8px' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {promotions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 800 }}>NO EVENTS SCHEDULED</Typography>
                <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Click 'Create New Event' to begin scheduling price reductions</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

export default ScheduledSalesPanel;
