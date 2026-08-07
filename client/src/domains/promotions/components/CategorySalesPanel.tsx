import React from 'react';
import type { CategorySale, CategorySaleComputedStatus } from '@/domains/promotions/types';
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
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  PlayArrow as ResumeIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';

interface CategorySalesPanelProps {
  sales: CategorySale[];
  onCreate: () => void;
  onEdit: (sale: CategorySale) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, newStatus: 'active' | 'paused') => void;
}

const getStatusBadgeConfig = (computedStatus: CategorySaleComputedStatus) => {
  switch (computedStatus) {
    case 'active':
      return { label: 'Active', color: 'success' as const, variant: 'filled' as const };
    case 'scheduled':
      return { label: 'Scheduled', color: 'info' as const, variant: 'outlined' as const };
    case 'paused':
      return { label: 'Paused', color: 'warning' as const, variant: 'outlined' as const };
    case 'expired':
      return { label: 'Expired', color: 'default' as const, variant: 'outlined' as const };
    case 'draft':
    default:
      return { label: 'Draft', color: 'secondary' as const, variant: 'outlined' as const };
  }
};

const formatDateDisplay = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const CategorySalesPanel = ({
  sales,
  onCreate,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategorySalesPanelProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      bgcolor: '#ffffff',
      minHeight: '100%',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Category-Based Scheduled Sales
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Apply flat percentage discounts across entire product categories.
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
        sx={{
          bgcolor: '#0f172a',
          '&:hover': { bgcolor: '#1e293b' },
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 700,
        }}
      >
        Create Category Sale
      </Button>
    </Box>

    {sales.length === 0 ? (
      <Box
        sx={{
          py: 8,
          px: 2,
          textAlign: 'center',
          border: '2px dashed #e2e8f0',
          borderRadius: '12px',
          bgcolor: '#f8fafc',
        }}
      >
        <CategoryIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>
          No category sales configured yet
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Create a sale to offer automated percentage discounts for an entire category.
        </Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreate}>
          Create Category Sale
        </Button>
      </Box>
    ) : (
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Sale Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                Discount
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Schedule / Duration</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                Status
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                Live Toggle
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => {
              const badge = getStatusBadgeConfig(sale.computedStatus);
              const isToggleable = sale.status === 'active' || sale.status === 'paused';

              return (
                <TableRow key={sale.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{sale.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={sale.category}
                      size="small"
                      sx={{ bgcolor: '#e2e8f0', color: '#1e293b', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#0284c7' }}>
                    {sale.discountPercentage}% OFF
                  </TableCell>
                  <TableCell>
                    {sale.isIndefinite ? (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>
                        Indefinite
                      </Typography>
                    ) : (
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Start: {formatDateDisplay(sale.startDate)}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          End: {formatDateDisplay(sale.endDate)}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={badge.label}
                      color={badge.color}
                      variant={badge.variant}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {isToggleable ? (
                      <Tooltip title={sale.status === 'active' ? 'Pause Sale' : 'Resume Sale'}>
                        <Switch
                          checked={sale.status === 'active'}
                          onChange={(e) =>
                            onToggleStatus(sale.id, e.target.checked ? 'active' : 'paused')
                          }
                          color="success"
                        />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(sale)}
                            aria-label="Edit Category Sale"
                            sx={{
                              bgcolor: 'rgba(31, 41, 55, 0.08)',
                              color: '#1f2937',
                              '&:hover': { bgcolor: 'rgba(31, 41, 55, 0.15)' },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1f2937' }}
                        >
                          Edit
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => onDelete(sale.id)}
                            aria-label="Delete Category Sale"
                            sx={{
                              bgcolor: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ef4444' }}
                        >
                          Delete
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);

export default CategorySalesPanel;
