import React, { useState, useEffect } from "react";
import { flushSync } from 'react-dom';
import api from '../../shared/api/api';
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  Print as PrintIcon,
  Replay as RefundIcon,
  CalendarToday as CalendarIcon,
  DeleteOutline as DeleteIcon,
  ShoppingBag as PosIcon,
  Sell as LooseIcon
} from "@mui/icons-material";
import {
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import Receipt from "../POS/Receipt";
import RefundDialog from "../Refund/RefundDialog";
import { getRefundStatus, getStatusDisplay } from "../../shared/utils/refundStatus";

const SaleHistory = ({ receiptSettings, shopMetadata, printers = [], defaultPrinter = null }) => {
  const [sales, setSales] = useState([]);
  const [looseSales, setLooseSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [saleType, setSaleType] = useState('pos');
  const [deleteLooseId, setDeleteLooseId] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundSale, setRefundSale] = useState(null);

  const timeframes = [
    { label: "Today", getValue: () => getRange("day") },
    { label: "Yesterday", getValue: () => getRange("yesterday") },
    { label: "This Week", getValue: () => getRange("this_week") },
    { label: "Last Week", getValue: () => getRange("last_week") },
    { label: "This Month", getValue: () => getRange("this_month") },
    { label: "Last Month", getValue: () => getRange("last_month") },
    { label: "This Year", getValue: () => getRange("this_year") },
    { label: "Last Year", getValue: () => getRange("last_year") },
    { label: "Custom", getValue: () => null },
  ];

  const getRange = (type) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case "day":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case "yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case "this_week": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      }
      case "last_week": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday - 7, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday - 1, 23, 59, 59, 999);
        break;
      }
      case "this_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case "last_month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case "this_year":
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case "last_year":
        start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      default:
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchSales = async (start, end) => {
    setLoading(true);
    try {
      const [salesRes, looseSalesRes] = await Promise.all([
        api.get("/api/reports", { params: { startDate: start, endDate: end } }),
        api.get("/api/reports/loose-sales", { params: { startDate: start, endDate: end } })
      ]);

      const salesData = salesRes.data.sales || [];
      const looseSalesData = looseSalesRes.data || [];

      setSales(salesData);
      setLooseSales(looseSalesData);

      if (salesData.length > 0) {
        setSelectedSale(salesData[0]);
      } else {
        setSelectedSale(null);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const range = getRange("day");
    fetchSales(range.start, range.end);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't navigate if user is typing in an input field
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (sales.length === 0) return;

      const currentIndex = sales.findIndex((s) => s.id === selectedSale?.id);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, sales.length - 1);
        if (nextIndex !== currentIndex) {
          const nextSale = sales[nextIndex];
          setSelectedSale(nextSale);
          document.getElementById(`sale-row-${nextSale.id}`)?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex !== currentIndex) {
          const prevSale = sales[prevIndex];
          setSelectedSale(prevSale);
          document.getElementById(`sale-row-${prevSale.id}`)?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sales, selectedSale]);

  const handleTabChange = (event) => {
    const newValue = event.target.value;
    setTabValue(newValue);
    if (newValue < 8) {
      const range = timeframes[newValue].getValue();
      fetchSales(range.start, range.end);
    }
  };

  const handleApplyCustomRange = () => {
    if (dateRange.startDate && dateRange.endDate) {
      const [sy, sm, sd] = dateRange.startDate.split('-').map(Number);
      const [ey, em, ed] = dateRange.endDate.split('-').map(Number);

      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      fetchSales(start.toISOString(), end.toISOString());
    }
  };

  const handlePrintReceipt = (sale) => {
    flushSync(() => {
      setSelectedSale(sale);
    });

    if (receiptSettings?.directPrint && window.electron) {
      const rawPrinter = receiptSettings?.printerType;
      const isValidPrinter = rawPrinter && printers.some(p => p.name === rawPrinter);
      const printer = isValidPrinter ? rawPrinter : (defaultPrinter || (printers.find(p => p.isDefault) || printers[0])?.name);
      window.electron.ipcRenderer.send('print-manual', { printerName: printer });
    } else {
      window.print();
    }
  };

  const handleRefund = (sale) => {
    setRefundSale(sale);
    setShowRefundDialog(true);
  };

  const handleRefundSuccess = () => {
    // Refresh the sales list based on current timeframe
    if (tabValue < 8) {
      const range = timeframes[tabValue].getValue();
      fetchSales(range.start, range.end);
    } else if (dateRange.startDate && dateRange.endDate) {
      handleApplyCustomRange();
    }
  };

  const handleDeleteLooseSale = async () => {
    if (!deleteLooseId) return;
    try {
      await api.delete(`/api/loose-sales/${deleteLooseId}`);
      setDeleteLooseId(null);
      // Refresh
      if (tabValue < 8) {
        const range = timeframes[tabValue].getValue();
        fetchSales(range.start, range.end);
      } else {
        handleApplyCustomRange();
      }
    } catch (error) {
      console.error("Failed to delete loose sale:", error);
    }
  };

  const handleSaleTypeChange = (event, newType) => {
    if (newType !== null) {
      setSaleType(newType);
      // Reset selected item when switching tabs
      if (newType === 'pos') {
        setSelectedSale(sales[0] || null);
      } else {
        setSelectedSale(looseSales[0] || null);
      }
    }
  };


  const calculateStats = (sale) => {
    if (!sale) return { total: 0, mrpDiscount: 0, extraDiscount: 0, discountPercent: 0 };

    // Calculate MRP discount (sum of item-level MRP discounts)
    let mrpDiscount = 0;
    sale.items?.forEach(item => {
      const mrp = item.mrp || item.sellingPrice;
      mrpDiscount += (mrp - item.sellingPrice) * item.quantity;
    });

    // Extra discount is from the sale level
    const extraDiscount = sale.extraDiscount || 0;

    // Total discount
    const totalDiscount = mrpDiscount + extraDiscount;

    // Subtotal (sum of all item MRP)
    let subtotal = 0;
    sale.items?.forEach(item => {
      const mrp = item.mrp || item.sellingPrice;
      subtotal += mrp * item.quantity;
    });

    const discountPercent = subtotal > 0 ? ((totalDiscount / subtotal) * 100).toFixed(2) : 0;

    return {
      total: sale.netTotalAmount || sale.totalAmount,
      mrpDiscount: mrpDiscount,
      extraDiscount: extraDiscount,
      totalDiscount: totalDiscount,
      discountPercent,
    };
  };

  const stats = calculateStats(selectedSale);

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
        className="no-print"
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
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}
            >
              Sale History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage past transactions and receipts.
            </Typography>
          </Box>
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
            <ToggleButtonGroup
              value={saleType}
              exclusive
              onChange={handleSaleTypeChange}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}
            >
              <ToggleButton value="pos" sx={{ px: 2, gap: 1, fontWeight: 700 }}>
                <PosIcon fontSize="small" />
                POS Sales
              </ToggleButton>
              <ToggleButton value="loose" sx={{ px: 2, gap: 1, fontWeight: 700 }}>
                <LooseIcon fontSize="small" />
                Loose Sales
              </ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 150 }}>

              <InputLabel>Time Frame</InputLabel>
              <Select
                value={tabValue}
                label="Time Frame"
                onChange={handleTabChange}
              >
                {timeframes.map((tf, idx) => (
                  <MenuItem key={idx} value={idx}>{tf.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {tabValue === 8 && (
              <>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={dateRange.startDate || ""}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      startDate: e.target.value,
                    })
                  }
                />
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={dateRange.endDate || ""}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      endDate: e.target.value,
                    })
                  }
                />
                <Button
                  variant="outlined"
                  onClick={handleApplyCustomRange}
                  sx={{ height: 40 }}
                >
                  Apply
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Paper>

      <Container
        disableGutters
        maxWidth={false}
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pt: 0,
          px: 3,
          pb: 3,
        }}
      >
        {loading ? (
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
          <Grid
            container
            spacing={2}
            wrap="nowrap"
            className="no-print"
            sx={{ flex: 1, minHeight: 0, overflow: "hidden", flexWrap: "nowrap" }}
          >
            {/* Left Panel: Sales List */}
            <Grid
              item
              xs={saleType === 'pos' ? 6 : 12}
              md={saleType === 'pos' ? 6 : 12}
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                minWidth: 0,
                flexBasis: saleType === 'pos' ? "50%" : "100%",
                maxWidth: saleType === 'pos' ? "50%" : "100%",
                transition: "all 0.3s ease",
              }}
            >
              <Paper
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderBottom: "1px solid #eee",
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {saleType === 'pos' ? 'Sales' : 'Loose Sales'} ({saleType === 'pos' ? sales.length : looseSales.length})
                  </Typography>
                  <Chip
                    label={(() => {
                      const posTotal = sales.reduce((sum, s) => sum + (s.netTotalAmount || 0), 0);
                      const looseTotal = looseSales.reduce((sum, ls) => sum + (ls.price || 0), 0);
                      const combinedTotal = posTotal + looseTotal;

                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#1b5e20' }}>
                            Total Sales: ₹{combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#64748b' }}>=</Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1565c0' }}>
                            {posTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#64748b' }}>+</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#ef6c00' }}>
                              {looseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Typography>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#f57c00', ml: 0.5, opacity: 0.9 }}>
                              (Loose sale)
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })()}
                    sx={{
                      height: 'auto',
                      py: 1.5,
                      px: 2,
                      bgcolor: '#f1f8e9',
                      border: '2px solid #a5d6a7',
                      borderRadius: 3,
                      '& .MuiChip-label': {
                        p: 0
                      }
                    }}
                  />
                </Box>
                <TableContainer sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            bgcolor: "#f8fafc",
                            minWidth: 150,
                          }}
                        >
                          {saleType === 'pos' ? 'ORDER ID' : 'ITEM NAME / NOTES'}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            bgcolor: "#f8fafc",
                            minWidth: 130,
                          }}
                        >
                          DATE & TIME
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            bgcolor: "#f8fafc",
                            minWidth: 100,
                          }}
                        >
                          AMOUNT
                        </TableCell>
                        {saleType === 'pos' && (
                          <>
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "#f8fafc",
                                minWidth: 100,
                              }}
                            >
                              PAYMENT
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "#f8fafc",
                                minWidth: 110,
                              }}
                            >
                              STATUS
                            </TableCell>
                          </>
                        )}
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 800,
                            bgcolor: "#f8fafc",
                            minWidth: 100,
                          }}
                        >
                          ACTIONS
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {saleType === 'pos' ? (
                        sales.map((sale) => (
                          <TableRow
                            key={sale.id}
                            id={`sale-row-${sale.id}`}
                            hover
                            selected={selectedSale?.id === sale.id}
                            onClick={() => setSelectedSale(sale)}
                            sx={{
                              cursor: "pointer",
                              "&.Mui-selected": {
                                bgcolor: "#e3f2fd",
                              },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>ORD-{sale.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {new Date(sale.createdAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                                  borderColor: sale.paymentMethod === 'Cash' ? '#16a34a' : '#cbd5e1'
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
                                <IconButton size="small" onClick={() => handlePrintReceipt(sale)} color="success">
                                  <PrintIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleRefund(sale)} color="error">
                                  <RefundIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        looseSales.map((sale) => (
                          <TableRow
                            key={sale.id}
                            id={`sale-row-${sale.id}`}
                            hover
                            selected={selectedSale?.id === sale.id}
                            onClick={() => setSelectedSale(sale)}
                            sx={{
                              cursor: "pointer",
                              "&.Mui-selected": {
                                bgcolor: "#fff3e0",
                              },
                            }}
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
                                {new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              ₹{sale.price.toFixed(2)}
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <IconButton size="small" color="error" onClick={() => setDeleteLooseId(sale.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
            </Grid>

            {/* Right Panel: Statistics & Products (Only for POS Sales) */}
            {saleType === 'pos' && (
              <Grid
                item
                xs={6}
                md={6}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  minWidth: 0,
                  flexBasis: "50%",
                  maxWidth: "50%",
                }}
              >
                {selectedSale ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      height: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {saleType === 'pos' ? (
                      <>
                        {/* POS Statistics */}
                        <Paper
                          sx={{
                            p: 1.75,
                            borderRadius: 1.5,
                            border: "1px solid #eef2f6",
                            bgcolor: "#ffffff",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "stretch",
                              justifyContent: "space-between",
                              gap: 2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Box sx={{ minWidth: 180 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 800, color: "#1a73e8" }}
                              >
                                Order ORD-{selectedSale.id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {new Date(selectedSale.createdAt).toLocaleDateString()} {new Date(selectedSale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b" }}>
                                  Items: {selectedSale.items.reduce((sum, item) => sum + item.quantity, 0)}
                                </Typography>
                                <Chip
                                  label={selectedSale.paymentMethod || 'Cash'}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 20,
                                    fontWeight: 700,
                                    fontSize: '0.65rem',
                                    color: selectedSale.paymentMethod === 'Cash' ? '#16a34a' : '#1e293b',
                                    borderColor: selectedSale.paymentMethod === 'Cash' ? '#16a34a' : '#cbd5e1'
                                  }}
                                />
                              </Box>
                            </Box>
                            <Box
                              sx={{
                                flex: 1,
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: "#f8fafc",
                                border: "1px solid #eef2f6",
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 700, display: "block" }}
                              >
                                TOTAL VALUE
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 800, color: "#1976d2" }}
                              >
                                ₹{stats.total.toFixed(2)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                flex: 1.4,
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: "#fff5f5",
                                border: "1px solid #ffe4e6",
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 700, display: "block" }}
                              >
                                TOTAL DISCOUNT
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 800, color: "#d32f2f" }}
                              >
                                ₹{stats.totalDiscount.toFixed(2)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: "#64748b",
                                  display: "block",
                                  whiteSpace: "normal",
                                  lineHeight: 1.2,
                                  mt: 0.5
                                }}
                              >
                                ₹{stats.mrpDiscount.toFixed(2)} MRP + ₹{stats.extraDiscount.toFixed(2)} Extra · {stats.discountPercent}% of MRP
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>

                        {/* Products List */}
                        <Paper
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                          }}
                        >
                          <Box sx={{ p: 2, borderBottom: "1px solid #eee", flexShrink: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              Products ({selectedSale.items.length})
                            </Typography>
                          </Box>
                          <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 800, bgcolor: "#f8fafc" }}>PRODUCT</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: "#f8fafc" }}>QTY</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: "#f8fafc" }}>MRP</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: "#f8fafc" }}>PRICE</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: "#f8fafc" }}>MRP DISCOUNT</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: "#f8fafc" }}>EXTRA DISCOUNT</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {selectedSale.items.map((item) => {
                                  const mrp = item.mrp || item.sellingPrice;
                                  const itemDiscount = mrp - item.sellingPrice;
                                  const itemDiscountPercent = mrp > 0 ? ((itemDiscount / mrp) * 100).toFixed(1) : 0;
                                  const returnedQty = item.returnedQuantity || 0;

                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell sx={{ fontWeight: 600 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <span>{item.productName}</span>
                                          {returnedQty > 0 && (
                                            <Chip
                                              label={returnedQty === item.quantity ? "Refunded" : "Returned"}
                                              size="small"
                                              sx={{
                                                bgcolor: returnedQty === item.quantity ? "#ffebee" : "#e8f5e9",
                                                color: returnedQty === item.quantity ? "#d32f2f" : "#2e7d32",
                                                fontWeight: 700,
                                                fontSize: "0.7rem",
                                              }}
                                            />
                                          )}
                                        </Box>
                                      </TableCell>
                                      <TableCell align="center">{item.quantity}</TableCell>
                                      <TableCell align="right">₹{mrp.toFixed(2)}</TableCell>
                                      <TableCell align="right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                                      <TableCell align="right">
                                        <Box>
                                          <Typography variant="body2" sx={{ color: "#d32f2f", fontWeight: 700 }}>
                                            ₹{itemDiscount.toFixed(2)}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            ({itemDiscountPercent}%)
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" sx={{ color: "#d32f2f", fontWeight: 700 }}>
                                          ₹0.00
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      </>
                    ) : (
                      <>
                        {/* Loose Sale Detail */}
                        <Paper
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            border: "1px solid #fff3e0",
                            bgcolor: "#fffbf2",
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: "#e65100" }}>
                                Loose Sale Details
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                TRANSACTION ID: LOO-{selectedSale.id}
                              </Typography>
                            </Box>
                            <Chip label="One-time Sale" color="warning" size="small" sx={{ fontWeight: 700 }} />
                          </Box>

                          <Divider sx={{ mb: 3 }} />

                          <Grid container spacing={4}>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>ITEM DESCRIPTION / NOTES</Typography>
                              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                                {selectedSale.itemName || 'Untitled Loose Item'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>DATE</Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {new Date(selectedSale.createdAt).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>TIME</Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {new Date(selectedSale.createdAt).toLocaleTimeString()}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ mt: 'auto', pt: 4 }}>
                            <Paper sx={{ p: 3, bgcolor: '#e65100', color: 'white', borderRadius: 2 }}>
                              <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 700 }}>TOTAL AMOUNT PAID</Typography>
                              <Typography variant="h3" sx={{ fontWeight: 900 }}>
                                ₹{selectedSale.price.toFixed(2)}
                              </Typography>
                            </Paper>

                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setDeleteLooseId(selectedSale.id)}
                                sx={{ fontWeight: 700, borderWeight: 2 }}
                              >
                                Delete This Transaction
                              </Button>
                            </Box>
                          </Box>
                        </Paper>
                      </>
                    )}
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      border: '2px dashed #e2e8f0',
                      bgcolor: '#f8fafc',
                      borderRadius: 3
                    }}
                  >
                    <Box>
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No Transaction Selected
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Select a {saleType === 'pos' ? 'POS' : 'loose'} sale from the list to view its full details.
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </Grid>
            )}
          </Grid>
        )}

        {/* Hidden Print Container for Direct Printing in Sale History */}
        <Box sx={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          height: 0,
          overflow: 'hidden',
          '@media print': {
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: 'auto',
            overflow: 'visible',
            display: 'block',
            zIndex: 9999
          }
        }}>
          <div id="thermal-receipt-print">
            {selectedSale && (
              <Receipt
                sale={selectedSale}
                settings={receiptSettings || {
                  shopName: true,
                  header: true,
                  footer: true,
                  mrp: true,
                  price: true,
                  discount: true,
                  totalValue: true,
                  productName: true,
                  exp: true,
                  barcode: true,
                  totalSavings: true,
                  customShopName: localStorage.getItem("posShopName") || "Bachat Bazaar",
                  customHeader: "123 Business Street, City",
                  customFooter: "Thank You! Visit Again",
                }}
                shopMetadata={shopMetadata}
              />
            )}
          </div>
        </Box>

        {/* Refund Dialog */}
        <RefundDialog
          open={showRefundDialog}
          onClose={() => setShowRefundDialog(false)}
          sale={refundSale}
          onRefundSuccess={handleRefundSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={Boolean(deleteLooseId)}
          onClose={() => setDeleteLooseId(null)}
          PaperProps={{
            sx: { borderRadius: 3, p: 1 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DeleteIcon color="error" />
            Delete Loose Sale?
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontWeight: 500 }}>
              Are you sure you want to permanently delete this loose sale record (LOO-{deleteLooseId})?
              This action cannot be undone and will be removed from all financial reports.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setDeleteLooseId(null)}
              variant="outlined"
              color="inherit"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLooseSale}
              variant="contained"
              color="error"
              sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}
            >
              Yes, Delete Record
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};

export default SaleHistory;
