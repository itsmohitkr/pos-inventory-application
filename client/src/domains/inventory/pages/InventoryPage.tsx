import React, { useState, useRef, useTransition } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  ViewModule as ViewModuleIcon,
  TableChart as TableChartIcon,
  LocalPrintshop as LocalPrintshopIcon,
  ViewColumn as ViewColumnIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import ProductList from '@/domains/inventory/components/ProductList';
import type { ProductListHandle } from '@/domains/inventory/components/ProductList';
import InventoryExcelView from '@/domains/inventory/components/InventoryExcelView';
import PriceListPanel from '@/domains/inventory/components/PriceListPanel';
import InventoryImportView from '@/domains/inventory/components/InventoryImportView';
import InventoryExportView from '@/domains/inventory/components/InventoryExportView';

type InventoryNavTab = 'products' | 'import' | 'export' | 'pricetag';

const InventoryPage = () => {
  const [activeNav, setActiveNav] = useState<InventoryNavTab>('products');
  const [productView, setProductView] = useState<'cards' | 'grid'>('cards');
  const [inventoryKey, setInventoryKey] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const inventoryRef = useRef<ProductListHandle>(null);

  const handleCategoryChange = (val: string) => {
    startTransition(() => {
      setCategoryFilter(val);
    });
  };

  const handleSearchChange = (val: string) => {
    startTransition(() => {
      setDebouncedSearch(val);
    });
  };

  const handleImportComplete = () => {
    setInventoryKey((prev) => prev + 1);
    if (inventoryRef.current?.refresh) {
      inventoryRef.current.refresh();
    }
  };


  return (
    <Box
      sx={{
        bgcolor: '#f8fafc',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Inventory Header Card */}
      <Paper
        elevation={0}
        sx={{
          m: 1.5,
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Header Content: Title & Description on Left, Nav Bar & Controls on Right */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}
              >
                Inventory Management
              </Typography>

              {activeNav === 'products' && productView === 'grid' && (
                <Chip
                  label="Spreadsheet View"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(11, 29, 57, 0.08)',
                    color: '#0b1d39',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: 24,
                  }}
                />
              )}
              {activeNav === 'import' && (
                <Chip
                  label="Import"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(11, 29, 57, 0.08)',
                    color: '#0b1d39',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: 24,
                  }}
                />
              )}
              {activeNav === 'export' && (
                <Chip
                  label="Export"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(11, 29, 57, 0.08)',
                    color: '#0b1d39',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: 24,
                  }}
                />
              )}
              {activeNav === 'pricetag' && (
                <Chip
                  label="Price Tag"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(11, 29, 57, 0.08)',
                    color: '#0b1d39',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: 24,
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {activeNav === 'products' && productView === 'cards'
                ? 'Browse products by category and manage stock efficiently.'
                : activeNav === 'products' && productView === 'grid'
                ? 'Real-time tabular inventory tracking, batch codes, cost, profit, and stock valuation.'
                : activeNav === 'import'
                ? 'Upload CSV files to add and update products in bulk.'
                : activeNav === 'export'
                ? 'Download current inventory data as CSV for external analysis and reporting.'
                : 'Select products, configure barcode label layouts, preview, and print price lists.'}
            </Typography>
          </Box>

          {/* Right-aligned Navigation Bar & Action Controls */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center', justifyContent: 'flex-end' }}
          >
            {/* Nav Bar (Tabs) */}
            <Tabs
              value={activeNav}
              onChange={(_, val) => setActiveNav(val)}
              sx={{
                minHeight: 38,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  bgcolor: '#0b1d39',
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  minHeight: 38,
                  px: 1.75,
                  py: 0.5,
                  color: '#64748b',
                  transition: 'color 0.15s ease',
                  '&:hover': {
                    color: '#0b1d39',
                  },
                  '&.Mui-selected': {
                    color: '#0b1d39',
                    fontWeight: 700,
                  },
                },
              }}
            >
              <Tab
                value="products"
                icon={<TableChartIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Products"
              />
              <Tab
                value="import"
                icon={<UploadIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Import"
              />
              <Tab
                value="export"
                icon={<DownloadIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Export"
              />
              <Tab
                value="pricetag"
                icon={<LocalPrintshopIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Price Tag"
              />
            </Tabs>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75, borderColor: '#e2e8f0' }} />
            <ToggleButtonGroup
              value={activeNav === 'products' ? productView : false}
              exclusive
              onChange={(_, next) => {
                if (next) {
                  setActiveNav('products');
                  setProductView(next);
                }
              }}
              size="small"
              aria-label="View mode"
              sx={{
                height: 36,
                bgcolor: '#f1f5f9',
                p: '2px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '6px',
                  px: 1.25,
                  py: 0.5,
                  color: '#64748b',
                  transition: 'all 0.15s ease',
                  '&.Mui-selected': {
                    bgcolor: '#ffffff',
                    color: '#0b1d39',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: '#ffffff' },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.6)',
                    color: '#0b1d39',
                  },
                },
              }}
            >
              <Tooltip title="Card View">
                <ToggleButton value="cards" aria-label="Card View">
                  <TableChartIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Spreadsheet View">
                <ToggleButton value="grid" aria-label="Spreadsheet View">
                  <ViewModuleIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </Stack>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0, px: 1.5, pb: 1.5 }}>
        {/* Products View: Keep ProductList mounted for state & scroll retention */}
        <Box sx={{ height: '100%', display: (activeNav === 'products' && productView === 'cards') ? 'block' : 'none' }}>
          <ProductList
            key={inventoryKey}
            ref={inventoryRef}
            categoryFilter={categoryFilter}
            onCategoryChange={handleCategoryChange}
            debouncedSearch={debouncedSearch}
            onSearchChange={handleSearchChange}
            isPending={isPending}
          />
        </Box>

        {/* Grid / Spreadsheet View — its own search/category filters, independent of the Products list */}
        {activeNav === 'products' && productView === 'grid' && (
          <InventoryExcelView
            key={`excel-${inventoryKey}`}
            open={true}
          />
        )}

        {/* Flat Import View */}
        {activeNav === 'import' && (
          <InventoryImportView
            onImportComplete={handleImportComplete}
          />
        )}

        {/* Centralized Flat Export View — its own search/category filters, independent of the Products list */}
        {activeNav === 'export' && (
          <InventoryExportView />
        )}

        {/* Flat Price Tag View */}
        {activeNav === 'pricetag' && (
          <PriceListPanel
            open={true}
            onClose={() => setActiveNav('products')}
          />
        )}
      </Box>
    </Box>
  );
};

export default InventoryPage;
