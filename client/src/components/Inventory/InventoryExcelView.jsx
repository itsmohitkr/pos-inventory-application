import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  TableSortLabel,
  Slide,
  Container,
  Chip,
  Popover,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  ViewColumn as ViewColumnIcon,
  FilterAlt as FilterAltIcon,
} from '@mui/icons-material';
import inventoryService from '../../shared/api/inventoryService';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const InventoryExcelView = ({ open, onClose, categoryFilter = 'all', externalSearch = '' }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Column Visibility State
  const [cols, setCols] = useState({
    sno: true,
    name: true,
    stockStatus: true,
    batchCode: true,
    category: true,
    mrp: true,
    sp: true,
    cp: true,
    profitRs: true,
    discRsVendor: true,
    discPctVendor: false,
    discRsCust: true,
    discPctCust: false,
    marginPct: true,
    barcode: true,
    expiry: true,
    wsPrice: false,
    wsMinQty: false,
    lowStockEnabled: true,
    batchTrackingEnabled: true,
    stock: true,
    totalValCp: true,
    totalValSp: true,
    createdAt: true,
  });
  const [colAnchorEl, setColAnchorEl] = useState(null);

  // Spreadsheet Sorting Enhancements
  const [sortConfigs, setSortConfigs] = useState([{ key: 'name', direction: 'asc' }]);

  // Active Category Filter for Spreadsheet
  const [localCategoryFilter, setLocalCategoryFilter] = useState('all');
  // Using a derived unique categories list from fetched data
  const uniqueCategories = useMemo(() => {
    const catSet = new Set(products.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(catSet).sort()];
  }, [products]);

  const fetchData = useCallback(async () => {
    try {
      const data = await inventoryService.fetchProducts({
        includeBatches: 'true',
        category: categoryFilter,
        search: externalSearch,
      });
      setProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      // Fetch complete
    }
  }, [categoryFilter, externalSearch]);

  useEffect(() => {
    if (open) {
      setSearchTerm(externalSearch);
      fetchData();
    }
  }, [open, externalSearch, fetchData]);

  const flatData = useMemo(() => {
    const rows = [];

    // Apply the local category filter before flattening
    const filteredProducts =
      localCategoryFilter === 'all'
        ? products
        : products.filter((p) => p.category === localCategoryFilter);

    filteredProducts.forEach((product) => {
      if (product.batches && product.batches.length > 0) {
        product.batches.forEach((batch) => {
          // Vendor gave to Me: MRP - Cost Price
          const discRsVendor = Math.max(0, batch.mrp - batch.costPrice);
          const discPctVendor = batch.mrp > 0 ? (discRsVendor / batch.mrp) * 100 : 0;

          // Me gave to Customer (Shop context): MRP - Selling Price
          const discRsCust = Math.max(0, batch.mrp - batch.sellingPrice);
          const discPctCust = batch.mrp > 0 ? (discRsCust / batch.mrp) * 100 : 0;

          // Categorical Stock Status
          let stockStatus = 'In Stock';
          if (batch.quantity <= 0) stockStatus = 'Out of Stock';
          else if (batch.quantity <= (product.minStockLevel || 5)) stockStatus = 'Low Stock';

          const marginPct =
            batch.sellingPrice > 0
              ? ((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100
              : 0;

          rows.push({
            id: `${product.id}-${batch.id}`,
            name: product.name,
            stockStatus: stockStatus,
            batchCode: batch.batchCode || 'N/A',
            category: product.category || 'Uncategorized',
            mrp: batch.mrp,
            sp: batch.sellingPrice,
            cp: batch.costPrice,
            profitRs: batch.sellingPrice - batch.costPrice,
            discRsVendor: discRsVendor,
            discPctVendor: discPctVendor,
            discRsCust: discRsCust,
            discPctCust: discPctCust,
            marginPct: marginPct,
            barcode: product.barcode || 'N/A',
            expiry: batch.expiryDate,
            wsPrice: batch.wholesalePrice,
            wsMinQty: batch.wholesaleMinQty,
            lowStockEnabled: product.lowStockWarningEnabled,
            batchTrackingEnabled: product.batchTrackingEnabled,
            stock: batch.quantity,
            totalValCp: batch.quantity * batch.costPrice,
            totalValSp: batch.quantity * batch.sellingPrice,
            createdAt: batch.createdAt || product.createdAt || 'N/A',
          });
        });
      } else {
        // Product with no batches
        rows.push({
          id: `${product.id}-none`,
          name: product.name,
          stockStatus: 'Out of Stock',
          batchCode: 'N/A',
          category: product.category || 'Uncategorized',
          mrp: 0,
          sp: 0,
          cp: 0,
          profitRs: 0,
          discRsVendor: 0,
          discPctVendor: 0,
          discRsCust: 0,
          discPctCust: 0,
          marginPct: 0,
          barcode: product.barcode || 'N/A',
          wsPrice: null,
          wsMinQty: null,
          lowStockEnabled: product.lowStockWarningEnabled,
          batchTrackingEnabled: product.batchTrackingEnabled,
          stock: 0,
          totalValCp: 0,
          totalValSp: 0,
          createdAt: product.createdAt || 'N/A',
        });
      }
    });
    return rows;
  }, [products, localCategoryFilter]);

  const filteredAndSortedData = useMemo(() => {
    let result = flatData;

    // Applying Filter
    if (searchTerm && searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      const namePrefix = [];
      const barcodePrefix = [];
      const nameContains = [];
      const barcodeContains = [];

      for (const row of flatData) {
        const name = (row.name || '').toLowerCase();
        const barcodes =
          row.barcode && row.barcode !== 'N/A'
            ? row.barcode
              .toLowerCase()
              .split('|')
              .map((b) => b.trim())
            : [];

        if (name.startsWith(query)) {
          namePrefix.push(row);
        } else if (barcodes.some((b) => b.startsWith(query))) {
          barcodePrefix.push(row);
        } else if (name.includes(query)) {
          nameContains.push(row);
        } else if (barcodes.some((b) => b.includes(query))) {
          barcodeContains.push(row);
        }
      }
      result = [...namePrefix, ...barcodePrefix, ...nameContains, ...barcodeContains];
    }

    // Applying Multi-column Sort
    if (sortConfigs.length > 0) {
      result.sort((a, b) => {
        for (let config of sortConfigs) {
          let valA = a[config.key];
          let valB = b[config.key];

          // Handle strings for case-insensitive sort
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();

          const isDesc = config.direction === 'desc';

          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
        }
        return 0; // if all match
      });
    }

    return result;
  }, [flatData, searchTerm, sortConfigs]);

  const totals = useMemo(() => {
    const totalStock = filteredAndSortedData.reduce((sum, row) => sum + row.stock, 0);
    const totalValueCost = filteredAndSortedData.reduce((sum, row) => sum + row.stock * row.cp, 0);
    const totalValueSelling = filteredAndSortedData.reduce(
      (sum, row) => sum + row.stock * row.sp,
      0
    );
    const totalValueMrp = filteredAndSortedData.reduce(
      (sum, row) => sum + row.stock * (row.mrp || row.sp),
      0
    );

    return {
      totalStock: totalStock,
      avgSp: totalStock > 0 ? totalValueSelling / totalStock : 0,
      avgCp: totalStock > 0 ? totalValueCost / totalStock : 0,
      avgDiscRsVendor: totalStock > 0 ? (totalValueMrp - totalValueCost) / totalStock : 0,
      avgDiscPctVendor:
        totalValueMrp > 0 ? ((totalValueMrp - totalValueCost) / totalValueMrp) * 100 : 0,
      avgDiscRsCust: totalStock > 0 ? (totalValueMrp - totalValueSelling) / totalStock : 0,
      avgDiscPctCust:
        totalValueMrp > 0 ? ((totalValueMrp - totalValueSelling) / totalValueMrp) * 100 : 0,
      avgMargin:
        totalValueSelling > 0
          ? ((totalValueSelling - totalValueCost) / totalValueSelling) * 100
          : 0,
      avgWsPrice:
        filteredAndSortedData.length > 0
          ? filteredAndSortedData.reduce((sum, row) => sum + (row.wsPrice || 0), 0) /
          filteredAndSortedData.length
          : 0,
      totalValueCost: totalValueCost,
      totalValueSelling: totalValueSelling,
    };
  }, [filteredAndSortedData]);

  const handleSort = (property, event) => {
    const isShift = event?.shiftKey;

    setSortConfigs((prev) => {
      const existingIdx = prev.findIndex((c) => c.key === property);

      if (isShift) {
        // Multi-sort toggle
        if (existingIdx >= 0) {
          const currentDir = prev[existingIdx].direction;
          if (currentDir === 'asc') {
            return [
              ...prev.slice(0, existingIdx),
              { key: property, direction: 'desc' },
              ...prev.slice(existingIdx + 1),
            ];
          } else {
            return prev.filter((_, idx) => idx !== existingIdx);
          }
        } else {
          return [...prev, { key: property, direction: 'asc' }];
        }
      } else {
        // Single sort toggle
        if (existingIdx >= 0 && prev.length === 1) {
          return [{ key: property, direction: prev[0].direction === 'asc' ? 'desc' : 'asc' }];
        }
        return [{ key: property, direction: 'asc' }];
      }
    });
  };

  const handleExportCSV = () => {
    const headers = [];
    if (cols.sno) headers.push('S.No');
    if (cols.name) headers.push('Name');
    if (cols.stockStatus) headers.push('Status');
    if (cols.batchCode) headers.push('Batch Code');
    if (cols.category) headers.push('Category');
    if (cols.mrp) headers.push('MRP');
    if (cols.sp) headers.push('Selling Price');
    if (cols.cp) headers.push('Cost Price');
    if (cols.profitRs) headers.push('Profit Unit(Rs)');
    if (cols.discRsVendor) headers.push('Disc Vendor(Rs)');
    if (cols.discPctVendor) headers.push('Disc Vendor(%)');
    if (cols.discRsCust) headers.push('Disc Cust(Rs)');
    if (cols.discPctCust) headers.push('Disc Cust(%)');
    if (cols.marginPct) headers.push('Margin(%)');
    if (cols.barcode) headers.push('Barcode');
    if (cols.expiry) headers.push('Expiry');
    if (cols.wsPrice) headers.push('WS Price');
    if (cols.wsMinQty) headers.push('WS Min Qty');
    if (cols.stock) headers.push('Stock');
    if (cols.totalValCp) headers.push('Total Value (Cost)');
    if (cols.totalValSp) headers.push('Total Rev (Selling)');
    if (cols.createdAt) headers.push('Added On');

    const csvContent = [
      headers.join(','),
      ...filteredAndSortedData.map((row, idx) => {
        const rowData = [];
        if (cols.sno) rowData.push(idx + 1);
        if (cols.name) rowData.push(`"${row.name}"`);
        if (cols.stockStatus) rowData.push(`"${row.stockStatus}"`);
        if (cols.batchCode) rowData.push(`"${row.batchCode}"`);
        if (cols.category) rowData.push(`"${row.category}"`);
        if (cols.mrp) rowData.push(row.mrp);
        if (cols.sp) rowData.push(row.sp);
        if (cols.cp) rowData.push(row.cp);
        if (cols.profitRs) rowData.push(row.profitRs.toFixed(2));
        if (cols.discRsVendor) rowData.push(row.discRsVendor.toFixed(2));
        if (cols.discPctVendor) rowData.push(row.discPctVendor.toFixed(2));
        if (cols.discRsCust) rowData.push(row.discRsCust.toFixed(2));
        if (cols.discPctCust) rowData.push(row.discPctCust.toFixed(2));
        if (cols.marginPct) rowData.push(row.marginPct.toFixed(2));
        if (cols.barcode) rowData.push(`"${row.barcode}"`);
        if (cols.expiry)
          rowData.push(row.expiry ? new Date(row.expiry).toLocaleDateString() : 'N/A');
        if (cols.wsPrice) rowData.push(row.wsPrice || 0);
        if (cols.wsMinQty) rowData.push(row.wsMinQty || 0);
        if (cols.stock) rowData.push(row.stock);
        if (cols.totalValCp) rowData.push(row.totalValCp.toFixed(2));
        if (cols.totalValSp) rowData.push(row.totalValSp.toFixed(2));
        if (cols.createdAt)
          rowData.push(
            row.createdAt !== 'N/A' ? new Date(row.createdAt).toLocaleDateString() : 'N/A'
          );
        return rowData.join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getExpiryColor = (expiryStr) => {
    if (!expiryStr || expiryStr === 'N/A' || expiryStr === '—') return 'inherit';
    const expDate = new Date(expiryStr);
    const today = new Date();
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '#ffebee'; // Expired (Red bg)
    if (diffDays <= 30) return '#fff3e0'; // Expiring soon (Orange bg)
    return 'inherit';
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
      <style>
        {`
                @media print {
                    @page {
                        size: auto;
                        margin: 10mm;
                    }
                    body {
                        visibility: hidden !important;
                        background: white !important;
                    }
                    .MuiDialog-root,
                    .MuiDialog-root * {
                        visibility: visible !important;
                    }
                    .no-print,
                    .MuiAppBar-root,
                    button,
                    .MuiInputAdornment-root {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    .MuiDialog-container,
                    .MuiDialog-paper {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        overflow: visible !important;
                        height: auto !important;
                        box-shadow: none !important;
                    }
                    .MuiContainer-root {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .MuiTableContainer-root {
                        max-height: none !important;
                        overflow: visible !important;
                        height: auto !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: auto !important;
                    }
                    th, td {
                        word-wrap: break-word !important;
                        white-space: normal !important;
                        font-size: 7.5pt !important;
                        padding: 3px !important;
                        border: 1px solid #000 !important;
                        color: black !important;
                    }
                    th {
                        background-color: #eee !important;
                        -webkit-print-color-adjust: exact;
                        font-weight: bold !important;
                    }
                    .MuiTableHead-root {
                        display: table-header-group !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                    }
                }
                `}
      </style>
      <AppBar className="no-print" sx={{ position: 'relative', bgcolor: '#1a237e' }}>
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6" component="div">
            Full Inventory Spreadsheet View
          </Typography>
          <Button
            color="inherit"
            startIcon={<ViewColumnIcon />}
            onClick={(e) => setColAnchorEl(e.currentTarget)}
            sx={{ mr: 2 }}
          >
            Columns
          </Button>
          <Popover
            open={Boolean(colAnchorEl)}
            anchorEl={colAnchorEl}
            onClose={() => setColAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box
              sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, minWidth: 400 }}
            >
              <Typography
                variant="subtitle2"
                sx={{ gridColumn: '1 / -1', mb: 1, fontWeight: 'bold' }}
              >
                Select Columns to Display
              </Typography>
              {Object.keys(cols).map((col) => (
                <FormControlLabel
                  key={col}
                  control={
                    <Checkbox
                      size="small"
                      checked={cols[col]}
                      onChange={(e) => setCols({ ...cols, [col]: e.target.checked })}
                    />
                  }
                  label={col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                />
              ))}
            </Box>
          </Popover>
          <Button
            color="inherit"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{ mr: 2 }}
          >
            Export CSV
          </Button>
          <Button color="inherit" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={false}
        sx={{ py: 3, bgcolor: '#f8f9fa', minHeight: 'calc(100vh - 48px)' }}
      >
        <Paper
          className="no-print"
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search name, category or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              value={localCategoryFilter}
              onChange={(e) => setLocalCategoryFilter(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ width: 220 }}
            >
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label={`Rows: ${filteredAndSortedData.length}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Total Stock: ${totals.totalStock || 0}`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`Selling Value: ₹${(totals.totalValueSelling || 0).toLocaleString()}`}
              color="info"
              variant="outlined"
            />
            <Chip
              label={`Cost Value: ₹${(totals.totalValueCost || 0).toLocaleString()}`}
              color="warning"
              variant="outlined"
            />
          </Box>
        </Paper>

        <TableContainer
          component={Paper}
          sx={{ maxHeight: 'calc(100vh - 250px)', borderRadius: 2, border: '1px solid #ccc' }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              minWidth: 1200,
              '& .MuiTableCell-root': {
                border: '1px solid #e0e0e0', // Excel-like grid lines
                whiteSpace: 'nowrap', // Prevent wrapping
                padding: '4px 8px', // Condensed row density
              },
              '& .MuiTableRow-root:nth-of-type(odd)': {
                bgcolor: 'rgba(0, 0, 0, 0.02)',
              },
            }}
          >
            <TableHead>
              <TableRow>
                {cols.sno && (
                  <TableCell
                    sx={{
                      bgcolor: '#e8eaf6',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      borderRight: '2px solid #ccc',
                    }}
                  >
                    S.No
                  </TableCell>
                )}
                {cols.name && (
                  <TableCell
                    sx={{
                      bgcolor: '#e8eaf6',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: cols.sno ? 45 : 0,
                      zIndex: 3,
                      borderRight: '2px solid #ccc',
                    }}
                  >
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'name')}
                      direction={sortConfigs.find((c) => c.key === 'name')?.direction || 'asc'}
                      onClick={(e) => handleSort('name', e)}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.stockStatus && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'stockStatus')}
                      direction={
                        sortConfigs.find((c) => c.key === 'stockStatus')?.direction || 'asc'
                      }
                      onClick={(e) => handleSort('stockStatus', e)}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.batchCode && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'batchCode')}
                      direction={sortConfigs.find((c) => c.key === 'batchCode')?.direction || 'asc'}
                      onClick={(e) => handleSort('batchCode', e)}
                    >
                      Batch Code
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.category && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'category')}
                      direction={sortConfigs.find((c) => c.key === 'category')?.direction || 'asc'}
                      onClick={(e) => handleSort('category', e)}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.mrp && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'mrp')}
                      direction={sortConfigs.find((c) => c.key === 'mrp')?.direction || 'asc'}
                      onClick={(e) => handleSort('mrp', e)}
                    >
                      MRP
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.sp && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'sp')}
                      direction={sortConfigs.find((c) => c.key === 'sp')?.direction || 'asc'}
                      onClick={(e) => handleSort('sp', e)}
                    >
                      Selling Price
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.cp && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'cp')}
                      direction={sortConfigs.find((c) => c.key === 'cp')?.direction || 'asc'}
                      onClick={(e) => handleSort('cp', e)}
                    >
                      Cost Price
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.profitRs && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'profitRs')}
                      direction={sortConfigs.find((c) => c.key === 'profitRs')?.direction || 'asc'}
                      onClick={(e) => handleSort('profitRs', e)}
                    >
                      Profit Unit(Rs)
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.discRsVendor && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'discRsVendor')}
                      direction={
                        sortConfigs.find((c) => c.key === 'discRsVendor')?.direction || 'asc'
                      }
                      onClick={(e) => handleSort('discRsVendor', e)}
                    >
                      Disc Vendor(Rs)
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.discPctVendor && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'discPctVendor')}
                      direction={
                        sortConfigs.find((c) => c.key === 'discPctVendor')?.direction || 'asc'
                      }
                      onClick={(e) => handleSort('discPctVendor', e)}
                    >
                      Disc Vendor(%)
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.discRsCust && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'discRsCust')}
                      direction={
                        sortConfigs.find((c) => c.key === 'discRsCust')?.direction || 'asc'
                      }
                      onClick={(e) => handleSort('discRsCust', e)}
                    >
                      Disc Cust(Rs)
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.discPctCust && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'discPctCust')}
                      direction={
                        sortConfigs.find((c) => c.key === 'discPctCust')?.direction || 'asc'
                      }
                      onClick={(e) => handleSort('discPctCust', e)}
                    >
                      Disc Cust(%)
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.marginPct && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'marginPct')}
                      direction={sortConfigs.find((c) => c.key === 'marginPct')?.direction || 'asc'}
                      onClick={(e) => handleSort('marginPct', e)}
                    >
                      Margin (%)
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.barcode && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'barcode')}
                      direction={sortConfigs.find((c) => c.key === 'barcode')?.direction || 'asc'}
                      onClick={(e) => handleSort('barcode', e)}
                    >
                      Barcode
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.expiry && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'expiry')}
                      direction={sortConfigs.find((c) => c.key === 'expiry')?.direction || 'asc'}
                      onClick={(e) => handleSort('expiry', e)}
                    >
                      Expiry
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.wsPrice && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'wsPrice')}
                      direction={sortConfigs.find((c) => c.key === 'wsPrice')?.direction || 'asc'}
                      onClick={(e) => handleSort('wsPrice', e)}
                    >
                      WS Price
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.wsMinQty && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'wsMinQty')}
                      direction={sortConfigs.find((c) => c.key === 'wsMinQty')?.direction || 'asc'}
                      onClick={(e) => handleSort('wsMinQty', e)}
                    >
                      WS Min Qty
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.lowStockEnabled && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'lowStockEnabled')}
                      direction={
                        sortConfigs.find((c) => c.key === 'lowStockEnabled')?.direction || 'asc'
                      }
                      onClick={(e) => handleSort('lowStockEnabled', e)}
                    >
                      Low Stock
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.batchTrackingEnabled && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'batchTrackingEnabled')}
                      direction={
                        sortConfigs.find((c) => c.key === 'batchTrackingEnabled')?.direction ||
                        'asc'
                      }
                      onClick={(e) => handleSort('batchTrackingEnabled', e)}
                    >
                      Batch Tracking
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.stock && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'stock')}
                      direction={sortConfigs.find((c) => c.key === 'stock')?.direction || 'asc'}
                      onClick={(e) => handleSort('stock', e)}
                    >
                      Stock
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.totalValCp && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'totalValCp')}
                      direction={
                        sortConfigs.find((c) => c.key === 'totalValCp')?.direction || 'asc'
                      }
                      onClick={(e) => handleSort('totalValCp', e)}
                    >
                      Total Value (Cost)
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.totalValSp && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'totalValSp')}
                      direction={
                        sortConfigs.find((c) => c.key === 'totalValSp')?.direction || 'asc'
                      }
                      onClick={(e) => handleSort('totalValSp', e)}
                    >
                      Total Rev (Selling)
                    </TableSortLabel>
                  </TableCell>
                )}
                {cols.createdAt && (
                  <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfigs.some((c) => c.key === 'createdAt')}
                      direction={sortConfigs.find((c) => c.key === 'createdAt')?.direction || 'asc'}
                      onClick={(e) => handleSort('createdAt', e)}
                    >
                      Added On
                    </TableSortLabel>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedData.map((row, index) => (
                <TableRow
                  hover
                  key={row.id}
                  sx={{
                    '&:hover .MuiTableCell-root:not(.sticky-col)': {
                      bgcolor: 'rgba(25, 118, 210, 0.15) !important',
                    },
                  }}
                >
                  {cols.sno && (
                    <TableCell
                      className="sticky-col"
                      sx={{
                        fontWeight: 500,
                        color: 'text.secondary',
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        borderRight: '2px solid #ccc',
                        transition: 'background-color 0.2s',
                        '.MuiTableRow-hover:hover &': { bgcolor: '#f5f5f5' },
                      }}
                    >
                      {index + 1}
                    </TableCell>
                  )}
                  {cols.name && (
                    <TableCell
                      className="sticky-col"
                      sx={{
                        fontWeight: 700,
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        left: cols.sno ? 45 : 0,
                        zIndex: 2,
                        borderRight: '2px solid #ccc',
                        transition: 'background-color 0.2s',
                        '.MuiTableRow-hover:hover &': { bgcolor: '#f5f5f5' },
                      }}
                    >
                      {row.name}
                    </TableCell>
                  )}
                  {cols.stockStatus && (
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color:
                          row.stockStatus === 'In Stock'
                            ? 'success.main'
                            : row.stockStatus === 'Low Stock'
                              ? 'warning.main'
                              : 'error.main',
                      }}
                    >
                      {row.stockStatus}
                    </TableCell>
                  )}
                  {cols.batchCode && <TableCell sx={{ py: 0.5 }}>{row.batchCode}</TableCell>}
                  {cols.category && <TableCell sx={{ py: 0.5 }}>{row.category}</TableCell>}
                  {cols.mrp && <TableCell sx={{ py: 0.5 }}>{row.mrp.toFixed(2)}</TableCell>}
                  {cols.sp && (
                    <TableCell sx={{ py: 0.5, color: 'primary.main', fontWeight: 600 }}>
                      {row.sp?.toFixed(2)}
                    </TableCell>
                  )}
                  {cols.cp && <TableCell sx={{ py: 0.5 }}>{row.cp?.toFixed(2)}</TableCell>}
                  {cols.profitRs && (
                    <TableCell
                      sx={{
                        py: 0.5,
                        fontWeight: 700,
                        color: row.profitRs > 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {row.profitRs.toFixed(2)}
                    </TableCell>
                  )}
                  {cols.discRsVendor && (
                    <TableCell sx={{ py: 0.5, color: 'success.main' }}>
                      {row.discRsVendor.toFixed(2)}
                    </TableCell>
                  )}
                  {cols.discPctVendor && (
                    <TableCell sx={{ py: 0.5, fontWeight: 700, color: 'success.main' }}>
                      {row.discPctVendor.toFixed(1)}%
                    </TableCell>
                  )}
                  {cols.discRsCust && (
                    <TableCell sx={{ py: 0.5, color: 'error.main' }}>
                      {row.discRsCust.toFixed(2)}
                    </TableCell>
                  )}
                  {cols.discPctCust && (
                    <TableCell sx={{ py: 0.5, fontWeight: 700 }}>
                      {row.discPctCust.toFixed(1)}%
                    </TableCell>
                  )}
                  {cols.marginPct && (
                    <TableCell
                      sx={{
                        py: 0.5,
                        fontWeight: 700,
                        color: row.marginPct > 15 ? 'success.main' : 'warning.main',
                      }}
                    >
                      {row.marginPct.toFixed(1)}%
                    </TableCell>
                  )}
                  {cols.barcode && (
                    <TableCell sx={{ py: 0.5, fontFamily: 'monospace' }}>{row.barcode}</TableCell>
                  )}
                  {cols.expiry && (
                    <TableCell sx={{ py: 0.5, bgcolor: getExpiryColor(row.expiry) }}>
                      {row.expiry ? new Date(row.expiry).toLocaleDateString() : '—'}
                    </TableCell>
                  )}
                  {cols.wsPrice && (
                    <TableCell>{row.wsPrice ? `${row.wsPrice.toFixed(2)}` : '—'}</TableCell>
                  )}
                  {cols.wsMinQty && <TableCell>{row.wsMinQty || '—'}</TableCell>}
                  {cols.lowStockEnabled && (
                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                      <Chip
                        label={row.lowStockEnabled ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={row.lowStockEnabled ? 'warning' : 'default'}
                        variant={row.lowStockEnabled ? 'filled' : 'outlined'}
                        sx={{ height: 18, fontSize: '0.6rem' }}
                      />
                    </TableCell>
                  )}
                  {cols.batchTrackingEnabled && (
                    <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                      <Chip
                        label={row.batchTrackingEnabled ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={row.batchTrackingEnabled ? 'primary' : 'default'}
                        variant={row.batchTrackingEnabled ? 'filled' : 'outlined'}
                        sx={{ height: 18, fontSize: '0.6rem' }}
                      />
                    </TableCell>
                  )}
                  {cols.stock && (
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        bgcolor:
                          row.stock <= 5 ? '#ffebee' : row.stock <= 15 ? '#fff3e0' : '#e8f5e9',
                        color:
                          row.stock <= 5
                            ? 'error.main'
                            : row.stock <= 15
                              ? 'warning.main'
                              : 'success.main',
                      }}
                    >
                      {row.stock}
                    </TableCell>
                  )}
                  {cols.totalValCp && (
                    <TableCell sx={{ fontWeight: 600 }}>{row.totalValCp.toFixed(2)}</TableCell>
                  )}
                  {cols.totalValSp && (
                    <TableCell sx={{ fontWeight: 600 }}>{row.totalValSp.toFixed(2)}</TableCell>
                  )}
                  {cols.createdAt && (
                    <TableCell>
                      {row.createdAt !== 'N/A'
                        ? new Date(row.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
            {/* Summary Row */}
            <TableBody>
              <TableRow
                sx={{
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 4,
                  '& .MuiTableCell-root': {
                    bgcolor: '#e1e3f1',
                    borderTop: '2px solid #ccc',
                  },
                }}
              >
                <TableCell
                  colSpan={cols.sno ? 2 : 1}
                  sx={{
                    fontWeight: 800,
                    py: 1.5,
                    position: 'sticky',
                    left: 0,
                    zIndex: 5,
                    borderRight: '2px solid #ccc',
                  }}
                >
                  TOTALS / AVERAGES
                </TableCell>
                {cols.stockStatus && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.batchCode && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.category && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.mrp && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.sp && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgSp?.toFixed(2) || '0.00'}
                  </TableCell>
                )}
                {cols.cp && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgCp?.toFixed(2) || '0.00'}
                  </TableCell>
                )}
                {cols.profitRs && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgSp && totals.avgCp
                      ? (totals.avgSp - totals.avgCp).toFixed(2)
                      : '0.00'}
                  </TableCell>
                )}
                {cols.discRsVendor && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgDiscRsVendor?.toFixed(2) || '0.00'}
                  </TableCell>
                )}
                {cols.discPctVendor && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgDiscPctVendor?.toFixed(1) || '0.0'}%
                  </TableCell>
                )}
                {cols.discRsCust && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgDiscRsCust?.toFixed(2) || '0.00'}
                  </TableCell>
                )}
                {cols.discPctCust && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgDiscPctCust?.toFixed(1) || '0.0'}%
                  </TableCell>
                )}
                {cols.marginPct && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgMargin?.toFixed(1) || '0.0'}%
                  </TableCell>
                )}
                {cols.barcode && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.expiry && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.wsPrice && (
                  <TableCell sx={{ fontWeight: 800 }}>
                    {totals.avgWsPrice?.toFixed(2) || '0.00'}
                  </TableCell>
                )}
                {cols.wsMinQty && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.lowStockEnabled && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.batchTrackingEnabled && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
                {cols.stock && (
                  <TableCell sx={{ fontWeight: 900, fontSize: '1rem', color: '#1a237e' }}>
                    {totals.totalStock || 0}
                  </TableCell>
                )}
                {cols.totalValCp && (
                  <TableCell sx={{ fontWeight: 900, fontSize: '1rem', color: 'error.main' }}>
                    {totals.totalValueCost?.toFixed(2) || '0.00'}
                  </TableCell>
                )}
                {cols.totalValSp && (
                  <TableCell sx={{ fontWeight: 900, fontSize: '1rem', color: 'success.main' }}>
                    {totals.totalValueSelling?.toFixed(2) || '0.00'}
                  </TableCell>
                )}
                {cols.createdAt && <TableCell sx={{ fontWeight: 800 }}></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Dialog>
  );
};

export default InventoryExcelView;
