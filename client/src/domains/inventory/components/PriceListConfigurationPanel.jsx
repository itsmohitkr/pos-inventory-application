import React from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
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

const PriceListConfigurationPanel = ({
  products,
  loadingProducts,
  selectedProductOptions,
  handleProductSelectionChange,
  getPrimaryBarcode,
  selectedRows,
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
  paperPresets,
  showAdvancedLayout,
  setShowAdvancedLayout,
  layout,
  setLayout,
  displayOptions,
  handleDisplayOptionChange,
}) => {
  return (
    <Box
      className="no-print"
      sx={{
        width: { xs: '100%', sm: '380px', md: '440px' },
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
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
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.2 }}>
            Product Selection
          </Typography>
          <Autocomplete
            multiple
            options={products}
            loading={loadingProducts}
            value={selectedProductOptions}
            onChange={handleProductSelectionChange}
            disableCloseOnSelect
            getOptionLabel={(option) => {
              const barcode = getPrimaryBarcode(option);
              return barcode ? `${option.name} (${barcode})` : option.name;
            }}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select one or more products"
                placeholder="Search products"
                size="small"
              />
            )}
            sx={{ mb: 1.5 }}
          />
          <Divider sx={{ my: 1.5 }} />
          <Stack spacing={1}>
            {selectedRows.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No products selected yet.
              </Typography>
            )}
            {selectedRows.map((row) => (
              <Paper
                key={row.product.id}
                variant="outlined"
                sx={{
                  px: 1,
                  py: 0.8,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255,255,255,0.92)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  alignItems: 'center',
                  gap: 0.6,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
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
                  inputProps={{ min: 1, style: { textAlign: 'center', width: 48 } }}
                  value={row.quantity}
                  onChange={(event) => handleQuantityChange(row.product.id, event.target.value)}
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
            ))}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.2 }}>
            Printer and Paper
          </Typography>
          <Stack spacing={1.2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl fullWidth size="small">
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
              <IconButton onClick={fetchPrinters} title="Refresh printers">
                <RefreshIcon />
              </IconButton>
            </Box>

            {!window.electron?.ipcRenderer && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Printer auto-detection is available in the desktop app. Browser print is still
                supported.
              </Alert>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Paper Type</InputLabel>
              <Select label="Paper Type" value={paperType} onChange={handlePaperTypeChange}>
                <MenuItem value="a4">A4 Paper</MenuItem>
                <MenuItem value="thermal">Thermal Label Printer Paper</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
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

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Advanced Layout and Margins
            </Typography>
            <Button
              size="small"
              variant="outlined"
              endIcon={showAdvancedLayout ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowAdvancedLayout((current) => !current)}
            >
              {showAdvancedLayout ? 'Hide' : 'Show'}
            </Button>
          </Box>

          <Collapse in={showAdvancedLayout} timeout="auto" unmountOnExit>
            <Grid container spacing={1.2} sx={{ mt: 0.8 }}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Columns"
                  type="number"
                  inputProps={{ min: 1, max: 10 }}
                  value={layout.columns}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      columns: Math.max(1, Number(event.target.value) || 1),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Label Width (mm)"
                  type="number"
                  inputProps={{ min: 20 }}
                  value={layout.labelWidth}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      labelWidth: Math.max(20, Number(event.target.value) || 20),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Label Height (mm)"
                  type="number"
                  inputProps={{ min: 15 }}
                  value={layout.labelHeight}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      labelHeight: Math.max(15, Number(event.target.value) || 15),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Barcode Height (px)"
                  type="number"
                  inputProps={{ min: 20 }}
                  value={layout.barcodeHeight}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      barcodeHeight: Math.max(20, Number(event.target.value) || 20),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bar Thickness"
                  type="number"
                  inputProps={{ min: 0.1, max: 4, step: 0.1 }}
                  value={layout.barcodeLineWidth}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      barcodeLineWidth: Math.max(0.1, Number(event.target.value) || 0.1),
                    }))
                  }
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
                <TextField
                  fullWidth
                  size="small"
                  label="Margin Left (mm)"
                  type="number"
                  value={layout.marginLeft}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      marginLeft: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Margin Right (mm)"
                  type="number"
                  value={layout.marginRight}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      marginRight: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Margin Top (mm)"
                  type="number"
                  value={layout.marginTop}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      marginTop: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Margin Bottom (mm)"
                  type="number"
                  value={layout.marginBottom}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      marginBottom: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Horizontal Gap (mm)"
                  type="number"
                  value={layout.gapHorizontal}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      gapHorizontal: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Vertical Gap (mm)"
                  type="number"
                  value={layout.gapVertical}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      gapVertical: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Barcode Line Spacing"
                  type="number"
                  inputProps={{ min: 0.8, max: 3, step: 0.1 }}
                  value={layout.barcodeLineSpacing}
                  onChange={(event) =>
                    setLayout((current) => ({
                      ...current,
                      barcodeLineSpacing: Math.max(0.8, Number(event.target.value) || 1.25),
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
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
