import React from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Chip, Paper,
} from '@mui/material';
import { Close as CloseIcon, Person as PersonIcon } from '@mui/icons-material';

const CustomerHistoryDrawer = ({ open, customer, historyData, isLoading, onClose }) => {
  const calculateSaleNet = (sale) => {
    return sale.items.reduce((sum, item) => {
      const netQty = item.quantity - item.returnedQuantity;
      return sum + (netQty * item.sellingPrice);
    }, 0);
  };

  const totalSpent = historyData?.sales?.reduce((sum, s) => sum + calculateSaleNet(s), 0) ?? 0;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PersonIcon />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {customer?.name || customer?.phone}
            </Typography>
            {customer?.name && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {customer.phone}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Close" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Summary bar */}
        {historyData && (
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default', display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">TOTAL PURCHASES</Typography>
              <Typography variant="h6" fontWeight="bold">{historyData.sales.length}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary">NET SPENT</Typography>
              <Typography variant="h6" fontWeight="bold">₹{totalSpent.toFixed(0)}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary">BARCODE</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                {customer?.customerBarcode}
              </Typography>
            </Box>
          </Box>
        )}
        <Divider />

        {/* Body */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
              <CircularProgress />
            </Box>
          ) : !historyData || historyData.sales.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" sx={{ pt: 6 }}>
              No purchase history yet
            </Typography>
          ) : (
            historyData.sales.map((sale) => {
              const netAmount = calculateSaleNet(sale);
              return (
                <Paper key={sale.id} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1, bgcolor: 'rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(sale.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        Sale #{sale.id}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        ₹{netAmount.toFixed(2)}
                      </Typography>
                      <Chip label={sale.paymentMethod} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                    </Box>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Item</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Qty</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sale.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell sx={{ fontSize: '0.8rem' }}>
                              {item.batch?.product?.name || 'Unknown'}
                              {item.returnedQuantity > 0 && (
                                <Chip
                                  label={`-${item.returnedQuantity} returned`}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  sx={{ height: 16, fontSize: '0.6rem', ml: 1 }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.8rem' }}>
                              {item.returnedQuantity > 0 ? (
                                <Box component="span">
                                  <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.5, mr: 0.5 }}>
                                    {item.quantity}
                                  </Box>
                                  {item.quantity - item.returnedQuantity}
                                </Box>
                              ) : item.quantity}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{item.sellingPrice}</TableCell>
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
