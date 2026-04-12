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
import { getRefundStatus, getStatusDisplay } from '../../shared/utils/refundStatus';

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
          p: 2,
          borderBottom: '1px solid #eee',
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
        <Chip
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#1b5e20' }}>
                Total Sales: ₹
                {combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#64748b' }}>
                =
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1565c0' }}>
                {posTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#64748b' }}>
                +
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#ef6c00' }}>
                  {looseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#f57c00',
                    ml: 0.5,
                    opacity: 0.9,
                  }}
                >
                  (Loose sale)
                </Typography>
              </Box>
            </Box>
          }
          sx={{
            height: 'auto',
            py: 1.5,
            px: 2,
            bgcolor: '#f1f8e9',
            border: '2px solid #a5d6a7',
            borderRadius: 3,
            '& .MuiChip-label': { p: 0 },
          }}
        />
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
                    sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: '#e3f2fd' } }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>ORD-{sale.id}</TableCell>
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
                          color: sale.paymentMethod === 'Cash' ? '#16a34a' : '#1e293b',
                          borderColor: sale.paymentMethod === 'Cash' ? '#16a34a' : '#cbd5e1',
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
                              fontWeight: 700,
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
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => onRefund(sale)} color="error">
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
                    sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: '#fff3e0' } }}
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
                      <IconButton size="small" color="error" onClick={() => onDeleteLoose(sale.id)}>
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
    </Paper>
  );
};

export default SalesListPanel;
