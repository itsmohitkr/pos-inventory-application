import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  Slide,
  Container,
} from '@mui/material';
import inventoryService from '../../shared/api/inventoryService';
import InventoryExcelHeaderBar from './InventoryExcelHeaderBar';
import InventoryExcelFiltersBar from './InventoryExcelFiltersBar';
import InventoryExcelTable from './InventoryExcelTable';

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
      <InventoryExcelHeaderBar
        onClose={onClose}
        colAnchorEl={colAnchorEl}
        setColAnchorEl={setColAnchorEl}
        cols={cols}
        setCols={setCols}
        onExportCSV={handleExportCSV}
        onPrint={() => window.print()}
      />

      <Container
        maxWidth={false}
        sx={{ py: 3, bgcolor: '#f8f9fa', minHeight: 'calc(100vh - 48px)' }}
      >
        <InventoryExcelFiltersBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          localCategoryFilter={localCategoryFilter}
          onCategoryFilterChange={setLocalCategoryFilter}
          uniqueCategories={uniqueCategories}
          filteredCount={filteredAndSortedData.length}
          totals={totals}
        />

        <InventoryExcelTable
          cols={cols}
          sortConfigs={sortConfigs}
          handleSort={handleSort}
          filteredAndSortedData={filteredAndSortedData}
          getExpiryColor={getExpiryColor}
          totals={totals}
        />
      </Container>
    </Dialog>
  );
};

export default InventoryExcelView;
