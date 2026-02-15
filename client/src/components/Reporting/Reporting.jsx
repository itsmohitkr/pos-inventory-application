import React, { useState, useEffect } from "react";
import axios from "axios";
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
} from "@mui/material";
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

// Sub-components
import SalesHistory from "./SalesHistory";
import AnalyticsPanel from "./AnalyticsPanel";
import { getRefundStatus, getStatusDisplay } from "../../utils/refundStatus";
import { Tabs, Tab, Paper } from "@mui/material";

const Reporting = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

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

  const fetchReports = async (start, end) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/reports", {
        params: { startDate: start, endDate: end },
      });
      setReportData(res.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    const range = getRange("day");
    fetchReports(range.start, range.end);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue < 4) {
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
        sx={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        {loading && !reportData ? (
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
          <Grid container sx={{ flex: 1 }}>
            {/* Left Half: Detailed Sales History */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", flexDirection: "column", maxWidth: "50%" }}
            >
              <SalesHistory
                sales={reportData?.sales}
                timeframeLabel={timeframes[tabValue].label}
                onSelectSale={setSelectedSale}
              />
            </Grid>

            {/* Right Half: Analytics & Controls */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", flexDirection: "column", maxWidth: "50%" }}
            >
              <AnalyticsPanel
                reportData={reportData}
                loading={loading}
              />
            </Grid>
          </Grid>
        )}

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
                            size="small"
                            sx={{
                              bgcolor: display.bgcolor,
                              color: display.color,
                              fontWeight: 700,
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
      </Container>
    </Box>
  );
};

export default Reporting;
