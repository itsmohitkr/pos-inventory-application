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
  Tooltip,
} from '@mui/material';
import {
  Print as PrintIcon,
  Replay as RefundIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { getRefundStatus, getStatusDisplay } from '@/shared/utils/refundStatus';

const headerCellSx = {
  fontWeight: 700,
  bgcolor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  py: 1.25,
  px: 1.5,
  whiteSpace: 'nowrap',
  width: '15%',
} as const;

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
      elevation={0}
      sx={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        bgcolor: '#ffffff',
        position: 'relative',
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#0b1d39',
              lineHeight: 1.2,
            }}
          >
            {filterType === 'all' ? 'All Sales' : filterType === 'pos' ? 'POS Sales' : 'Loose Sales'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: '#64748b',
              fontSize: '0.75rem',
              lineHeight: 1,
            }}
          >
            {filterType === 'all' ? 'POS & Loose Transactions' : filterType === 'pos' ? 'Till Terminal Sales' : 'Direct Loose Items'} ({displayedRows.length.toLocaleString()})
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={(_, val) => val && setFilterType(val)}
          size="small"
          sx={{
            height: 32,
            bgcolor: '#f1f5f9',
            p: '2px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: '6px',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              color: '#64748b',
              '&.Mui-selected': {
                bgcolor: '#ffffff',
                color: '#0b1d39',
                fontWeight: 700,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: '#ffffff' },
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.6)',
                color: '#0b1d39',
              },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="pos">POS Sales</ToggleButton>
          <ToggleButton value="loose">Loose Sales</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          '&::-webkit-scrollbar': {
            height: '6px',
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#94a3b8',
          },
        }}
      >
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: '760px' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>
                SALE / ITEM
              </TableCell>
              <TableCell align="center" sx={headerCellSx}>
                TYPE
              </TableCell>
              <TableCell sx={headerCellSx}>
                DATE & TIME
              </TableCell>
              <TableCell align="right" sx={headerCellSx}>
                AMOUNT (₹)
              </TableCell>
              <TableCell align="center" sx={headerCellSx}>
                PAYMENT
              </TableCell>
              <TableCell sx={headerCellSx}>
                STATUS
              </TableCell>
              <TableCell align="center" sx={{ ...headerCellSx, px: 0.5, width: '10%' }}>
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
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': { bgcolor: 'rgba(11, 29, 57, 0.08)' },
                    '&.Mui-selected:hover': { bgcolor: 'rgba(11, 29, 57, 0.12)' },
                    '&:hover': { bgcolor: '#f8fafc' },
                    '& td': {
                      py: 1.1,
                      px: 1.5,
                      borderBottom: '1px solid #f1f5f9',
                    },
                  }}
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
                    {(isPos ? sale.netTotalAmount : sale.price).toFixed(2)}
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
                  <TableCell>
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
                  <TableCell align="center" onClick={(e) => e.stopPropagation()} sx={{ px: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75 }}>
                      {isPos ? (
                        <>
                          <Tooltip title="Print Receipt">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                              <IconButton
                                size="small"
                                onClick={() => onPrintReceipt(sale)}
                                aria-label="Print Receipt"
                                sx={{
                                  borderRadius: '6px',
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
                          </Tooltip>
                          <Tooltip title="Return / Refund">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                              <IconButton
                                size="small"
                                onClick={() => onRefund(sale)}
                                aria-label="Return/Refund"
                                sx={{
                                  borderRadius: '6px',
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
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 0.25,
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
                          <Tooltip title="Delete Loose Sale">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                              <IconButton
                                size="small"
                                onClick={() => onDeleteLoose(sale.id)}
                                aria-label="Delete Loose Sale"
                                sx={{
                                  borderRadius: '6px',
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
                          </Tooltip>
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

      {/* Metric Summary Cards Grid matching CustomerSummaryBar and ProductSummaryBar */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 1.25,
          flexShrink: 0,
        }}
      >
        {/* Total Sales */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: '#10b98133',
            borderRadius: '8px',
            py: 1,
            px: 1.25,
            bgcolor: '#10b9810A',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#10b9811A',
              borderColor: '#10b98166',
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#10b981',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              letterSpacing: '0.5px',
              fontWeight: 600,
              display: 'block',
              mb: 0.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Total Sales
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#0b1d39',
              fontSize: '0.92rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            ₹{combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        {/* POS Sales */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: '#3b82f633',
            borderRadius: '8px',
            py: 1,
            px: 1.25,
            bgcolor: '#3b82f60A',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#3b82f61A',
              borderColor: '#3b82f666',
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#3b82f6',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              letterSpacing: '0.5px',
              fontWeight: 600,
              display: 'block',
              mb: 0.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            POS Sales ({sales.length})
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#0b1d39',
              fontSize: '0.92rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            ₹{posTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        {/* Loose Sales */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: '#f59e0b33',
            borderRadius: '8px',
            py: 1,
            px: 1.25,
            bgcolor: '#f59e0b0A',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#f59e0b1A',
              borderColor: '#f59e0b66',
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#f59e0b',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              letterSpacing: '0.5px',
              fontWeight: 600,
              display: 'block',
              mb: 0.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Loose Sales ({looseSales.length})
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#0b1d39',
              fontSize: '0.92rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            ₹{looseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default SalesListPanel;
