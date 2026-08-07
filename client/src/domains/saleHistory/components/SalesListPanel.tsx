import React, { useState, useMemo } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Print as PrintIcon,
  Replay as RefundIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { getRefundStatus, getStatusDisplay } from '@/shared/utils/refundStatus';

interface SalesListPanelProps {
  saleType?: string;
  sales: ReportSale[];
  looseSales: LooseSale[];
  selectedSale?: ReportSale | LooseSale | null;
  onSelectSale: (sale: ReportSale | LooseSale) => void;
  onPrintReceipt: (sale: ReportSale) => void;
  onRefund: (sale: ReportSale) => void;
  onDeleteLoose: (id: number) => void;
}

const SalesListPanel = ({
  saleType = 'all',
  sales,
  looseSales,
  selectedSale,
  onSelectSale,
  onPrintReceipt,
  onRefund,
  onDeleteLoose,
}: SalesListPanelProps) => {
  const [filterType, setFilterType] = useState<string>(saleType || 'all');

  const posTotal = sales.reduce((sum: number, s: ReportSale) => sum + (s.netTotalAmount || 0), 0);
  const looseTotal = looseSales.reduce((sum: number, ls: LooseSale) => sum + (ls.price || 0), 0);
  const combinedTotal = posTotal + looseTotal;

  const displayedRows: (ReportSale | LooseSale)[] = useMemo(() => {
    if (filterType === 'pos') {
      return sales;
    }
    if (filterType === 'loose') {
      return looseSales;
    }
    return [...sales, ...looseSales].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filterType, sales, looseSales]);

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
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {filterType === 'all' ? 'All Sales' : filterType === 'pos' ? 'POS Sales' : 'Loose Sales'} (
          {displayedRows.length})
        </Typography>

        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={(_, val) => val && setFilterType(val)}
          size="small"
          sx={{ height: 32 }}
        >
          <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 700 }}>
            All
          </ToggleButton>
          <ToggleButton value="pos" sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 700 }}>
            POS Sales
          </ToggleButton>
          <ToggleButton value="loose" sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 700 }}>
            Loose Sales
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 150 }}>
                SALE / ITEM
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 90 }}>
                TYPE
              </TableCell>
              <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 130 }}>
                DATE & TIME
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 100 }}>
                AMOUNT
              </TableCell>
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
              <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f8fafc', minWidth: 100 }}>
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.map((sale) => {
              const isPos = 'items' in sale;
              const rowKey = isPos ? `pos-${sale.id}` : `loose-${sale.id}`;
              const rowDomId = isPos ? `sale-row-${sale.id}` : `sale-row-loose-${sale.id}`;
              const isSelected =
                !!selectedSale && selectedSale.id === sale.id && ('items' in selectedSale) === isPos;
              return (
                <TableRow
                  key={rowKey}
                  id={rowDomId}
                  hover
                  selected={isSelected}
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                      {isPos ? (
                        <>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                            <IconButton
                              size="small"
                              onClick={() => onPrintReceipt(sale)}
                              aria-label="Print Receipt"
                              sx={{
                                bgcolor: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' },
                              }}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#10b981' }}
                            >
                              Print
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                            <IconButton
                              size="small"
                              onClick={() => onRefund(sale)}
                              aria-label="Return/Refund"
                              sx={{
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                              }}
                            >
                              <RefundIcon fontSize="small" />
                            </IconButton>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ef4444' }}
                            >
                              Return
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 0.3,
                              visibility: 'hidden',
                            }}
                            tabIndex={-1}
                            aria-hidden="true"
                          >
                            <IconButton size="small">
                              <PrintIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                              Print
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                            <IconButton
                              size="small"
                              onClick={() => onDeleteLoose(sale.id)}
                              aria-label="Delete Loose Sale"
                              sx={{
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ef4444' }}
                            >
                              Delete
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {displayedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    No {filterType === 'all' ? '' : filterType === 'pos' ? 'POS ' : 'loose '}sales found for this period
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
          bgcolor: filterType === 'loose' ? '#fff3e0' : '#e8f5e9',
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {filterType === 'all' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#1b5e20' }}>
              Total Sales: ₹{combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: 'text.secondary' }}>=</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: 'primary.main' }}>
                {posTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: 'primary.main',
                  ml: 0.5,
                  opacity: 0.8,
                }}
              >
                (POS sale)
              </Typography>
            </Box>
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
        ) : filterType === 'pos' ? (
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'primary.main' }}>
            Total POS Sales: ₹{posTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
        ) : (
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#e65100' }}>
            Total Loose Sales: ₹{looseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default SalesListPanel;
