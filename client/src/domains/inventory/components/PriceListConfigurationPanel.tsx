import React from 'react';
import type { Batch, Product } from '@/shared/types/models';
import type { PrinterInfo } from '@/domains/settings/hooks/useSettings';
import type {
  PaperPresetOption,
  PriceListDisplayOptions,
  PriceListLayout,
} from '@/domains/inventory/components/paperSizePresets';
import type { PriceListRow } from '@/domains/inventory/components/usePriceList';

interface PriceListConfigurationPanelProps {
  products: Product[];
  loadingProducts: boolean;
  handleAddProduct: (product: Product) => void;
  handleClearAllProducts: () => void;
  getPrimaryBarcode: (product?: Product | null) => string;
  selectedRows: PriceListRow[];
  recentlyAddedId?: number | null;
  handleDecreaseQuantity: (productId: number) => void;
  handleQuantityChange: (productId: number, rawValue: string | number) => void;
  handleIncreaseQuantity: (productId: number) => void;
  handleRemoveSelectedProduct: (productId: number) => void;
  selectedPrinter: string;
  setSelectedPrinter: (name: string) => void;
  printers: PrinterInfo[];
  /** `true` forces a re-enumeration, bypassing the shared printer cache. */
  fetchPrinters: (force?: boolean) => void;
  /** 'a4' | 'thermal'. */
  paperType: string;
  handlePaperTypeChange: (event: { target: { value: string } }) => void;
  paperPreset: string;
  handlePresetChange: (event: { target: { value: string } }) => void;
  handleResetLayout: () => void;
  paperPresets: PaperPresetOption[];
  showAdvancedLayout: boolean;
  setShowAdvancedLayout: React.Dispatch<React.SetStateAction<boolean>>;
  layout: PriceListLayout;
  setLayout: React.Dispatch<React.SetStateAction<PriceListLayout>>;
  displayOptions: PriceListDisplayOptions;
  handleDisplayOptionChange: (field: keyof PriceListDisplayOptions) => void;
}
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

interface ClearableNumberFieldProps {
  label: string;
  value: number | undefined;
  min: number;
  max?: number;
  fallback: number;
  step?: number;
  onCommit: (value: number) => void;
}

/**
 * A numeric TextField that can actually be cleared and retyped. A plain
 * controlled input bound straight to a clamped number snaps back to the
 * fallback the instant the field is emptied (Number('') || fallback), before
 * the next keystroke can land. This decouples "what's displayed" (a free-form
 * draft string, including '') from "the committed value" (parsed/clamped only
 * on blur), while still pushing valid in-progress numbers through unclamped
 * on every keystroke so the live preview keeps updating as today.
 */
function ClearableNumberField({
  label,
  value,
  min,
  max,
  fallback,
  step,
  onCommit,
}: ClearableNumberFieldProps) {
  const [draft, setDraft] = React.useState<string | null>(null);

  const clamp = (n: number) => {
    const lower = Math.max(min, n);
    return typeof max === 'number' ? Math.min(max, lower) : lower;
  };

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      type="number"
      inputProps={{
        min,
        ...(max !== undefined ? { max } : {}),
        ...(step !== undefined ? { step } : {}),
      }}
      value={draft ?? String(value ?? '')}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        if (raw.trim() === '') return;
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
      onBlur={() => {
        if (draft === null) return;
        const parsed = Number(draft);
        const finalValue =
          draft.trim() === '' || !Number.isFinite(parsed) ? fallback : clamp(parsed);
        onCommit(finalValue);
        setDraft(null);
      }}
    />
  );
}

