import type { Product } from '@/shared/types/models';
import type {
  InventoryRow,
  InventorySortConfig,
} from '@/domains/inventory/components/inventoryExcelUtils';
import React, { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { Paper, Box, Popover, Typography, FormControlLabel, Checkbox, Divider } from '@mui/material';
import inventoryService from '@/shared/api/inventoryService';
import InventoryExcelFiltersBar from '@/domains/inventory/components/InventoryExcelFiltersBar';
import InventoryExcelTable from '@/domains/inventory/components/InventoryExcelTable';
import useInventoryExcelData from '@/domains/inventory/components/useInventoryExcelData';
import { getResponseArray } from '@/shared/utils/responseGuards';

interface InventoryExcelViewProps {
  open?: boolean;
  /** Switches back to the Card view. */
  onClose?: () => void;
}

// CSV/PDF export for this data now lives in the dedicated Export tab
// (InventoryExportView.tsx) — this view is display/sort/filter only.
const InventoryExcelView = ({ open = true, onClose }: InventoryExcelViewProps) => {
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

  // Fetches the full, unfiltered product list — this view's own search box
  // and category dropdown (below) drive filtering entirely independently
  // of the main Products list, so it never depends on that page's state.
  const fetchData = useCallback(async () => {
    try {
      const data = await inventoryService.fetchProducts({ includeBatches: 'true' });
      setProducts(getResponseArray(data));
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inventory-excel-fetch' } });
      console.error('Error fetching inventory:', error);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [open, fetchData]);

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

      {/* Filters Bar: Search, Category, Columns Filter */}
      <InventoryExcelFiltersBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        localCategoryFilter={localCategoryFilter}
        onCategoryFilterChange={setLocalCategoryFilter}
        uniqueCategories={uniqueCategories}
        filteredCount={filteredAndSortedData.length}
        onOpenColumnsMenu={(e) => setColAnchorEl(e.currentTarget)}
        onClose={onClose}
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
};

export default InventoryExcelView;
