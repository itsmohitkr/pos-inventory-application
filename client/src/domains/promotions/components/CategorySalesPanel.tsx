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

const columnTypographySx = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#334155',
};

const headCellSx = {
  fontWeight: 700,
  color: '#475569',
  bgcolor: '#f8fafc',
  py: 1.25,
  px: 1.5,
  borderBottom: '1px solid #e2e8f0',
  fontSize: '0.75rem',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
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
      flex: 1,
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      minWidth: 0,
      bgcolor: '#ffffff',
      height: '100%',
    }}
  >
    <Box
      sx={{
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        borderBottom: '1px solid #e2e8f0',
        bgcolor: '#ffffff',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0b1d39', lineHeight: 1.2 }}
              >
                Category-Based Scheduled Sales
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem', lineHeight: 1 }}
            >
              {sales.filter((s) => s.computedStatus === 'active').length} Active • {sales.length} Category Sales Configured
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          sx={{
            bgcolor: '#0b1d39',
            borderRadius: '8px',
            px: 2.5,
            height: 36,
            fontWeight: 600,
            fontSize: '0.82rem',
            textTransform: 'none',
            '&:hover': { bgcolor: '#1e293b' },
          }}
        >
          Create Category Sale
        </Button>
      </Box>
    </Box>

    {sales.length === 0 ? (
      <Box
        sx={{
          m: 2,
          py: 8,
          px: 2,
          textAlign: 'center',
          border: '2px dashed #e2e8f0',
          borderRadius: '10px',
          bgcolor: '#f8fafc',
        }}
      >
        <CategoryIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155' }}>
          No category sales configured yet
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: '0.85rem' }}>
          Create a sale to offer automated percentage discounts for an entire category.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onCreate}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
        >
          Create Category Sale
        </Button>
      </Box>
    ) : (
      <TableContainer
        sx={{
          flex: 1,
          overflow: 'auto',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          '&::-webkit-scrollbar': { height: '6px', width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
        }}
      >
        <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', width: '100%', minWidth: '750px' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0' }}>
              <TableCell sx={{ ...headCellSx, width: '5%', minWidth: '50px' }}>S.NO.</TableCell>
              <TableCell sx={{ ...headCellSx, width: '22%' }}>SALE</TableCell>
              <TableCell sx={{ ...headCellSx, width: '16%' }}>CATEGORY</TableCell>
              <TableCell align="right" sx={{ ...headCellSx, width: '12%' }}>
                DISCOUNT
              </TableCell>
              <TableCell sx={{ ...headCellSx, width: '20%' }}>DURATION</TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: '10%' }}>
                STATUS
              </TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: '8%' }}>
                LIVE
              </TableCell>
              <TableCell align="right" sx={{ ...headCellSx, width: '7%' }}>
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale, idx) => {
              const badge = getStatusBadgeConfig(sale.computedStatus);
              const isToggleable = sale.status === 'active' || sale.status === 'paused';

              return (
                <TableRow key={sale.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ py: 1.25, px: 1.5, ...columnTypographySx, width: '5%', minWidth: '50px', whiteSpace: 'nowrap' }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                      {sale.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 1.5 }}>
                    <Typography variant="body2" sx={{ ...columnTypographySx, textTransform: 'capitalize' }}>
                      {sale.category}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.25, px: 1.5, ...columnTypographySx, fontWeight: 600, color: '#0284c7' }}>
                    {sale.discountPercentage}% OFF
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 1.5 }}>
                    {sale.isIndefinite ? (
                      <Typography variant="body2" sx={{ ...columnTypographySx, color: '#16a34a', fontWeight: 600 }}>
                        Indefinite
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={columnTypographySx}>
                        {formatDateDisplay(sale.startDate)} - {formatDateDisplay(sale.endDate)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.25, px: 1.5 }}>
                    <Chip
                      label={badge.label}
                      color={badge.color}
                      variant={badge.variant}
                      size="small"
                      sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.25, px: 1.5 }}>
                    {isToggleable ? (
                      <Tooltip title={sale.status === 'active' ? 'Pause Sale' : 'Resume Sale'}>
                        <Switch
                          size="small"
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
                  <TableCell align="right" sx={{ py: 1.25, px: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(sale)}
                        aria-label="Edit Category Sale"
                        sx={{
                          color: '#475569',
                          '&:hover': { bgcolor: 'rgba(11, 29, 57, 0.08)', color: '#0b1d39' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(sale.id)}
                        aria-label="Delete Category Sale"
                        sx={{
                          color: '#dc2626',
                          '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.08)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
