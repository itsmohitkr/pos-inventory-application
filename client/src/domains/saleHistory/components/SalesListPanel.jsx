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
  IconButton,
} from '@mui/material';
import {
  Print as PrintIcon,
  Replay as RefundIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { getRefundStatus, getStatusDisplay } from '@/shared/utils/refundStatus';

const SalesListPanel = ({
  saleType,
  sales,
  looseSales,
  selectedSale,
  onSelectSale,
  onPrintReceipt,
  onRefund,
  onDeleteLoose,
}) => {
  const posTotal = sales.reduce((sum, s) => sum + (s.netTotalAmount || 0), 0);
  const looseTotal = looseSales.reduce((sum, ls) => sum + (ls.price || 0), 0);
  const combinedTotal = posTotal + looseTotal;

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {saleType === 'pos' ? 'Sales' : 'Loose Sales'} (
          {saleType === 'pos' ? sales.length : looseSales.length})
        </Typography>
      </Box>

      <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 150 }}>
                {saleType === 'pos' ? 'ORDER ID' : 'ITEM NAME / NOTES'}
              </TableCell>
              <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 130 }}>
                DATE & TIME
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 100 }}>
                AMOUNT
              </TableCell>
              {saleType === 'pos' && (
                <>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 100 }}
                  >
                    PAYMENT
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 110 }}
                  >
                    STATUS
                  </TableCell>
                </>
              )}
              <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 100 }}>
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {saleType === 'pos'
              ? sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  id={`sale-row-${sale.id}`}
                  hover
                  selected={selectedSale?.id === sale.id}
                  onClick={() => onSelectSale(sale)}
                  sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'rgba(11, 29, 57, 0.08)' } }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>ORD-{sale.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(sale.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ₹{sale.netTotalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={sale.paymentMethod || 'Cash'}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        color: sale.paymentMethod === 'Cash' ? '#0b1d39' : '#1e293b',
                        borderColor: sale.paymentMethod === 'Cash' ? '#0b1d39' : '#cbd5e1',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const refundStatus = getRefundStatus(sale.items);
                      const display = getStatusDisplay(refundStatus);
                      return (
                        <Chip
                          label={display.label}
                          size="small"
                          sx={{
                            bgcolor: display.bgcolor,
                            color: display.color,
                            fontWeight: 500,
                          }}
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => onPrintReceipt(sale)}
                        color="success"
                        aria-label="Print Receipt"
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => onRefund(sale)} color="error" aria-label="Return/Refund">
                        <RefundIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
              : looseSales.map((sale) => (
                <TableRow
                  key={sale.id}
                  id={`sale-row-${sale.id}`}
                  hover
                  selected={selectedSale?.id === sale.id}
                  onClick={() => onSelectSale(sale)}
                  sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'rgba(11, 29, 57, 0.08)' } }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#e65100' }}>
                      {sale.itemName || 'Loose Item'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      LOO-{sale.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(sale.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ₹{sale.price.toFixed(2)}
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" color="error" aria-label="Delete Loose Sale" onClick={() => onDeleteLoose(sale.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            {(saleType === 'pos' ? sales.length : looseSales.length) === 0 && (
              <TableRow>
                <TableCell colSpan={saleType === 'pos' ? 6 : 4} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    No {saleType === 'pos' ? 'POS' : 'loose'} sales found for this period
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: '#ffffff',
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#1b5e20' }}>
            Total Sales: ₹{combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
          <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: 'text.secondary' }}>=</Typography>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: 'primary.main' }}>
            {posTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
          <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: 'text.secondary' }}>+</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#ef6c00' }}>
              {looseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '0.75rem',
                color: '#ef6c00',
                ml: 0.5,
                opacity: 0.8,
              }}
            >
              (Loose sale)
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default SalesListPanel;
