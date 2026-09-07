import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import InventoryPanelShell from '@/domains/inventory/components/InventoryPanelShell';
import type { ReportSale } from '@/shared/types/models';
import { getRefundStatus, getStatusDisplay } from '@/shared/utils/refundStatus';

interface SaleDetailPanelProps {
  selectedSale: ReportSale | null;
  onClose: () => void;
}

export const SaleDetailPanel = ({ selectedSale, onClose }: SaleDetailPanelProps) => {
  if (!selectedSale) return null;

  const refundStatus = getRefundStatus(selectedSale.items);
  const statusDisplay = getStatusDisplay(refundStatus);
  const cost = (selectedSale.netTotalAmount || 0) - (selectedSale.profit || 0);
  const margin =
    selectedSale.netTotalAmount > 0
      ? (selectedSale.profit / selectedSale.netTotalAmount) * 100
      : 0;

  return (
    <InventoryPanelShell
      title={`Order ORD-${selectedSale.id}`}
      headerRight={
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: '#64748b',
            p: 0.5,
            borderRadius: '6px',
            '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: '#ffffff',
        }}
      >
        {/* Transaction Metadata & Status Card */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: '8px',
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Transaction Info
            </Typography>
            <Chip
              label={statusDisplay.label}
              size="small"
              sx={{
                bgcolor: statusDisplay.bgcolor,
                color: statusDisplay.color,
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 20,
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {selectedSale.createdAt
                  ? new Date(selectedSale.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {selectedSale.createdAt
                  ? new Date(selectedSale.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </Typography>
            </Box>

            <Chip
              label={selectedSale.paymentMethod || 'CASH'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: '#0b1d39',
                color: '#ffffff',
                borderRadius: '4px',
              }}
            />
          </Box>
        </Box>

        {/* Financial Stat Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
          }}
        >
          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Net Revenue
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: '#0b1d39', mt: 0.25, fontSize: '0.95rem' }}>
              ₹{selectedSale.netTotalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
              Selling Price
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              bgcolor: 'rgba(245, 158, 11, 0.04)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Cost Price
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: '#b45309', mt: 0.25, fontSize: '0.95rem' }}>
              ₹{cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" sx={{ color: '#d97706', fontSize: '0.65rem' }}>
              Total Cost
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              bgcolor: 'rgba(22, 163, 74, 0.04)',
              border: '1px solid rgba(22, 163, 74, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803d', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Profit ({margin.toFixed(1)}%)
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: '#15803d', mt: 0.25, fontSize: '0.95rem' }}>
              ₹{selectedSale.profit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" sx={{ color: '#16a34a', fontSize: '0.65rem' }}>
              Gross Profit
            </Typography>
          </Box>
        </Box>

        {/* Itemized Breakdown Table */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Itemized Breakdown
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
              {selectedSale.items?.length || 0} items
            </Typography>
          </Box>

          <TableContainer
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', py: 1, px: 1.25 }}>
                    PRODUCT
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', py: 1, px: 1 }}>
                    QTY
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', py: 1, px: 1 }}>
                    MRP
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', py: 1, px: 1 }}>
                    COST
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', py: 1, px: 1 }}>
                    PRICE
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', py: 1, px: 1 }}>
                    PROFIT
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', py: 1, px: 1 }}>
                    MARGIN
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedSale.items?.map((item) => {
                  const returnedQty = item.returnedQuantity || 0;
                  const itemMargin = parseFloat(item.margin || '0');

                  return (
                    <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell sx={{ py: 1, px: 1.25 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.78rem' }}>
                            {item.productName}
                          </Typography>
                          {returnedQty > 0 && (
                            <Chip
                              label={returnedQty === item.quantity ? 'REFUNDED' : 'RETURNED'}
                              size="small"
                              sx={{
                                height: 16,
                                width: 'fit-content',
                                bgcolor: '#fef2f2',
                                color: '#dc2626',
                                fontWeight: 700,
                                fontSize: '0.58rem',
                                border: '1px solid #fee2e2',
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1, px: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                        {returnedQty > 0 ? (
                          <Box component="span">
                            <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.5, mr: 0.5 }}>
                              {item.quantity}
                            </Box>
                            {item.quantity - returnedQty}
                          </Box>
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1, px: 1, color: '#64748b', fontSize: '0.75rem' }}>
                        ₹{item.mrp?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1, px: 1, color: '#64748b', fontSize: '0.75rem' }}>
                        ₹{item.costPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 600, color: '#1e293b', fontSize: '0.75rem' }}>
                        ₹{item.sellingPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 700, color: '#16a34a', fontSize: '0.75rem' }}>
                        ₹{item.profit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1, px: 1 }}>
                        <Chip
                          label={`${itemMargin.toFixed(1)}%`}
                          size="small"
                          sx={{
                            height: 18,
                            fontWeight: 700,
                            fontSize: '0.62rem',
                            bgcolor: itemMargin > 20 ? '#ecfdf5' : '#f8fafc',
                            color: itemMargin > 20 ? '#059669' : '#64748b',
                            border: `1px solid ${itemMargin > 20 ? '#a7f3d0' : '#e2e8f0'}`,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </InventoryPanelShell>
  );
};

export default SaleDetailPanel;
