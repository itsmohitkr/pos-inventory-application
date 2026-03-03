import React from "react";
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
} from "@mui/material";
import {
  TrendingUp as SalesIcon,
  Savings as ProfitIcon,
  ListAlt as OrdersIcon,
  DateRange as DateIcon,
  BarChart as MarginIcon,
  LocalShipping as ShippingIcon,
} from "@mui/icons-material";
import StatCard from "./StatCard";

const AnalyticsPanel = ({ reportData, loading }) => {
  const [ownerSharePercent, setOwnerSharePercent] = React.useState(50);

  const totalSales = reportData?.totalSales || 0;
  const totalProfit = reportData?.totalProfit || 0;
  const netProfit = reportData?.netProfit || 0;
  const totalPurchases = reportData?.totalPurchases || 0;
  const totalCashBalance = reportData?.totalCashBalance || 0;
  const totalExpenses = reportData?.totalExpenses || 0;
  const ownerPayout = (netProfit * ownerSharePercent) / 100;

  // Group expenses by category
  const expenseBreakdown = (reportData?.expenses || []).reduce((acc, exp) => {
    const cat = exp.category || "Misc";
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {});

  // Group purchases by vendor
  const purchaseBreakdown = (reportData?.purchases || []).reduce((acc, pur) => {
    const vendor = pur.vendor || "Unknown Vendor";
    acc[vendor] = (acc[vendor] || 0) + pur.totalAmount;
    return acc;
  }, {});

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#fcfcfc",
        p: 4,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        height: "100%",
        overflowY: "auto",
        borderRadius: 1,
      }}
    >
      {/* Cash Flow Statement Table */}
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: "#64748b",
            fontWeight: 800,
            letterSpacing: 1.5,
            mb: 2,
            display: "block",
          }}
        >
          CASH FLOW STATEMENT (CHRONOLOGICAL)
        </Typography>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>
                  PARTICULARS
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, color: "#64748b" }}
                >
                  AMOUNT (₹)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* 1. Total Sales */}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>
                  Total Sales (Gross Income)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: "#16a34a" }}
                >
                  + {totalSales.toLocaleString()}
                </TableCell>
              </TableRow>

              {/* 2. Detailed Expenses */}
              {Object.entries(expenseBreakdown).map(([cat, amount]) => (
                <TableRow key={cat}>
                  <TableCell sx={{ color: "#64748b", pl: 4 }}>
                    Less: Expenses ({cat})
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#dc2626" }}>
                    - {amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

              {/* 3. Detailed Inventory Purchases */}
              {Object.entries(purchaseBreakdown).map(([vendor, amount]) => (
                <TableRow key={vendor}>
                  <TableCell sx={{ color: "#64748b", pl: 4 }}>
                    Less: Inventory Purchases ({vendor})
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#dc2626" }}>
                    - {amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

              {/* 4. Final Cash Balance */}
              <TableRow sx={{ bgcolor: "#f0fdf4" }}>
                <TableCell
                  sx={{ fontWeight: 900, fontSize: "1.1rem", color: "#166534" }}
                >
                  TOTAL MONEY IN SHOP (NET BALANCE)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 900, fontSize: "1.1rem", color: "#166534" }}
                >
                  ₹ {totalCashBalance.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Payout Planning Section */}
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: "#64748b",
            fontWeight: 800,
            letterSpacing: 1.5,
            mb: 2,
            display: "block",
          }}
        >
          Profit & Takeout Calculation
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid #e2e8f0",
            borderRadius: 2,
            bgcolor: "#fafbfc",
          }}
        >
          <Grid container spacing={3} alignItems="stretch">
            {/* Left: Profit Calculation */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: "#fff",
                  borderRadius: 2,
                  border: "2px solid #f0fdf4",
                                  height: "100%"
                  
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#475569",
                    fontWeight: 700,
                    mb: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <span style={{ color: "#16a34a" }}>📊</span> Profit
                  Calculation
                </Typography>

                {/* Gross Profit */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.5,
                    borderBottom: "1px solid #f1f5f9",
                    
                  }}
                >
                  <Typography sx={{ color: "#64748b", fontWeight: 500 }}>
                    Gross Profit:
                  </Typography>
                  <Typography
                    sx={{ color: "#16a34a", fontWeight: 700, fontSize: "1rem" }}
                  >
                    ₹ {totalProfit.toLocaleString()}
                  </Typography>
                </Box>

                {/* Expenses */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.5,
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <Typography sx={{ color: "#64748b", fontWeight: 500 }}>
                    Less: Expenses:
                  </Typography>
                  <Typography
                    sx={{ color: "#dc2626", fontWeight: 700, fontSize: "1rem" }}
                  >
                    - ₹ {totalExpenses.toLocaleString()}
                  </Typography>
                </Box>

                {/* Net Profit - Highlighted */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 2,
                    px: 2,
                    mt: 1.5,
                    bgcolor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography sx={{ color: "#166534", fontWeight: 700 }}>
                    Net Profit
                  </Typography>
                  <Typography
                    sx={{
                      color: "#166534",
                      fontWeight: 800,
                      fontSize: "1.1rem",
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
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                  height: "100%",
                }}
              >
                {/* Percentage Input */}
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "#fff",
                    borderRadius: 2,
                    border: "2px solid #e0e7ff",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#475569",
                      fontWeight: 700,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <span style={{ color: "#6366f1" }}>⚙️</span> Owner Takeout
                    Percentage
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <TextField
                      type="number"
                      variant="outlined"
                      size="small"
                      value={ownerSharePercent}
                      onChange={(e) =>
                        setOwnerSharePercent(
                          Math.min(
                            100,
                            Math.max(0, parseInt(e.target.value) || 0),
                          ),
                        )
                      }
                      inputProps={{ min: 0, max: 100 }}
                      sx={{
                        width: 100,
                        "& .MuiOutlinedInput-root": {
                          fontWeight: 700,
                          textAlign: "center",
                        },
                      }}
                    />
                    <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                      % of Net Profit
                    </Typography>
                  </Box>
                </Box>

                {/* Payout Result */}
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "#eff6ff",
                    border: "2px solid #7dd3fc",
                    borderRadius: 2,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#0c4a6e",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      mb: 1,
                    }}
                  >
                    💰 Your Payout
                  </Typography>
                  <Typography
                    sx={{
                      color: "#0c4a6e",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      mb: 2,
                    }}
                  >
                    ({ownerSharePercent}% of ₹ {netProfit.toLocaleString()})
                  </Typography>
                  <Typography
                    sx={{
                      color: "#0c4a6e",
                      fontWeight: 900,
                      fontSize: "2rem",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    ₹{" "}
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
    </Box>
  );
};

export default AnalyticsPanel;
