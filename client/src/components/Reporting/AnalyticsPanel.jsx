import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
} from '@mui/material';
import {
  TrendingUp as SalesIcon,
  Savings as ProfitIcon,
  ListAlt as OrdersIcon,
  DateRange as DateIcon,
  BarChart as MarginIcon,
  LocalShipping as ShippingIcon,
  MonetizationOn as ValueIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';

const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];
import StatCard from './StatCard';

const AnalyticsPanel = ({ reportData, loading }) => {
  const [ownerSharePercent, setOwnerSharePercent] = React.useState(50);

  const totalSales = reportData?.totalSales || 0;
  const totalProfit = reportData?.totalProfit || 0;
  const netProfit = reportData?.netProfit || 0;
  const _totalPurchases = reportData?.totalPurchases || 0;
  const totalCashBalance = reportData?.totalCashBalance || 0;
  const totalExpenses = reportData?.totalExpenses || 0;
  const ownerPayout = (netProfit * ownerSharePercent) / 100;

  // Combine and sort both expenses and purchases chronologically
  const cashFlowItems = [
    ...(reportData?.expenses || []).map((e) => ({
      id: `exp - ${e.id} `,
      date: new Date(e.date),
      type: 'Expense',
      label: e.category || 'Misc',
      amount: e.amount,
    })),
    ...(reportData?.purchases || []).map((p) => ({
      id: `pur - ${p.id} `,
      date: new Date(p.date),
      type: 'Purchase',
      label: p.vendor || 'Unknown Vendor',
      amount: p.totalAmount,
    })),
  ].sort((a, b) => b.date - a.date);

  // Group expenses by category
  const expenseBreakdown = (reportData?.expenses || []).reduce((acc, exp) => {
    const cat = exp.category || 'Misc';
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {});

  // Calculate donught segments for Expenses
  const expEntries = Object.entries(expenseBreakdown).sort((a, b) => b[1] - a[1]);
  const totalExpPie = expEntries.reduce((sum, [, val]) => sum + val, 0);
  const expenseSegments = expEntries.map(([name, val], idx) => ({
    name,
    value: val,
    percent: totalExpPie > 0 ? (val / totalExpPie) * 100 : 0,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));
  let expCum = 0;
  const expenseGradient = expenseSegments
    .map((stop) => {
      const start = expCum;
      expCum += stop.percent;
      return `${stop.color} ${start}% ${expCum}%`;
    })
    .join(', ');

  // Group purchases by vendor
  const purchaseBreakdown = (reportData?.purchases || []).reduce((acc, pur) => {
    const vendor = pur.vendor || 'Unknown Vendor';
    acc[vendor] = (acc[vendor] || 0) + (pur.totalAmount || 0); // ensuring numeric
    return acc;
  }, {});

  // Calculate donught segments for Purchases
  const purEntries = Object.entries(purchaseBreakdown).sort((a, b) => b[1] - a[1]);
  const totalPurPie = purEntries.reduce((sum, [, val]) => sum + val, 0);
  const purchaseSegments = purEntries.map(([name, val], idx) => ({
    name,
    value: val,
    percent: totalPurPie > 0 ? (val / totalPurPie) * 100 : 0,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));
  let purCum = 0;
  const purchaseGradient = purchaseSegments
    .map((stop) => {
      const start = purCum;
      purCum += stop.percent;
      return `${stop.color} ${start}% ${purCum}%`;
    })
    .join(', ');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: '#fcfcfc',
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        height: '100%',
        overflowY: 'auto',
        borderRadius: 1,
      }}
    >
      {/* Cash Flow Statement Table */}
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: '#64748b',
            fontWeight: 800,
            letterSpacing: 1.5,
            mb: 2,
            display: 'block',
          }}
        >
          CASH FLOW STATEMENT (CHRONOLOGICAL)
        </Typography>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid #e2e8f0',
            borderRadius: 3,
            overflow: 'hidden',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <Table stickyHeader>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell
                  sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc', top: 0, zIndex: 2 }}
                >
                  PARTICULARS
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc', top: 0, zIndex: 2 }}
                >
                  AMOUNT (₹)
                </TableCell>
              </TableRow>
              {/* 1. Total Sales */}
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    bgcolor: 'white',
                    borderBottom: '2px solid #e2e8f0',
                    top: 40,
                    zIndex: 2,
                  }}
                >
                  Total Sales (Gross Income)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: '#16a34a',
                    bgcolor: 'white',
                    borderBottom: '2px solid #e2e8f0',
                    top: 40,
                    zIndex: 2,
                  }}
                >
                  + {totalSales.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* 2. Chronological Expenses & Purchases */}
              {cashFlowItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ color: '#64748b', pl: 4 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        Less: {item.type === 'Expense' ? 'Expense' : 'Inventory Purchase'} (
                        {item.label})
                      </span>
                      <Typography
                        variant="caption"
                        sx={{ color: '#94a3b8', fontStyle: 'italic', ml: 2 }}
                      >
                        {item.date
                          .toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                          .replace(/\//g, '-')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#dc2626' }}>
                    - {item.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 1, bgcolor: '#f0fdf4' }}>
              {/* 4. Final Cash Balance */}
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    color: '#166534',
                    borderTop: '2px solid #16a34a',
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
                    borderTop: '2px solid #16a34a',
                  }}
                >
                  ₹ {totalCashBalance.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Box>

      {/* Payout Planning Section */}
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: '#64748b',
            fontWeight: 800,
            letterSpacing: 1.5,
            mb: 2,
            display: 'block',
          }}
        >
          Profit & Takeout Calculation
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            bgcolor: '#fafbfc',
          }}
        >
          <Grid container spacing={3} alignItems="stretch">
            {/* Left: Profit Calculation */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: '#fff',
                  borderRadius: 2,
                  border: '2px solid #f0fdf4',
                  height: '100%',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#475569',
                    fontWeight: 700,
                    mb: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <span style={{ color: '#16a34a' }}>📊</span> Profit Calculation
                </Typography>

                {/* Gross Profit */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Gross Profit:</Typography>
                  <Typography sx={{ color: '#16a34a', fontWeight: 700, fontSize: '1rem' }}>
                    ₹ {totalProfit.toLocaleString()}
                  </Typography>
                </Box>

                {/* Expenses */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <Typography sx={{ color: '#64748b', fontWeight: 500 }}>
                    Less: Expenses:
                  </Typography>
                  <Typography sx={{ color: '#dc2626', fontWeight: 700, fontSize: '1rem' }}>
                    - ₹ {totalExpenses.toLocaleString()}
                  </Typography>
                </Box>

                {/* Net Profit - Highlighted */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    px: 2,
                    mt: 1.5,
                    bgcolor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 1.5,
                  }}
                >
                  <Typography sx={{ color: '#166534', fontWeight: 700 }}>Net Profit</Typography>
                  <Typography
                    sx={{
                      color: '#166534',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                    }}
                  >
                    ₹ {netProfit.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right: Owner Payout */}
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                  height: '100%',
                }}
              >
                {/* Percentage Input */}
                <Box
                  sx={{
                    p: 3,
                    bgcolor: '#fff',
                    borderRadius: 2,
                    border: '2px solid #e0e7ff',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#475569',
                      fontWeight: 700,
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <span style={{ color: '#6366f1' }}>⚙️</span> Owner Takeout Percentage
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      type="number"
                      variant="outlined"
                      size="small"
                      value={ownerSharePercent}
                      onChange={(e) =>
                        setOwnerSharePercent(
                          Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                        )
                      }
                      inputProps={{ min: 0, max: 100 }}
                      sx={{
                        width: 100,
                        '& .MuiOutlinedInput-root': {
                          fontWeight: 700,
                          textAlign: 'center',
                        },
                      }}
                    />
                    <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                      % of Net Profit
                    </Typography>
                  </Box>
                </Box>

                {/* Payout Result */}
                <Box
                  sx={{
                    p: 3,
                    bgcolor: '#eff6ff',
                    border: '2px solid #7dd3fc',
                    borderRadius: 2,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#0c4a6e',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      mb: 1,
                    }}
                  >
                    💰 Your Payout
                  </Typography>
                  <Typography
                    sx={{
                      color: '#0c4a6e',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      mb: 2,
                    }}
                  >
                    ({ownerSharePercent}% of ₹ {netProfit.toLocaleString()})
                  </Typography>
                  <Typography
                    sx={{
                      color: '#0c4a6e',
                      fontWeight: 900,
                      fontSize: '2rem',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    ₹{' '}
                    {ownerPayout.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Analytics Charts Row */}
      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Expenses Pie Chart */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PieChartIcon sx={{ color: '#0b1d39' }} />
            <Typography variant="h6" sx={{ color: '#0b1d39', fontWeight: 700 }}>
              Expenses by Category
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', mb: 3 }}>
            Breakdown of operating costs
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 150 }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: expenseSegments.length
                    ? `conic-gradient(${expenseGradient})`
                    : '#e2e8f0',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '25%',
                    left: '25%',
                    width: '50%',
                    height: '50%',
                    bgcolor: '#fff',
                    borderRadius: '50%',
                  }}
                />
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                overflowY: 'auto',
                maxHeight: '150px',
              }}
            >
              {expenseSegments.length === 0 && (
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  No expenses to display
                </Typography>
              )}
              {expenseSegments.map((seg) => (
                <Box
                  key={seg.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: seg.color }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#4b5563',
                        fontSize: '0.75rem',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {seg.name} ({seg.percent.toFixed(0)}%)
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    ₹{seg.value.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Purchases Pie Chart */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PieChartIcon sx={{ color: '#0b1d39' }} />
            <Typography variant="h6" sx={{ color: '#0b1d39', fontWeight: 700 }}>
              Purchases by Vendor
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', mb: 3 }}>
            Breakdown of inventory investments
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 150 }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: purchaseSegments.length
                    ? `conic-gradient(${purchaseGradient})`
                    : '#e2e8f0',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '25%',
                    left: '25%',
                    width: '50%',
                    height: '50%',
                    bgcolor: '#fff',
                    borderRadius: '50%',
                  }}
                />
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                overflowY: 'auto',
                maxHeight: '150px',
              }}
            >
              {purchaseSegments.length === 0 && (
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  No purchases to display
                </Typography>
              )}
              {purchaseSegments.map((seg) => (
                <Box
                  key={seg.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: seg.color }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#4b5563',
                        fontSize: '0.75rem',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {seg.name} ({seg.percent.toFixed(0)}%)
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    ₹{seg.value.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AnalyticsPanel;
