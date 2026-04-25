import React from 'react';
import {
  Paper, Stack, Typography, TextField, FormControl, InputLabel, Select, MenuItem,
  Grid, FormGroup, FormControlLabel, Checkbox, RadioGroup, Radio,
} from '@mui/material';
import { DEFAULT_SIZES } from '@/domains/inventory/components/barcodeSizePresets';

const BarcodeSettingsPanel = ({
  quantity, onQuantityChange,
  printMethod, onPrintMethodChange,
  printers, selectedPrinter, onPrinterChange,
  paperSize, onPaperSizeChange,
  customDimensions, onCustomDimensionsChange,
  margins, onMarginsChange,
  spacing, onSpacingChange,
  contentOptions, onContentChange,
  shopName, onShopNameChange,
  textAlign, onTextAlignChange,
}) => (
  <Stack spacing={3}>
    {/* Basic Settings */}
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Basic Settings</Typography>
      <Stack spacing={2}>
        <TextField
          label="Number of Labels"
          type="number"
          value={quantity}
          onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
          fullWidth size="small"
          inputProps={{ min: 1, max: 1000 }}
        />
        <FormControl fullWidth size="small">
          <InputLabel>Output Destination</InputLabel>
          <Select value={printMethod} onChange={(e) => onPrintMethodChange(e.target.value)} label="Output Destination">
            <MenuItem value="a4">Standard Printer (A4 Sheet)</MenuItem>
            <MenuItem value="machine">Dedicated Barcode Printer</MenuItem>
          </Select>
        </FormControl>
        {printMethod === 'machine' && window.electron && (
          <FormControl fullWidth size="small">
            <InputLabel>Printer Selection</InputLabel>
            <Select value={selectedPrinter} onChange={(e) => onPrinterChange(e.target.value)} label="Printer Selection" displayEmpty>
              {printers && printers.length > 0 ? (
                printers.map((p, i) => (
                  <MenuItem key={i} value={p.name}>{p.name} {p.isDefault ? '(Default)' : ''}</MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No printers found</MenuItem>
              )}
            </Select>
          </FormControl>
        )}
      </Stack>
    </Paper>

    {/* Label Layout */}
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Label Size & Layout</Typography>
      <Stack spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Paper Size Preset</InputLabel>
          <Select value={paperSize} onChange={(e) => onPaperSizeChange(e.target.value)} label="Paper Size Preset">
            {Object.values(DEFAULT_SIZES).map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
            ))}
            <MenuItem value="custom">Custom Size</MenuItem>
          </Select>
        </FormControl>
        {paperSize === 'custom' && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}>
              <TextField
                label="Bar Width (px)" type="number" fullWidth size="small"
                value={customDimensions.width}
                onChange={(e) => onCustomDimensionsChange({ ...customDimensions, width: parseFloat(e.target.value) || 2 })}
                inputProps={{ min: 1, max: 5, step: 0.1 }}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                label="Height (px)" type="number" fullWidth size="small"
                value={customDimensions.height}
                onChange={(e) => onCustomDimensionsChange({ ...customDimensions, height: parseInt(e.target.value) || 50 })}
                inputProps={{ min: 20, max: 200 }}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                label="Columns" type="number" fullWidth size="small"
                value={customDimensions.cols}
                onChange={(e) => onCustomDimensionsChange({ ...customDimensions, cols: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
          </Grid>
        )}
      </Stack>
    </Paper>

    {/* Page Margins */}
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Page Margins (mm)</Typography>
      <Grid container spacing={2}>
        {['top', 'right', 'bottom', 'left'].map((side) => (
          <Grid size={{ xs: 6 }} key={side}>
            <TextField
              label={side.charAt(0).toUpperCase() + side.slice(1)}
              type="number" fullWidth size="small"
              value={margins[side]}
              onChange={(e) => onMarginsChange({ ...margins, [side]: parseInt(e.target.value) || 0 })}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>

    {/* Barcode Spacing */}
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Barcode Spacing (mm)</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Horizontal" type="number" fullWidth size="small"
            value={spacing.horizontal}
            onChange={(e) => onSpacingChange({ ...spacing, horizontal: parseInt(e.target.value) || 0 })}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Vertical" type="number" fullWidth size="small"
            value={spacing.vertical}
            onChange={(e) => onSpacingChange({ ...spacing, vertical: parseInt(e.target.value) || 0 })}
          />
        </Grid>
      </Grid>
    </Paper>

    {/* Display Content */}
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Display Content</Typography>
      <FormGroup>
        {[
          { field: 'productName', label: 'Product Name' },
          { field: 'mrp', label: 'MRP' },
          { field: 'sellingPrice', label: 'Selling Price' },
          { field: 'discount', label: 'Discount/Savings' },
          { field: 'shopName', label: 'Shop Name' },
        ].map(({ field, label }) => (
          <FormControlLabel
            key={field}
            control={<Checkbox checked={contentOptions[field]} onChange={() => onContentChange(field)} />}
            label={label}
          />
        ))}
      </FormGroup>
      {contentOptions.shopName && (
        <TextField
          label="Shop Name" value={shopName} onChange={(e) => onShopNameChange(e.target.value)}
          fullWidth size="small" sx={{ mt: 1 }}
        />
      )}
    </Paper>

    {/* Text Alignment */}
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Text Alignment</Typography>
      <FormControl component="fieldset">
        <RadioGroup value={textAlign} onChange={(e) => onTextAlignChange(e.target.value)} row>
          <FormControlLabel value="left" control={<Radio size="small" />} label="Left" />
          <FormControlLabel value="center" control={<Radio size="small" />} label="Center" />
          <FormControlLabel value="right" control={<Radio size="small" />} label="Right" />
        </RadioGroup>
      </FormControl>
    </Paper>
  </Stack>
);

export default BarcodeSettingsPanel;
