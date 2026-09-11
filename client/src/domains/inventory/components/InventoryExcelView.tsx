import type { Product } from '@/shared/types/models';
import type {
  InventoryRow,
  InventorySortConfig,
} from '@/domains/inventory/components/inventoryExcelUtils';
import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as Sentry from '@sentry/react';
import { Paper, Box, Popover, Typography, FormControlLabel, Checkbox, Divider } from '@mui/material';
import inventoryService from '@/shared/api/inventoryService';
import InventoryExcelFiltersBar from '@/domains/inventory/components/InventoryExcelFiltersBar';
import InventoryExcelTable from '@/domains/inventory/components/InventoryExcelTable';
import useInventoryExcelData from '@/domains/inventory/components/useInventoryExcelData';
import { buildInventoryCsv } from '@/domains/inventory/components/inventoryExcelUtils';
import { getResponseArray } from '@/shared/utils/responseGuards';

export interface InventoryExcelViewHandle {
  exportCSV: () => void;
  print: () => void;
  openColumnsMenu: (anchor: HTMLElement) => void;
}

interface InventoryExcelViewProps {
  open?: boolean;
  /** Category preselected by the inventory page. */
  categoryFilter?: string;
  /** Search text carried over from the main list. */
  externalSearch?: string;
}

const InventoryExcelView = forwardRef<InventoryExcelViewHandle, InventoryExcelViewProps>(
  ({ open = true, categoryFilter = 'all', externalSearch = '' }, ref) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Column Visibility State
    const [cols, setCols] = useState<Record<string, boolean>>({
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
    const [colAnchorEl, setColAnchorEl] = useState<HTMLElement | null>(null);

    // Spreadsheet Sorting Enhancements
    const [sortConfigs, setSortConfigs] = useState<InventorySortConfig[]>([
      { key: 'name', direction: 'asc' },
    ]);

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
        Sentry.captureException(error, { tags: { feature: 'inventory-excel-fetch' } });
        console.error('Error fetching inventory:', error);
      }
    }, [categoryFilter, externalSearch]);

    // Re-sync the local search box from the incoming prop whenever the view
    // opens or the external search term changes — adjusted during render
    // (comparing to the previous open/externalSearch) rather than in a
    // useEffect, per React's guidance for state that needs to react to a
    // prop change without an extra render cycle.
    const [prevOpen, setPrevOpen] = useState(open);
    const [prevExternalSearch, setPrevExternalSearch] = useState(externalSearch);
    if (open !== prevOpen || externalSearch !== prevExternalSearch) {
      setPrevOpen(open);
      setPrevExternalSearch(externalSearch);
      if (open) {
        setSearchTerm(externalSearch);
      }
    }

    useEffect(() => {
      if (!open) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }, [open, externalSearch, fetchData]);

    // Fall back to "all" during render if the active category filter no
    // longer exists in the product list (e.g. the last product in that
    // category was deleted) — same render-time-adjustment reasoning as above.
    const [prevUniqueCategories, setPrevUniqueCategories] = useState(uniqueCategories);
    if (uniqueCategories !== prevUniqueCategories) {
      setPrevUniqueCategories(uniqueCategories);
      if (!uniqueCategories.includes(localCategoryFilter)) {
        setLocalCategoryFilter('all');
      }
    }

    const handleSort = (propertyId: string, event?: React.MouseEvent) => {
      const property = propertyId as keyof InventoryRow;
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

    const handleExportCSV = useCallback(() => {
      const csvContent = buildInventoryCsv(cols, filteredAndSortedData);

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `inventory_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, [cols, filteredAndSortedData]);

    useImperativeHandle(
      ref,
      () => ({
        exportCSV: handleExportCSV,
        print: () => window.print(),
        openColumnsMenu: (anchor: HTMLElement) => setColAnchorEl(anchor),
      }),
      [handleExportCSV]
    );

    if (!open) return null;

    return (
      <Paper
        elevation={0}
        className="inventory-spreadsheet-view"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          p: 1.5,
        }}
      >
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
              .inventory-spreadsheet-view,
              .inventory-spreadsheet-view * {
                visibility: visible !important;
              }
              .no-print,
              header,
              nav,
              button,
              .MuiInputAdornment-root {
                display: none !important;
                visibility: hidden !important;
              }
              .inventory-spreadsheet-view {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                overflow: visible !important;
                height: auto !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
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

        {/* Columns selection popover */}
        <Popover
          open={Boolean(colAnchorEl)}
          anchorEl={colAnchorEl}
          onClose={() => setColAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, minWidth: 400 }}>
            <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1', mb: 1, fontWeight: 'bold' }}>
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

        {/* Filters Bar: Search, Category, Columns, Print, and Metric Chips */}
        <InventoryExcelFiltersBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          localCategoryFilter={localCategoryFilter}
          onCategoryFilterChange={setLocalCategoryFilter}
          uniqueCategories={uniqueCategories}
          filteredCount={filteredAndSortedData.length}
          onOpenColumnsMenu={(e) => setColAnchorEl(e.currentTarget)}
          onPrint={() => window.print()}
        />

        {/* Horizontal Partition */}
        <Divider sx={{ mb: 1.5, borderColor: '#e2e8f0' }} />

        {/* Spreadsheet Table */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <InventoryExcelTable
            cols={cols}
            sortConfigs={sortConfigs}
            handleSort={handleSort}
            filteredAndSortedData={filteredAndSortedData}
            getExpiryColor={getExpiryColor}
            totals={totals}
          />
        </Box>
      </Paper>
    );
  }
);

InventoryExcelView.displayName = 'InventoryExcelView';

export default InventoryExcelView;
