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
import { getRefundStatus, getStatusDisplay } from '@/shared/utils/refundStatus';

const SaleDetailDialog = ({ selectedSale, onClose }) => {
  return (
    <Dialog
      open={Boolean(selectedSale)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
      onKeyDown={(event) => {
        if (event.defaultPrevented) return;
        if (event.key !== 'Enter') return;
        if (event.shiftKey) return;
        if (event.target?.tagName === 'TEXTAREA') return;
        event.preventDefault();
        onClose();
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Sale Details - ORD-{selectedSale?.id}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 4 }}>
        {selectedSale && (
          <>
            <Box
              sx={{
                mb: 4,
                p: 3,
                bgcolor: '#f8fafc',
                borderRadius: 3,
                border: '1px solid #edf2f7',
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={3}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontWeight: 800,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    DATE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {new Date(selectedSale.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontWeight: 800,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    PAYMENT
                  </Typography>
                  <Chip
                    label={selectedSale.paymentMethod || 'Cash'}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 'auto',
                      py: 0.5,
                      borderColor: selectedSale.paymentMethod === 'Cash' ? '#16a34a' : '#cbd5e1',
                      color: selectedSale.paymentMethod === 'Cash' ? '#16a34a' : 'inherit',
                    }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontWeight: 800,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    STATUS
                  </Typography>
                  {(() => {
                    const refundStatus = getRefundStatus(selectedSale.items);
                    const display = getStatusDisplay(refundStatus);
                    return (
                      <Chip
                        label={display.label}
                        sx={{
                          bgcolor: display.bgcolor,
                          color: display.color,
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          height: 'auto',
                          py: 0.5,
                        }}
                      />
                    );
                  })()}
                </Grid>
                <Grid item xs={3}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontWeight: 800,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    TOTAL
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    ₹
                    {selectedSale.items
                      .reduce((sum, item) => sum + item.mrp * item.quantity, 0)
                      .toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontWeight: 800,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    SUBTOTAL
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    ₹{selectedSale.totalAmount.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontWeight: 800,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    NET PROFIT
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 700 }}>
                    ₹{selectedSale.profit.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <TableContainer sx={{ border: '1px solid #edf2f7', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>PRODUCT</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b' }}>
                      QTY
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>
                      MRP
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>
                      COST PRICE
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>
                      UNIT PRICE
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>
                      PROFIT
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>
                      MARGIN
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedSale.items.map((item) => {
                    const returnedQty = item.returnedQuantity || 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {item.sellingPrice === 0 && (
                              <Chip
                                label="FREE"
                                size="small"
                                sx={{
                                  bgcolor: '#e8f5e9',
                                  color: '#2e7d32',
                                  fontWeight: 800,
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            )}
                            <span>{item.productName}</span>
                            {returnedQty > 0 && (
                              <Chip
                                label={returnedQty === item.quantity ? 'Refunded' : 'Returned'}
                                size="small"
                                sx={{
                                  bgcolor: returnedQty === item.quantity ? '#ffebee' : '#e8f5e9',
                                  color: returnedQty === item.quantity ? '#d32f2f' : '#2e7d32',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ₹{item.mrp ? item.mrp.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          ₹{item.costPrice ? item.costPrice.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell align="right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                          ₹{item.profit.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${item.margin}%`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: parseFloat(item.margin) > 20 ? '#dcfce7' : '#f0f9ff',
                              color: parseFloat(item.margin) > 20 ? '#15803d' : '#0369a1',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Close Details
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaleDetailDialog;
