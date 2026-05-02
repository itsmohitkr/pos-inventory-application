import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from '@/domains/reporting/components/ExportOptions';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';

const LowStockReportPanel = ({ data, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedItems, setSelectedItems] = useState([]);

  const categories = useMemo(() => {
    if (!data) return [];
    const uniqueCategories = new Set(data.map((p) => p.category).filter(Boolean));
    return ['All Categories', ...Array.from(uniqueCategories).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (selectedCategory === 'All Categories') return data;
    return data.filter((p) => p.category === selectedCategory);
  }, [data, selectedCategory]);

  const handleToggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(filteredData.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const { items: sortedData } = useSortableTable(filteredData, {
    key: 'totalQuantity',
    direction: 'asc',
  });

  const handleExportPDF = () => {
    const itemsToExport =
      selectedItems.length > 0
        ? filteredData.filter((item) => selectedItems.includes(item.id))
        : filteredData;

    if (itemsToExport.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Vendor Order List (Low Stock)', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Category: ${selectedCategory}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = ['S.No', 'Product Name', 'Category', 'MRP (₹)', 'Current Stock'];
    const tableRows = itemsToExport.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.category || 'Uncategorized',
      item.mrp?.toFixed(2) || '0.00',
      item.totalQuantity.toString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save(`vendor_order_${selectedCategory.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handlePrint = () => {
    if (selectedItems.length > 0) {
      handleExportPDF();
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary">Loading low stock data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      className="report-print-area"
      sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <Box
          className="no-print"
          sx={{
            p: 2,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              Low Stock Report
              <Box
                component="span"
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'primary.main',
                  bgcolor: 'primary.lighter',
                  px: 1,
                  borderRadius: 1,
                }}
              >
                ({filteredData.length})
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Products currently below their minimum inventory threshold
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Filter Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <ExportOptions
              onExportPDF={handleExportPDF}
              onPrint={handlePrint}
              selectedCount={selectedItems.length}
            />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1000, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    bgcolor: '#f1f5f9',
                    py: 1.2,
                    borderBottom: '2px solid #e2e8f0',
                    width: '35px',
                  }}
                >
                  <Checkbox
                    size="small"
                    indeterminate={
                      selectedItems.length > 0 && selectedItems.length < filteredData.length
                    }
                    checked={
                      filteredData.length > 0 && selectedItems.length === filteredData.length
                    }
                    onChange={handleSelectAll}
                    sx={{ p: 0.5 }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: '#334155',
                    bgcolor: '#f1f5f9',
                    py: 1.5,
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '0.8rem',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    width: '35px',
                  }}
                >
                  S.NO
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: '#334155',
                    bgcolor: '#f1f5f9',
                    py: 1.5,
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '0.8rem',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    width: '45%',
                  }}
                >
                  PRODUCT
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: '#334155',
                    bgcolor: '#f1f5f9',
                    py: 1.5,
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '0.8rem',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    width: '10%',
                  }}
                >
                  CATEGORY
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: '#334155',
                    bgcolor: '#f1f5f9',
                    py: 1.5,
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '0.8rem',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    width: '10%',
                  }}
                  align="right"
                >
                  MRP (₹)
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: '#334155',
                    bgcolor: '#f1f5f9',
                    py: 1.5,
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '0.8rem',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    width: '10%',
                  }}
                  align="center"
                >
                  STOCK
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: '#334155',
                    bgcolor: '#f1f5f9',
                    py: 1.5,
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '0.8rem',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    width: '12%',
                  }}
                  align="center"
                >
                  STATUS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No products are currently low on stock.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((item, index) => {
                  const isItemSelected = selectedItems.includes(item.id);
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      selected={isItemSelected}
                      onClick={() => handleToggleSelect(item.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {item.category || 'Uncategorized'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        ₹{item.mrp?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: item.totalQuantity === 0 ? '#d32f2f' : '#ed6c02',
                          }}
                        >
                          {item.totalQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.totalQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: item.totalQuantity === 0 ? '#fef2f2' : '#fff7ed',
                            color: item.totalQuantity === 0 ? '#991b1b' : '#9a3412',
                            border: `1px solid ${item.totalQuantity === 0 ? '#fee2e2' : '#ffedd5'}`,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default LowStockReportPanel;
