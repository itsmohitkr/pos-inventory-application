import React, { useState, useEffect } from "react";
import api from '../../api';
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  DonutLarge as ProfitIcon,
  Category as CategoryIcon,
  TrendingUp as SalesChartIcon,
  Assignment as ItemSalesIcon,
  Inventory as StockIcon,
  LocalPrintshop as LooseIcon,
  AccountBalanceWallet as SummaryIcon
} from "@mui/icons-material";

// Sub-components
import SalesHistory from "./SalesHistory";
import AnalyticsPanel from "./AnalyticsPanel";
import ExpiryReportPanel from "./ExpiryReportPanel";
import ItemSalesReportPanel from "./ItemSalesReportPanel";
import LowStockReportPanel from "./LowStockReportPanel";
import LooseSalesReportPanel from "./LooseSalesReportPanel";
import { getRefundStatus, getStatusDisplay } from "../../utils/refundStatus";
import {
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider as MuiDivider
} from "@mui/material";

const Reporting = ({ receiptSettings, shopMetadata }) => {
  const [reportData, setReportData] = useState(null);
  const [expiryData, setExpiryData] = useState(null);
  const [lowStockData, setLowStockData] = useState(null);
  const [looseSalesData, setLooseSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);
  const [reportType, setReportType] = useState("financial_summary"); // financial_summary, profit_margin, category_sales, expiry_report, item_sales, low_stock
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const timeframes = [
    { label: "Today", getValue: () => getRange("day") },
    { label: "Yesterday", getValue: () => getRange("yesterday") },
    { label: "This Week", getValue: () => getRange("week") },
    { label: "This Month", getValue: () => getRange("month") },
    { label: "Next 30 Days", getValue: () => getRange("next_month") },
    { label: "Custom", getValue: () => null },
  ];

  const getRange = (type) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (type) {
      case "day":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "week": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(now.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);

        // End of week (Sunday)
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        // Last day of month
        end.setMonth(now.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case "next_month":
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() + 30);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchReports = async (start, end) => {
    setLoading(true);
    try {
      if (reportType === 'expiry_report') {
        const res = await api.get("/api/reports/expiry", {
          params: { startDate: start, endDate: end },
        });
        setExpiryData(res.data);
      } else if (reportType === 'low_stock') {
        const res = await api.get("/api/reports/low-stock");
        setLowStockData(res.data);
      } else if (reportType === 'loose_sales') {
        const res = await api.get("/api/reports/loose-sales", {
          params: { startDate: start, endDate: end },
        });
        setLooseSalesData(res.data);
      } else {
        const res = await api.get("/api/reports", {
          params: { startDate: start, endDate: end },
        });
        setReportData(res.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and fetch on reportType change
  useEffect(() => {
    if (reportType === 'low_stock') {
      fetchReports();
      return;
    }

    let range;
    if (tabValue < 5) {
      range = timeframes[tabValue].getValue();
    } else {
      range = { start: dateRange.startDate, end: dateRange.endDate };
    }

    if (range && range.start && range.end) {
      fetchReports(range.start, range.end);
    }
  }, [reportType]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue < 5) {
      const range = timeframes[newValue].getValue();
      fetchReports(range.start, range.end);
    }
  };

  const handleApplyCustomRange = () => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchReports(dateRange.startDate, dateRange.endDate);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          m: 3,
          px: 4,
          py: 2.5,
          background: "linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)",
          borderBottom: "1px solid rgba(16, 24, 40, 0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, letterSpacing: -0.5 }}
          >
            Reports & Analytics
          </Typography>
          <Box sx={{ minWidth: 280, display: "flex", justifyContent: "flex-end" }}>
            {reportType !== 'low_stock' && (
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {timeframes.map((tf, idx) => (
                  <Tab key={idx} label={tf.label} />
                ))}
              </Tabs>
            )}
          </Box>
        </Box>
        {tabValue === 5 && reportType !== 'low_stock' && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "flex-end",
              mt: 2,
              pt: 2,
              borderTop: "1px solid #eee",
              flexWrap: "wrap",
            }}
          >
            <TextField
              label="Start Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateRange.startDate.split("T")[0] || ""}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  startDate: new Date(e.target.value).toISOString(),
                })
              }
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateRange.endDate.split("T")[0] || ""}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  endDate: new Date(e.target.value).toISOString(),
                })
              }
            />
            <Button
              variant="contained"
              onClick={handleApplyCustomRange}
              startIcon={<CalendarIcon />}
            >
              Apply
            </Button>
          </Box>
        )}
      </Paper>

      <Container
        disableGutters
        maxWidth={false}
        sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, px: 3, pb: 3 }}
      >
        {loading && !reportData && !expiryData ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            flex: 1,
            minHeight: 0
          }}>
            {/* Left Sidebar - Report Selection */}
            <Paper
              elevation={0}
              sx={{
                width: { xs: '100%', md: 280 },
                bgcolor: '#ffffff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b' }}>
                  Select Report
                </Typography>
              </Box>
              <List sx={{ p: 1 }}>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={reportType === 'financial_summary'}
                    onClick={() => setReportType('financial_summary')}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'white' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: reportType === 'financial_summary' ? 'inherit' : 'primary.main' }}>
                      <SummaryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Financial Summary" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={reportType === 'profit_margin'}
                    onClick={() => setReportType('profit_margin')}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'white' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: reportType === 'profit_margin' ? 'inherit' : 'secondary.main' }}>
                      <ProfitIcon />
                    </ListItemIcon>
                    <ListItemText primary="Profit & Margin" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={reportType === 'category_sales'}
                    onClick={() => setReportType('category_sales')}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'white' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: reportType === 'category_sales' ? 'inherit' : 'secondary.main' }}>
                      <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Sales by Category" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={reportType === 'expiry_report'}
                    onClick={() => setReportType('expiry_report')}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'white' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: reportType === 'expiry_report' ? 'inherit' : 'error.main' }}>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText primary="Expiring Products" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={reportType === 'item_sales'}
                    onClick={() => setReportType('item_sales')}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'white' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: reportType === 'item_sales' ? 'inherit' : 'success.main' }}>
                      <ItemSalesIcon />
                    </ListItemIcon>
                    <ListItemText primary="Item-Wise Sales" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={reportType === 'low_stock'}
                    onClick={() => setReportType('low_stock')}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'white' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: reportType === 'low_stock' ? 'inherit' : 'warning.main' }}>
                      <StockIcon />
                    </ListItemIcon>
                    <ListItemText primary="Low Stock" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={reportType === 'loose_sales'}
                    onClick={() => setReportType('loose_sales')}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'white' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: reportType === 'loose_sales' ? 'inherit' : 'secondary.main' }}>
                      <LooseIcon />
                    </ListItemIcon>
                    <ListItemText primary="Loose Sales" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
              </List>
            </Paper>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {reportType === 'financial_summary' ? (
                <AnalyticsPanel
                  reportData={reportData}
                  loading={loading}
                />
              ) : reportType === 'profit_margin' ? (
                <SalesHistory
                  sales={reportData?.sales}
                  timeframeLabel={timeframes[tabValue].label}
                  onSelectSale={setSelectedSale}
                />
              ) : reportType === 'category_sales' ? (
                <CategorySalesPanel sales={reportData?.sales || []} />
              ) : reportType === 'expiry_report' ? (
                <ExpiryReportPanel
                  data={expiryData}
                  loading={loading}
                  timeframeLabel={tabValue === 5 ? 'Custom' : timeframes[tabValue].label}
                />
              ) : reportType === 'item_sales' ? (
                <ItemSalesReportPanel
                  sales={reportData?.sales}
                  loading={loading}
                  timeframeLabel={tabValue === 5 ? 'Custom' : timeframes[tabValue].label}
                />
              ) : reportType === 'low_stock' ? (
                <LowStockReportPanel
                  data={lowStockData}
                  loading={loading}
                />
              ) : (
                <LooseSalesReportPanel
                  data={looseSalesData}
                  loading={loading}
                  timeframeLabel={tabValue === 5 ? 'Custom' : timeframes[tabValue].label}
                />
              )}
            </Box>
          </Box>
        )
        }

        {/* Sale Detail Dialog */}
        <Dialog
          open={Boolean(selectedSale)}
          onClose={() => setSelectedSale(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
          onKeyDown={(event) => {
            if (event.defaultPrevented) return;
            if (event.key !== "Enter") return;
            if (event.shiftKey) return;
            if (event.target?.tagName === "TEXTAREA") return;
            event.preventDefault();
            setSelectedSale(null);
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Sale Details - ORD-{selectedSale?.id}
            </Typography>
            <IconButton onClick={() => setSelectedSale(null)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            {selectedSale && (
              <>
                <Box
                  sx={{
                    mb: 4,
                    p: 3,
                    bgcolor: "#f8fafc",
                    borderRadius: 3,
                    border: "1px solid #edf2f7",
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={3}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 800,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        DATE
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {new Date(selectedSale.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 800,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        PAYMENT
                      </Typography>
                      <Chip
                        label={selectedSale.paymentMethod || 'Cash'}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          height: 'auto',
                          py: 0.5,
                          borderColor: selectedSale.paymentMethod === 'Cash' ? '#16a34a' : '#cbd5e1',
                          color: selectedSale.paymentMethod === 'Cash' ? '#16a34a' : 'inherit'
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 800,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        STATUS
                      </Typography>
                      {(() => {
                        const refundStatus = getRefundStatus(
                          selectedSale.items,
                        );
                        const display = getStatusDisplay(refundStatus);
                        return (
                          <Chip
                            label={display.label}
                            sx={{
                              bgcolor: display.bgcolor,
                              color: display.color,
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              height: 'auto',
                              py: 0.5,
                            }}
                          />
                        );
                      })()}
                    </Grid>
                    <Grid item xs={3}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 800,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        TOTAL
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ₹
                        {selectedSale.items
                          .reduce(
                            (sum, item) => sum + item.mrp * item.quantity,
                            0,
                          )
                          .toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 800,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        SUBTOTAL
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ₹{selectedSale.totalAmount.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 800,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        NET PROFIT
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#22c55e", fontWeight: 700 }}
                      >
                        ₹{selectedSale.profit.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <TableContainer
                  sx={{ border: "1px solid #edf2f7", borderRadius: 2 }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>
                          PRODUCT
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 800, color: "#64748b" }}
                        >
                          QTY
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#64748b" }}
                        >
                          MRP
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#64748b" }}
                        >
                          COST PRICE
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#64748b" }}
                        >
                          UNIT PRICE
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#64748b" }}
                        >
                          PROFIT
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#64748b" }}
                        >
                          MARGIN
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSale.items.map((item) => {
                        const returnedQty = item.returnedQuantity || 0;
                        return (
                          <TableRow key={item.id}>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <span>{item.productName}</span>
                                {returnedQty > 0 && (
                                  <Chip
                                    label={
                                      returnedQty === item.quantity
                                        ? "Refunded"
                                        : "Returned"
                                    }
                                    size="small"
                                    sx={{
                                      bgcolor:
                                        returnedQty === item.quantity
                                          ? "#ffebee"
                                          : "#e8f5e9",
                                      color:
                                        returnedQty === item.quantity
                                          ? "#d32f2f"
                                          : "#2e7d32",
                                      fontWeight: 700,
                                      fontSize: "0.7rem",
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {item.quantity}
                            </TableCell>
                            <TableCell align="right">
                              ₹{item.mrp ? item.mrp.toFixed(2) : "N/A"}
                            </TableCell>
                            <TableCell align="right">
                              ₹
                              {item.costPrice
                                ? item.costPrice.toFixed(2)
                                : "N/A"}
                            </TableCell>
                            <TableCell align="right">
                              ₹{item.sellingPrice.toFixed(2)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ color: "#2e7d32", fontWeight: 700 }}
                            >
                              ₹{item.profit.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${item.margin}%`}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  bgcolor:
                                    parseFloat(item.margin) > 20
                                      ? "#dcfce7"
                                      : "#f0f9ff",
                                  color:
                                    parseFloat(item.margin) > 20
                                      ? "#15803d"
                                      : "#0369a1",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setSelectedSale(null)}
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Close Details
            </Button>
          </DialogActions>
        </Dialog>
      </Container >
    </Box >
  );
};

const CategorySalesPanel = ({ sales }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState("All Categories");

  // Aggregate sales by category
  const categoryData = React.useMemo(() => {
    return (sales || []).reduce((acc, sale) => {
      (sale?.items || []).forEach(item => {
        if (!item) return;
        const category = item.batch?.product?.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = {
            name: category,
            totalSales: 0,
            totalProfit: 0,
            itemCount: 0
          };
        }
        acc[category].totalSales += (item.sellingPrice || 0) * (item.netQuantity || 0);
        acc[category].totalProfit += (item.profit || 0);
        acc[category].itemCount += (item.netQuantity || 0);
      });
      return acc;
    }, {});
  }, [sales]);

  const allCategories = React.useMemo(() =>
    Object.keys(categoryData).sort(),
    [categoryData]
  );

  const categoryList = React.useMemo(() => {
    let list = Object.values(categoryData);
    if (selectedCategory !== "All Categories") {
      list = list.filter(cat => cat.name === selectedCategory);
    }
    return list.sort((a, b) => b.totalSales - a.totalSales);
  }, [categoryData, selectedCategory]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [selectedCategory]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.role === "combobox") return;
      if (categoryList.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = Math.min(prev + 1, categoryList.length - 1);
          document.getElementById(`cat-row-${next}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => {
          const prevIdx = Math.max(prev - 1, 0);
          document.getElementById(`cat-row-${prevIdx}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return prevIdx;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [categoryList]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{
          p: 4,
          pb: 2,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Sales Performance by Category
          </Typography>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Filter Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              <MenuItem value="All Categories"><em>All Categories</em></MenuItem>
              {allCategories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>CATEGORY NAME</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>ITEMS SOLD</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>TOTAL SALES</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>TOTAL PROFIT</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>AVG. MARGIN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoryList.map((cat, idx) => (
                <TableRow
                  key={cat.name}
                  id={`cat-row-${idx}`}
                  hover
                  selected={selectedIndex === idx}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
                  }}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <TableCell sx={{ fontWeight: 700 }}>{cat.name}</TableCell>
                  <TableCell align="center">{cat.itemCount}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{cat.totalSales.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 700 }}>₹{cat.totalProfit.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${((cat.totalProfit / cat.totalSales) * 100).toFixed(1)}%`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: (cat.totalProfit / cat.totalSales) > 0.2 ? '#e8f5e9' : '#f0f4f8',
                        color: (cat.totalProfit / cat.totalSales) > 0.2 ? '#2e7d32' : '#1a73e8'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {categoryList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No category data available for this period.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Reporting;
