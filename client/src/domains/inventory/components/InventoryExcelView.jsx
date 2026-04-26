import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Slide, Container } from '@mui/material';
import inventoryService from '@/shared/api/inventoryService';
import InventoryExcelHeaderBar from '@/domains/inventory/components/InventoryExcelHeaderBar';
import InventoryExcelFiltersBar from '@/domains/inventory/components/InventoryExcelFiltersBar';
import InventoryExcelTable from '@/domains/inventory/components/InventoryExcelTable';
import useInventoryExcelData from '@/domains/inventory/components/useInventoryExcelData';
import { buildInventoryCsv } from '@/domains/inventory/components/inventoryExcelUtils';
import { getResponseArray } from '@/shared/utils/responseGuards';

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

  const { uniqueCategories, filteredAndSortedData, totals, getExpiryColor } = useInventoryExcelData(
    {
      products,
      localCategoryFilter,
      searchTerm,
      sortConfigs,
    }
  );

  const fetchData = useCallback(async () => {
    try {
      const data = await inventoryService.fetchProducts({
        includeBatches: 'true',
        category: categoryFilter,
        search: externalSearch,
      });
      setProducts(getResponseArray(data));
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

  useEffect(() => {
    if (!uniqueCategories.includes(localCategoryFilter)) {
      setLocalCategoryFilter('all');
    }
  }, [localCategoryFilter, uniqueCategories]);

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
    const csvContent = buildInventoryCsv(cols, filteredAndSortedData);

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
