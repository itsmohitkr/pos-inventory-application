import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  Paper,
} from '@mui/material';
import { Close as CloseIcon, Person as PersonIcon } from '@mui/icons-material';
import type { Customer, CustomerPurchaseHistory } from '@/shared/api/customerService';
import type { Sale, SaleItem } from '@/shared/types/models';

interface CustomerHistoryDrawerProps {
  open: boolean;
  customer?: Customer | null;
  /** Null while loading or before a customer has been opened. */
  historyData?: CustomerPurchaseHistory | null;
  isLoading: boolean;
  onClose: () => void;
}

const CustomerHistoryDrawer = ({
  open,
  customer,
  historyData,
  isLoading,
  onClose,
}: CustomerHistoryDrawerProps) => {
  const calculateSaleNet = (sale: Sale) => {
    return sale.items.reduce((sum: number, item: SaleItem) => {
      const netQty = item.quantity - item.returnedQuantity;
      return sum + netQty * item.sellingPrice;
    }, 0);
  };

  const totalSpent =
    historyData?.sales?.reduce((sum: number, s: Sale) => sum + calculateSaleNet(s), 0) ?? 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 280, exit: 220 }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.25)',
          },
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 550, md: 650 },
          boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
          borderLeft: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <PersonIcon sx={{ color: '#0b1d39', fontSize: '1.4rem' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', lineHeight: 1.2 }}>
                {customer?.name || customer?.phone || 'Customer Details'}
              </Typography>
              {customer?.name && (
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Phone: {customer.phone}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close"
            sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Body Container */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 }, bgcolor: '#f1f5f9' }}>
          {/* Summary Card */}
          {historyData && (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: '12px',
                bgcolor: '#f8fafc',
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  TOTAL PURCHASES
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {historyData.sales.length}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  NET SPENT
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>
                  ₹{totalSpent.toFixed(0)}
                </Typography>
              </Box>
              {customer?.customerBarcode && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      BARCODE
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}
                    >
                      {customer.customerBarcode}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          )}

          {/* Transaction History Items */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
              <CircularProgress />
            </Box>
          ) : !historyData || historyData.sales.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 4, textAlign: 'center', borderRadius: '12px', bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}
            >
              <Typography color="text.secondary" fontWeight={500}>
                No purchase history found for this customer.
              </Typography>
            </Paper>
          ) : (
            historyData.sales.map((sale) => {
              const netAmount = calculateSaleNet(sale);
              return (
                <Paper
                  key={sale.id}
                  variant="outlined"
                  sx={{
                    mb: 2.5,
                    borderRadius: '12px',
                    bgcolor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      bgcolor: '#ffffff',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(sale.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        Sale #{sale.id}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284c7' }}>
                        ₹{netAmount.toFixed(2)}
                      </Typography>
                      <Chip
                        label={sale.paymentMethod}
                        size="small"
                        sx={{ fontSize: '0.7rem', fontWeight: 600, height: 20, bgcolor: '#f1f5f9', color: '#475569' }}
                      />
                    </Box>
                  </Box>
                  <TableContainer sx={{ bgcolor: '#ffffff' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            Item
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            Qty
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            Price
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sale.items.map((item) => (
                          <TableRow key={item.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b' }}>
                              {item.batch?.product?.name || 'Unknown'}
                              {item.returnedQuantity > 0 && (
                                <Chip
                                  label={`-${item.returnedQuantity} returned`}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, ml: 1 }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                              {item.returnedQuantity > 0 ? (
                                <Box component="span">
                                  <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.5, mr: 0.5 }}>
                                    {item.quantity}
                                  </Box>
                                  {item.quantity - item.returnedQuantity}
                                </Box>
                              ) : (
                                item.quantity
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                              ₹{item.sellingPrice}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              );
            })
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default CustomerHistoryDrawer;
