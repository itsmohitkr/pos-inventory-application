import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
const POSSaleDetailsPanel = ({ selectedSale, stats }) => {
  if (!selectedSale) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          border: '2px dashed #e2e8f0',
          bgcolor: '#f8fafc',
          borderRadius: 3,
        }}
      >
        <Box>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            No Transaction Selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a POS sale from the list to view its full details.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Paper
        sx={{
          p: 1.75,
          borderRadius: 1.5,
          border: '1px solid #eef2f6',
          bgcolor: '#ffffff',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            gap: 2,
            whiteSpace: 'nowrap',
          }}
        >
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a73e8' }}>
              Order ORD-{selectedSale.id}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {new Date(selectedSale.createdAt).toLocaleDateString()}{' '}
              {new Date(selectedSale.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                Items: {selectedSale.items.reduce((sum, item) => sum + item.quantity, 0)}
              </Typography>
              <Chip
                label={selectedSale.paymentMethod || 'Cash'}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  color: selectedSale.paymentMethod === 'Cash' ? '#16a34a' : '#1e293b',
                  borderColor: selectedSale.paymentMethod === 'Cash' ? '#16a34a' : '#cbd5e1',
                }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 1,
              borderRadius: 1.5,
              bgcolor: '#f8fafc',
              border: '1px solid #eef2f6',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, display: 'block' }}
            >
              TOTAL VALUE
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1976d2' }}>
              ₹{stats.total.toFixed(2)}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1.4,
              p: 1,
              borderRadius: 1.5,
              bgcolor: '#fff5f5',
              border: '1px solid #ffe4e6',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, display: 'block' }}
            >
              TOTAL DISCOUNT
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#d32f2f' }}>
              ₹{stats.totalDiscount.toFixed(2)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: '#64748b',
                display: 'block',
                whiteSpace: 'normal',
                lineHeight: 1.2,
                mt: 0.5,
              }}
            >
              ₹{stats.mrpDiscount.toFixed(2)} MRP + ₹{stats.extraDiscount.toFixed(2)} Extra ·{' '}
              {stats.discountPercent}% of MRP
            </Typography>

          </Box>
        </Box>
      </Paper>

      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #eee', flexShrink: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Products ({selectedSale.items.length})
          </Typography>
        </Box>
        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>PRODUCT</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
                  QTY
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
                  MRP
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
                  PRICE
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
                  MRP DISCOUNT
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
                  EXTRA DISCOUNT
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedSale.items.map((item) => {
                const mrp = item.mrp || item.sellingPrice;
                const itemDiscount = mrp - item.sellingPrice;
                const itemDiscountPercent = mrp > 0 ? ((itemDiscount / mrp) * 100).toFixed(1) : 0;
                const returnedQty = item.returnedQuantity || 0;

                return (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    <TableCell align="right">₹{mrp.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 700 }}>
                          ₹{itemDiscount.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({itemDiscountPercent}%)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 700 }}>
                        ₹0.00
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default POSSaleDetailsPanel;
