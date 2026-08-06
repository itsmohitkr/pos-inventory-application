import React from 'react';
import type { LooseSale, ReportSale } from '@/shared/types/models';
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

interface SalesListPanelProps {
  /** 'pos' shows `sales`, 'loose' shows `looseSales`. */
  saleType: string;
  sales: ReportSale[];
  looseSales: LooseSale[];
  /**
   * In 'loose' mode the selected row is a LooseSale, not a ReportSale — the
   * same handler serves both lists.
   */
  selectedSale?: ReportSale | LooseSale | null;
  onSelectSale: (sale: ReportSale | LooseSale) => void;
  onPrintReceipt: (sale: ReportSale) => void;
  onRefund: (sale: ReportSale) => void;
  onDeleteLoose: (id: number) => void;
}

const SalesListPanel = ({
  saleType,
  sales,
  looseSales,
  selectedSale,
  onSelectSale,
  onPrintReceipt,
  onRefund,
  onDeleteLoose,
}: SalesListPanelProps) => {
  const posTotal = sales.reduce((sum: number, s: ReportSale) => sum + (s.netTotalAmount || 0), 0);
  const looseTotal = looseSales.reduce((sum: number, ls: LooseSale) => sum + (ls.price || 0), 0);
  const combinedTotal = posTotal + looseTotal;

  // 'pos' mode shows a merged, chronological list of both sale types so
  // loose sales are visible without switching tabs; 'loose' mode is
  // untouched — still loose-only, full width.
  const mergedRows: (ReportSale | LooseSale)[] =
    saleType === 'pos'
      ? [...sales, ...looseSales].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      : [];

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
          {saleType === 'pos' ? mergedRows.length : looseSales.length})
        </Typography>
      </Box>

      <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 150 }}>
                {saleType === 'pos' ? 'SALE' : 'ITEM NAME / NOTES'}
              </TableCell>
              {saleType === 'pos' && (
                <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 90 }}>
                  TYPE
                </TableCell>
              )}
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
              ? mergedRows.map((sale) => {
                const isPos = 'items' in sale;
                return (
                  <TableRow
                    key={sale.id}
                    id={`sale-row-${sale.id}`}
                    hover
                    selected={selectedSale?.id === sale.id}
                    onClick={() => onSelectSale(sale)}
                    sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'rgba(11, 29, 57, 0.08)' } }}
                  >
                    {isPos ? (
                      <TableCell sx={{ fontWeight: 600 }}>ORD-{sale.id}</TableCell>
                    ) : (
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e65100' }}>
                          {sale.itemName || 'Loose Item'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          LOO-{sale.id}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Chip
                        label={isPos ? 'POS Sale' : 'Loose Sale'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          bgcolor: isPos ? '#e8eefb' : '#fff3e0',
                          color: isPos ? '#0b1d39' : '#e65100',
                        }}
                      />
                    </TableCell>
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
                      ₹{(isPos ? sale.netTotalAmount : sale.price).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      {isPos ? (
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
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {isPos ? (
                        (() => {
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
                        })()
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      {isPos ? (
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
                      ) : (
                        <IconButton size="small" color="error" aria-label="Delete Loose Sale" onClick={() => onDeleteLoose(sale.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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
            {(saleType === 'pos' ? mergedRows.length : looseSales.length) === 0 && (
              <TableRow>
                <TableCell colSpan={saleType === 'pos' ? 7 : 4} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    No {saleType === 'pos' ? '' : 'loose '}sales found for this period
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
          bgcolor: '#e8f5e9',
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
