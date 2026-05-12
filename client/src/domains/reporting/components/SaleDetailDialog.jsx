import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const SaleDetailDialog = ({ selectedSale, onClose }) => {
  return (
    <Dialog
      open={Boolean(selectedSale)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onClose();
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#ffffff',
          color: '#0f172a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2.5,
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Financial Breakdown
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>
            Sale Details - ORD-{selectedSale?.id}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#ffffff', mt: 1 }}>
        {selectedSale && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Summary Stat Cards */}
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: '10px',
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 1 }}>
                  TRANSACTION INFO
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                  {new Date(selectedSale.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    {new Date(selectedSale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Chip
                    label={selectedSale.paymentMethod || 'CASH'}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      bgcolor: '#0f172a',
                      color: '#ffffff',
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: '10px',
                  bgcolor: '#f0fdf4',
                  border: '1px solid #dcfce7',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', display: 'block', mb: 1 }}>
                  NET REVENUE
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#065f46' }}>
                  ₹{selectedSale.netTotalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>
                  AFTER DISCOUNTS
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: '10px',
                  bgcolor: '#ecfdf5',
                  border: '1px solid #d1fae5',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#065f46', display: 'block', mb: 1 }}>
                  TOTAL PROFIT
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#047857' }}>
                  ₹{selectedSale.profit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                  {((selectedSale.profit / selectedSale.netTotalAmount) * 100).toFixed(1)}% MARGIN
                </Typography>
              </Box>
            </Box>

            {/* Product Breakdown Table */}
            <Box>
              <Box sx={{ px: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  ITEMIZED BREAKDOWN
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  {selectedSale.items.length} PRODUCTS
                </Typography>
              </Box>

              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem' }}>PRODUCT</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem' }}>QTY</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem' }}>MRP</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem' }}>COST PRICE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem' }}>UNIT PRICE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem' }}>PROFIT</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem' }}>MARGIN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSale.items.map((item) => {
                      const returnedQty = item.returnedQuantity || 0;
                      const margin = parseFloat(item.margin);

                      return (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {item.productName}
                              </Typography>
                              {returnedQty > 0 && (
                                <Chip
                                  label={returnedQty === item.quantity ? 'REFUNDED' : 'RETURNED'}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    bgcolor: '#fef2f2',
                                    color: '#dc2626',
                                    fontWeight: 900,
                                    fontSize: '0.6rem',
                                    border: '1px solid #fee2e2'
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>{item.quantity}</TableCell>
                          <TableCell align="right" sx={{ color: '#64748b' }}>₹{item.mrp?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell align="right" sx={{ color: '#64748b' }}>₹{item.costPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b' }}>₹{item.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#059669' }}>
                            ₹{item.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${margin.toFixed(1)}%`}
                              size="small"
                              sx={{
                                height: 20,
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                bgcolor: margin > 20 ? '#ecfdf5' : '#f8fafc',
                                color: margin > 20 ? '#059669' : '#64748b',
                                border: `1px solid ${margin > 20 ? '#10b981' : '#e2e8f0'}`,
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
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: '#0f172a',
            color: '#ffffff',
            borderRadius: '8px',
            px: 4,
            fontWeight: 700,
            '&:hover': { bgcolor: '#1e293b' }
          }}
        >
          Close Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaleDetailDialog;