const PriceListConfigurationPanel = ({
  products,
  loadingProducts,
  handleAddProduct,
  handleClearAllProducts,
  getPrimaryBarcode,
  selectedRows,
  recentlyAddedId,
  handleDecreaseQuantity,
  handleQuantityChange,
  handleIncreaseQuantity,
  handleRemoveSelectedProduct,
  selectedPrinter,
  setSelectedPrinter,
  printers,
  fetchPrinters,
  paperType,
  handlePaperTypeChange,
  paperPreset,
  handlePresetChange,
  handleResetLayout,
  paperPresets,
  showAdvancedLayout,
  setShowAdvancedLayout,
  layout,
  setLayout,
  displayOptions,
  handleDisplayOptionChange,
}: PriceListConfigurationPanelProps) => {
  const [searchInput, setSearchInput] = React.useState('');

  return (
    <Box
      className="no-print"
      sx={{
        width: { xs: '100%', sm: '380px', md: '440px' },
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        '& input[type=number]': {
          MozAppearance: 'textfield',
        },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
          WebkitAppearance: 'none',
          margin: 0,
        },
      }}
    >
      <Stack
        spacing={2}
        sx={{
          flex: 1,
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 10 },
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '10px', bgcolor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
              Product Selection
            </Typography>
            {selectedRows.length > 0 && (
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={handleClearAllProducts}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
              >
                Clear
              </Button>
            )}
          </Box>

          <Autocomplete
            options={products}
            loading={loadingProducts}
            value={null}
            inputValue={searchInput}
            onInputChange={(_event, newInputValue, reason) => {
              if (reason !== 'reset') {
                setSearchInput(newInputValue);
              }
            }}
            onChange={(_event, product) => {
              if (product && typeof product !== 'string') {
                handleAddProduct(product);
                setSearchInput('');
              }
            }}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              const barcode = getPrimaryBarcode(option);
              return barcode ? `${option.name} (${barcode})` : option.name;
            }}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            renderOption={(props, option) => {
              const barcode = getPrimaryBarcode(option);
              const isAlreadyAdded = selectedRows.some((r) => String(r.product.id) === String(option.id));
              const { key, ...optionProps } = props;
              return (
                <Box
                  component="li"
                  key={key}
                  {...optionProps}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, px: 1.5 }}
                >
                  <Box sx={{ minWidth: 0, mr: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0b1d39' }} noWrap>
                      {option.name}
                    </Typography>
                    {barcode && (
                      <Typography variant="caption" color="text.secondary">
                        Barcode: {barcode}
                      </Typography>
                    )}
                  </Box>
                  {isAlreadyAdded && (
                    <Chip
                      label="Added"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(11, 29, 57, 0.08)',
                        color: '#0b1d39',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search product or scan barcode"
                placeholder="Scan barcode or type product name..."
                size="small"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchInput.trim()) {
                    const query = searchInput.trim().toLowerCase();
                    const matchedProduct = products.find(
                      (p) =>
                        getPrimaryBarcode(p).toLowerCase() === query ||
                        (p.sku && String(p.sku).toLowerCase() === query)
                    );
                    if (matchedProduct) {
                      e.preventDefault();
                      handleAddProduct(matchedProduct);
                      setSearchInput('');
                    }
                  }
                }}
                sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
              />
            )}
            sx={{ mb: 1.5 }}
          />

          <Divider sx={{ my: 1.5, borderColor: '#e2e8f0' }} />

          <Stack
            spacing={1}
            sx={{
              maxHeight: '312px',
              overflowY: 'auto',
              pr: 0.5,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 10 },
            }}
          >
            {selectedRows.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No products selected yet. Scan barcode or search above to add products.
              </Typography>
            )}
            {selectedRows.map((row) => {
              const isJustAdded = recentlyAddedId === row.product.id;
              return (
                <Paper
                  key={row.product.id}
                  variant="outlined"
                  sx={{
                    px: 1.25,
                    py: 0.8,
                    borderRadius: '8px',
                    borderColor: isJustAdded ? '#16a34a' : '#cbd5e1',
                    borderWidth: '1.5px',
                    bgcolor: '#ffffff',
                    transition: 'border-color 0.4s ease-in-out',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto auto',
                    alignItems: 'center',
                    gap: 0.6,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0b1d39' }} noWrap>
                      {row.product.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDecreaseQuantity(row.product.id)}
                    disabled={row.quantity <= 1}
                    title="Decrease labels"
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{
                      min: 1,
                      style: {
                        textAlign: 'center',
                        width: '32px',
                        padding: '2px 4px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      },
                    }}
                    value={row.quantity}
                    onChange={(event) => handleQuantityChange(row.product.id, event.target.value)}
                    sx={{
                      bgcolor: '#ffffff',
                      '& .MuiInputBase-root': {
                        height: '28px',
                        borderRadius: '6px',
                      },
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleIncreaseQuantity(row.product.id)}
                    title="Increase labels"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveSelectedProduct(row.product.id)}
                    title="Remove product"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Paper>
              );
            })}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '10px', bgcolor: '#f8fafc' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39', mb: 1.2 }}>
            Printer and Paper
          </Typography>
          <Stack spacing={1.2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl fullWidth size="small" sx={{ bgcolor: '#ffffff' }}>
                <InputLabel>Printer</InputLabel>
                <Select
                  label="Printer"
                  value={selectedPrinter}
                  onChange={(event) => setSelectedPrinter(event.target.value)}
                >
                  {printers.length === 0 && <MenuItem value="">Browser Print</MenuItem>}
                  {printers.map((printer) => (
                    <MenuItem key={printer.name} value={printer.name}>
                      {printer.name}
                      {printer.isDefault ? ' (Default)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton onClick={() => fetchPrinters(true)} title="Refresh printers">
                <RefreshIcon />
              </IconButton>
            </Box>

            {!window.electron?.ipcRenderer && (
              <Alert severity="info" sx={{ py: 0.5, borderRadius: '8px' }}>
                Printer auto-detection is available in the desktop app. Browser print is still
                supported.
              </Alert>
            )}

            <FormControl fullWidth size="small" sx={{ bgcolor: '#ffffff' }}>
              <InputLabel>Paper Type</InputLabel>
              <Select label="Paper Type" value={paperType} onChange={handlePaperTypeChange}>
                <MenuItem value="a4">A4 Paper</MenuItem>
                <MenuItem value="thermal">Thermal Label Printer Paper</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ bgcolor: '#ffffff' }}>
              <InputLabel>Paper Size Preset</InputLabel>
              <Select label="Paper Size Preset" value={paperPreset} onChange={handlePresetChange}>
                {paperPresets.map((preset) => (
                  <MenuItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '10px', bgcolor: '#f8fafc' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
              Advanced Layout and Margins
            </Typography>
            <Stack direction="row" spacing={1}>
              {showAdvancedLayout && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleResetLayout}
                  sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#0b1d39', borderRadius: '6px' }}
                >
                  Reset to Default
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                endIcon={showAdvancedLayout ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowAdvancedLayout((current) => !current)}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#0b1d39', borderRadius: '6px' }}
              >
                {showAdvancedLayout ? 'Hide' : 'Show'}
              </Button>
            </Stack>
          </Box>

          <Collapse in={showAdvancedLayout} timeout="auto" unmountOnExit>
            <Grid container spacing={1.2} sx={{ mt: 0.8 }}>
              {/* Thermal prints one label per page, so columns and the
                  between-label gaps have no effect there. */}
              {paperType === 'a4' && (
                <Grid size={{ xs: 6 }}>
                  <ClearableNumberField
                    label="Columns"
                    value={layout.columns}
                    min={1}
                    max={10}
                    fallback={1}
                    onCommit={(columns) => setLayout((current) => ({ ...current, columns }))}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Label Width (mm)"
                  value={layout.labelWidth}
                  min={20}
                  fallback={20}
                  onCommit={(labelWidth) => setLayout((current) => ({ ...current, labelWidth }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Label Height (mm)"
                  value={layout.labelHeight}
                  min={15}
                  fallback={15}
                  onCommit={(labelHeight) => setLayout((current) => ({ ...current, labelHeight }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Barcode Height (px)"
                  value={layout.barcodeHeight}
                  min={20}
                  fallback={20}
                  onCommit={(barcodeHeight) => setLayout((current) => ({ ...current, barcodeHeight }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Bar Thickness"
                  value={layout.barcodeLineWidth}
                  min={0.1}
                  max={4}
                  step={0.1}
                  fallback={0.1}
                  onCommit={(barcodeLineWidth) => setLayout((current) => ({ ...current, barcodeLineWidth }))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Barcode Format</InputLabel>
                  <Select
                    label="Barcode Format"
                    value={layout.barcodeFormat || 'CODE128'}
                    onChange={(event) =>
                      setLayout((current) => ({
                        ...current,
                        barcodeFormat: event.target.value,
                      }))
                    }
                  >
                    <MenuItem value="CODE128">CODE128 (Standard)</MenuItem>
                    <MenuItem value="CODE39">CODE39</MenuItem>
                    <MenuItem value="EAN13">EAN13 (Requires 12/13 digits)</MenuItem>
                    <MenuItem value="EAN8">EAN8 (Requires 7/8 digits)</MenuItem>
                    <MenuItem value="UPC">UPC</MenuItem>
                    <MenuItem value="ITF">ITF</MenuItem>
                    <MenuItem value="MSI">MSI</MenuItem>
                    <MenuItem value="pharmacode">Pharmacode</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Margin Left (mm)"
                  value={layout.marginLeft}
                  min={0}
                  fallback={0}
                  onCommit={(marginLeft) => setLayout((current) => ({ ...current, marginLeft }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Margin Right (mm)"
                  value={layout.marginRight}
                  min={0}
                  fallback={0}
                  onCommit={(marginRight) => setLayout((current) => ({ ...current, marginRight }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Margin Top (mm)"
                  value={layout.marginTop}
                  min={0}
                  fallback={0}
                  onCommit={(marginTop) => setLayout((current) => ({ ...current, marginTop }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Margin Bottom (mm)"
                  value={layout.marginBottom}
                  min={0}
                  fallback={0}
                  onCommit={(marginBottom) => setLayout((current) => ({ ...current, marginBottom }))}
                />
              </Grid>
              {paperType === 'a4' && (
                <Grid size={{ xs: 6 }}>
                  <ClearableNumberField
                    label="Horizontal Gap (mm)"
                    value={layout.gapHorizontal}
                    min={0}
                    fallback={0}
                    onCommit={(gapHorizontal) => setLayout((current) => ({ ...current, gapHorizontal }))}
                  />
                </Grid>
              )}
              {paperType === 'a4' && (
                <Grid size={{ xs: 6 }}>
                  <ClearableNumberField
                    label="Vertical Gap (mm)"
                    value={layout.gapVertical}
                    min={0}
                    fallback={0}
                    onCommit={(gapVertical) => setLayout((current) => ({ ...current, gapVertical }))}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 6 }}>
                <ClearableNumberField
                  label="Barcode Line Spacing"
                  value={layout.barcodeLineSpacing}
                  min={0.8}
                  max={3}
                  step={0.1}
                  fallback={1.25}
                  onCommit={(barcodeLineSpacing) => setLayout((current) => ({ ...current, barcodeLineSpacing }))}
                />
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Label Content
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.mrp}
                  onChange={() => handleDisplayOptionChange('mrp')}
                />
              }
              label="MRP"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.salePrice}
                  onChange={() => handleDisplayOptionChange('salePrice')}
                />
              }
              label="Sale Price"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.batchNumber}
                  onChange={() => handleDisplayOptionChange('batchNumber')}
                />
              }
              label="Batch Number"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.productName}
                  onChange={() => handleDisplayOptionChange('productName')}
                />
              }
              label="Product Name"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.barcode}
                  onChange={() => handleDisplayOptionChange('barcode')}
                />
              }
              label="Barcode No"
            />
          </FormGroup>
          <Divider sx={{ my: 1.5 }} />
          <FormControl fullWidth size="small">
            <InputLabel>Text Alignment</InputLabel>
            <Select
              value={layout.textAlign || 'left'}
              label="Text Alignment"
              onChange={(event) =>
                setLayout((current) => ({ ...current, textAlign: event.target.value }))
              }
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="right">Right</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </Stack>
    </Box>
  );
};

export default PriceListConfigurationPanel;
