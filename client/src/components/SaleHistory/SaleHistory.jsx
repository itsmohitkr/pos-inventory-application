import React, { useState, useEffect } from "react";
import api from '../../api';
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Tabs,
  Tab,
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
} from "@mui/icons-material";
import Receipt from "../POS/Receipt";
import RefundDialog from "../Refund/RefundDialog";
import { getRefundStatus, getStatusDisplay } from "../../utils/refundStatus";

const SaleHistory = () => {
  const [sales, setSales] = useState([]);
  const [looseSales, setLooseSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [autoPrint, setAutoPrint] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundSale, setRefundSale] = useState(null);

  const timeframes = [
    { label: "Today", getValue: () => getRange("day") },
    { label: "Yesterday", getValue: () => getRange("yesterday") },
    { label: "This Week", getValue: () => getRange("week") },
    { label: "This Month", getValue: () => getRange("month") },
    { label: "Custom", getValue: () => null },
  ];

  const getRange = (type) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

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
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
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
    if (autoPrint && selectedSale) {
      const timer = setTimeout(() => {
        window.print();
        setAutoPrint(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, selectedSale]);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue < 4) {
      const range = timeframes[newValue].getValue();
      fetchSales(range.start, range.end);
    }
  };

  const handleApplyCustomRange = () => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchSales(dateRange.startDate, dateRange.endDate);
    }
  };

  const handlePrintReceipt = (sale) => {
    setSelectedSale(sale);
    setAutoPrint(true);
  };

  const handleRefund = (sale) => {
    setRefundSale(sale);
    setShowRefundDialog(true);
  };

  const handleRefundSuccess = () => {
    // Refresh the sales list based on current timeframe
    if (tabValue < 4) {
      const range = timeframes[tabValue].getValue();
      fetchSales(range.start, range.end);
    } else if (dateRange.startDate && dateRange.endDate) {
      fetchSales(dateRange.startDate, dateRange.endDate);
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
            Sale History
          </Typography>
          <Box sx={{ minWidth: 280, display: "flex", justifyContent: "flex-end" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtonsDisplay="auto"
            >
              {timeframes.map((tf, idx) => (
                <Tab key={idx} label={tf.label} />
              ))}
            </Tabs>
          </Box>
        </Box>
        {tabValue === 4 && (
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
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          p: 3,
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
            spacing={3}
            wrap="nowrap"
            sx={{ flex: 1, minHeight: 0, overflow: "hidden", flexWrap: "nowrap" }}
          >
            {/* Left Panel: Sales List */}
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
                    Sales ({sales.length})
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
                            minWidth: 80,
                          }}
                        >
                          ORDER ID
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
                      {sales.map((sale) => (
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
                          <TableCell sx={{ fontWeight: 600 }}>
                            ORD-{sale.id}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(sale.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{sale.netTotalAmount.toFixed(2)}
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
                          <TableCell
                            align="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handlePrintReceipt(sale)}
                              sx={{ color: "#2e7d32", mr: 1 }}
                            >
                              <PrintIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRefund(sale)}
                              sx={{ color: "#d32f2f" }}
                            >
                              <RefundIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                            <Typography variant="body1" color="text.secondary">
                              No sales found for this period
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Right Panel: Statistics & Products */}
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
                  {/* Statistics Cards */}
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
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", display: 'block', mt: 0.5 }}>
                          Total Items: {selectedSale.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </Typography>
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
                          color="text.secondary"
                          sx={{ display: "block", whiteSpace: "nowrap" }}
                        >
                          {`₹${stats.mrpDiscount.toFixed(2)} MRP + ₹${stats.extraDiscount.toFixed(2)} Extra · ${stats.discountPercent}% of MRP`}
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
                    <Box
                      sx={{
                        p: 2,
                        borderBottom: "1px solid #eee",
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Products ({selectedSale.items.length})
                      </Typography>
                    </Box>
                    <TableContainer sx={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                fontWeight: 800,
                                bgcolor: "#f8fafc",
                                minWidth: 120,
                              }}
                            >
                              PRODUCT
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "#f8fafc",
                                minWidth: 50,
                              }}
                            >
                              QTY
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "#f8fafc",
                                minWidth: 70,
                              }}
                            >
                              MRP
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "#f8fafc",
                                minWidth: 70,
                              }}
                            >
                              PRICE
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "#f8fafc",
                                minWidth: 90,
                              }}
                            >
                              MRP DISCOUNT
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "#f8fafc",
                                minWidth: 90,
                              }}
                            >
                              EXTRA DISCOUNT
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedSale.items.map((item) => {
                            const mrp = item.mrp || item.sellingPrice;
                            const itemDiscount = mrp - item.sellingPrice;
                            const discountPercent =
                              mrp > 0
                                ? ((itemDiscount / mrp) * 100).toFixed(1)
                                : 0;
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
                                  ₹{mrp.toFixed(2)}
                                </TableCell>
                                <TableCell align="right">
                                  ₹{item.sellingPrice.toFixed(2)}
                                </TableCell>
                                <TableCell align="right">
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "#d32f2f", fontWeight: 700 }}
                                    >
                                      ₹{itemDiscount.toFixed(2)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      ({discountPercent}%)
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#d32f2f", fontWeight: 700 }}
                                  >
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
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    Select a sale to view details
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}

        {/* Hidden receipt for thermal printing */}
        {autoPrint && selectedSale && (
          <Box
            sx={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              "@media print": {
                position: "static",
                left: "auto",
              },
            }}
          >
            <Receipt
              sale={selectedSale}
              settings={{
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
                customShopName:
                  localStorage.getItem("posShopName") || "Bachat Bazaar",
                customHeader: "123 Business Street, City",
                customFooter: "Thank You! Visit Again",
              }}
            />
          </Box>
        )}

        {/* Refund Dialog */}
        <RefundDialog
          open={showRefundDialog}
          onClose={() => setShowRefundDialog(false)}
          sale={refundSale}
          onRefundSuccess={handleRefundSuccess}
        />
      </Container>
    </Box>
  );
};

export default SaleHistory;
