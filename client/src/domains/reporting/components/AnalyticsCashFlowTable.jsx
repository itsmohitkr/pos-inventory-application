import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  FilterAlt as FilterIcon,
} from '@mui/icons-material';

const AnalyticsCashFlowTable = ({ totalSales, cashFlowItems, totalCashBalance }) => {
  const [filterValue, setFilterValue] = React.useState(null);

  const categories = React.useMemo(() => {
    const labels = cashFlowItems.map(item => item.label);
    return Array.from(new Set(labels)).sort();
  }, [cashFlowItems]);

  const filteredItems = React.useMemo(() => {
    if (!filterValue) return cashFlowItems;
    return cashFlowItems.filter(item => item.label === filterValue);
  }, [cashFlowItems, filterValue]);

  return (
    <Box>
      {/* Category Filter Search */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'flex-start' }}>
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
                  borderRadius: '10px',
                  fontWeight: 600,
                  '& fieldset': { borderColor: '#e2e8f0' },
                },
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon sx={{ color: '#94a3b8', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Box>

      <TableContainer
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'auto',
          height: { xs: '500px', md: 'calc(100vh - 460px)' },
          bgcolor: '#ffffff',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            {/* Main Headers */}
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 800,
                  color: '#334155',
                  bgcolor: '#f1f5f9',
                  py: 1.5,
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid #e2e8f0',
                }}
              >
                PARTICULARS
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 800,
                  color: '#334155',
                  bgcolor: '#f1f5f9',
                  py: 1.5,
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid #e2e8f0',
                }}
              >
                AMOUNT (₹)
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 800,
                  color: '#334155',
                  bgcolor: '#f1f5f9',
                  py: 1.5,
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid #e2e8f0',
                  width: '80px',
                }}
              >
                ACTIONS
              </TableCell>
            </TableRow>
            {/* Gross Income Sub-Header - Sticky */}
            {!filterValue && (
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    bgcolor: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    py: 2,
                    zIndex: 2,
                    position: 'sticky',
                    top: 48,
                  }}
                >
                  Total Sales (Gross Income)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 800,
                    color: '#16a34a',
                    bgcolor: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    py: 2,
                    fontSize: '1rem',
                    zIndex: 2,
                    position: 'sticky',
                    top: 48,
                  }}
                >
                  + ₹ {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 48,
                    zIndex: 2,
                  }}
                />
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ color: '#64748b', pl: 4, py: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {item.type === 'Expense' ? 'Expense' : 'Purchase'}: {item.label}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {item.date instanceof Date
                          ? item.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                          : item.date}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {item.date instanceof Date
                          ? item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 700, fontSize: '0.9rem' }}>
                  - ₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    sx={{
                      color: '#6366f1',
                      bgcolor: 'rgba(99, 102, 241, 0.08)',
                      '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.15)' },
                    }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              bgcolor: '#f0fdf4',
            }}
          >
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  color: '#166534',
                  borderTop: '2px solid #bbf7d0',
                  py: 2,
                }}
              >
                TOTAL MONEY IN SHOP (NET BALANCE)
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  color: '#166534',
                  borderTop: '2px solid #bbf7d0',
                  py: 2,
                }}
              >
                ₹ {totalCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell sx={{ borderTop: '2px solid #bbf7d0' }} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AnalyticsCashFlowTable;