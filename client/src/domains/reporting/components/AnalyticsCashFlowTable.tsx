import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  FilterAlt as FilterIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from '@mui/icons-material';
import ReportTableEmptyState from '@/domains/reporting/components/ReportTableEmptyState';
import ReportTablePagination from '@/domains/reporting/components/ReportTablePagination';
import { usePagedTable } from '@/domains/reporting/components/usePagedTable';

import type { CashFlowItem } from './analyticsUtils';

interface AnalyticsCashFlowTableProps {
  totalSales: number;
  cashFlowItems: CashFlowItem[];
  totalCashBalance: number;
}

const AnalyticsCashFlowTable = ({
  totalSales,
  cashFlowItems,
  totalCashBalance,
}: AnalyticsCashFlowTableProps) => {
  const [filterValue, setFilterValue] = React.useState<string | null>(null);

  const categories = React.useMemo(() => {
    const labels = cashFlowItems.map(item => item.label);
    return Array.from(new Set(labels)).sort();
  }, [cashFlowItems]);

  const filteredItems = React.useMemo(() => {
    if (!filterValue) return cashFlowItems;
    return cashFlowItems.filter(item => item.label === filterValue);
  }, [cashFlowItems, filterValue]);

  const {
    page,
    rowsPerPage,
    paginatedItems,
    setPage,
    handleRowsPerPageChange,
  } = usePagedTable(filteredItems, [cashFlowItems, filterValue]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Category Filter Search */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <Autocomplete
          options={categories}
          value={filterValue}
          onChange={(_, newValue) => setFilterValue(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Filter by category / vendor..."
              size="small"
              sx={{
                width: 320,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f8fafc',
                  borderRadius: '6px',
                  height: 36,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&.Mui-focused fieldset': { borderColor: '#0b1d39' },
                },
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          bgcolor: '#ffffff',
        }}
      >
        <TableContainer
          sx={{
            overflow: 'auto',
            flex: 1,
            maxHeight: 'calc(100vh - 360px)',
          }}
        >
          <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: '#475569',
                  bgcolor: '#f8fafc',
                  py: 1.25,
                  px: 1.5,
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                  borderBottom: '1px solid #e2e8f0',
                  width: '5%',
                  minWidth: '50px',
                }}
              >
                S.NO.
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: '#475569',
                  bgcolor: '#f8fafc',
                  py: 1.25,
                  px: 1.5,
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                PARTICULARS
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  color: '#475569',
                  bgcolor: '#f8fafc',
                  py: 1.25,
                  px: 1.5,
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                AMOUNT (₹)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length === 0 && (Boolean(filterValue) || totalSales === 0) ? (
              <ReportTableEmptyState
                colSpan={3}
                icon={<AccountBalanceWalletIcon />}
                title="No cash flow entries found"
                subtitle={filterValue ? 'Try selecting a different vendor or category filter' : 'No cash flow activity recorded for this period'}
              />
            ) : (
              <>
                {!filterValue && (
                  <TableRow sx={{ bgcolor: 'rgba(22, 163, 74, 0.04)' }}>
                    <TableCell sx={{ py: 1.25, px: 1.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                      -
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 700, color: '#166534', fontSize: '0.8125rem' }}>
                      Total Sales (Gross Income)
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        py: 1.25,
                        px: 1.5,
                        fontWeight: 700,
                        color: '#16a34a',
                        fontSize: '0.875rem',
                      }}
                    >
                      + ₹{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                )}
                {filteredItems.length === 0 && !filterValue && totalSales > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.8125rem' }}>
                      No purchases or expenses recorded for this period.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedItems.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ py: 1.25, px: 1.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem' }}>
                          {item.type === 'Expense' ? 'Expense' : 'Purchase'}: {item.label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                            {item.date instanceof Date
                              ? item.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                              : item.date}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            {item.date instanceof Date
                              ? item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 1.5, color: '#dc2626', fontWeight: 700, fontSize: '0.8125rem' }}>
                      - ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
          <TableFooter
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              bgcolor: '#f8fafc',
            }}
          >
            <TableRow sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
              <TableCell
                colSpan={2}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                  borderTop: '2px solid #e2e8f0',
                  py: 1.25,
                  px: 1.5,
                }}
              >
                TOTAL MONEY IN SHOP (NET BALANCE)
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  color: '#166534',
                  borderTop: '2px solid #e2e8f0',
                  py: 1.25,
                  px: 1.5,
                }}
              >
                ₹{totalCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <ReportTablePagination
        count={filteredItems.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Paper>
  </Box>
  );
};

export default AnalyticsCashFlowTable;