import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import { formatPrice } from '@/shared/utils/priceUtils';
import { getExpiryDateInputBounds } from '@/shared/utils/expiryDateBounds';
import { blurNumberInputOnWheel } from '@/shared/utils/numberInputScroll';
import { themedLabelSx } from '@/domains/inventory/components/inventoryFormStyles';
import { computePricingSummary } from '@/domains/inventory/components/pricingSummary';
import type { BatchFormData, BatchFormValidity } from '@/domains/inventory/components/batchFormValidation';
import WholesaleConfiguration from '@/domains/inventory/components/WholesaleConfiguration';
import PricingSummaryCard from '@/domains/inventory/components/PricingSummaryCard';

const { min: expiryDateMin, max: expiryDateMax } = getExpiryDateInputBounds();
const BLUE = '#2563eb';
const blueFieldSx = themedLabelSx(BLUE);

interface BatchFormFieldsProps {
  formData: BatchFormData;
  discountInput: string;
  onChange: (name: string, value: string | boolean) => void;
  batchTrackingEnabled?: boolean;
  /** Computed once by the parent via getBatchFormValidity — the single
   * source of truth also used for the Save button's disabled state, so
   * the field-level errors shown here and the button can't disagree. */
  validity: BatchFormValidity;
  /** Show wholesale required-field errors inline (only once a save has
   * been attempted, matching the deleted AddStockDialog's behavior). */
  showErrors?: boolean;
}

export const BatchFormFields = ({
  formData,
  discountInput,
  onChange,
  batchTrackingEnabled = false,
  validity,
  showErrors = false,
}: BatchFormFieldsProps) => {
  const mrp = Number(formData.mrp) || 0;
  const costPrice = Number(formData.costPrice) || 0;
  const sellingPrice = Number(formData.sellingPrice) || 0;

  const {
    discountValue, discountPercent, marginValue, marginPercent,
    vendorDiscountValue, vendorDiscountPercent,
  } = computePricingSummary(mrp, costPrice, sellingPrice);

  const {
    mrpInvalid, costPriceInvalid, sellingPriceInvalid,
    sellingBelowCost, sellingAboveMrp, sellingInvalid, qtyInvalid,
  } = validity;

  return (
    <>
      {/* 3 Small Summary Cards (Title Case) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, mt: 0.5 }}>
        <PricingSummaryCard
          compact
          label="Discount"
          value={`₹${formatPrice(discountValue)}`}
          percent={`${discountPercent.toFixed(1)}%`}
          bgcolor="#fff7ed"
          borderColor="#ffedd5"
          labelColor="#c2410c"
          valueColor="#ea580c"
        />

        <PricingSummaryCard
          compact
          label="Margin"
          value={`₹${formatPrice(marginValue)}`}
          percent={`${marginPercent.toFixed(1)}%`}
          bgcolor={marginValue >= 0 ? '#f0fdf4' : '#fef2f2'}
          borderColor={marginValue >= 0 ? '#bbf7d0' : '#fecaca'}
          labelColor={marginValue >= 0 ? '#15803d' : '#b91c1c'}
          valueColor={marginValue >= 0 ? '#15803d' : '#b91c1c'}
        />

        <PricingSummaryCard
          compact
          label="Vendor Discount"
          value={`₹${formatPrice(vendorDiscountValue)}`}
          percent={`${vendorDiscountPercent.toFixed(1)}%`}
          bgcolor="#f0f9ff"
          borderColor="#bae6fd"
          labelColor="#0369a1"
          valueColor="#0284c7"
        />
      </Box>

      {/* Form Fields - Structured Row Pairs with Real-time In-Place Validation */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
        {/* Row 1: Batch Code & Quantity */}
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          {batchTrackingEnabled && (
            <TextField
              fullWidth
              size="small"
              label="Batch Code"
              InputLabelProps={{ shrink: true }}
              value={formData.batchCode}
              onChange={(e) => onChange('batchCode', e.target.value)}
              placeholder="e.g. B002 (optional)"
              sx={{ flex: 1, ...blueFieldSx }}
            />
          )}
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Quantity"
            InputLabelProps={{ shrink: true }}
            inputProps={{ onWheel: blurNumberInputOnWheel }}
            value={formData.quantity}
            onChange={(e) => onChange('quantity', e.target.value)}
            error={qtyInvalid}
            helperText={qtyInvalid ? (formData.quantity === '' ? 'Quantity is required' : 'Must be 0 or greater') : ''}
            sx={{ flex: 1, ...blueFieldSx }}
          />
        </Box>

        {/* Row 2: MRP & Cost Price */}
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="MRP"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ color: '#0b1d39', fontWeight: 700 }}>₹</InputAdornment>,
              inputProps: { onWheel: blurNumberInputOnWheel },
            }}
            value={formData.mrp}
            onChange={(e) => onChange('mrp', e.target.value)}
            error={mrpInvalid || sellingAboveMrp}
            helperText={mrpInvalid ? 'MRP is required' : sellingAboveMrp ? 'MRP must be ≥ Selling Price' : ''}
            sx={{ flex: 1, ...blueFieldSx }}
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Cost Price"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ color: '#0b1d39', fontWeight: 700 }}>₹</InputAdornment>,
              inputProps: { onWheel: blurNumberInputOnWheel },
            }}
            value={formData.costPrice}
            onChange={(e) => onChange('costPrice', e.target.value)}
            error={costPriceInvalid || sellingBelowCost}
            helperText={costPriceInvalid ? 'Cost Price is required' : sellingBelowCost ? 'CP must be ≤ Selling Price' : ''}
            sx={{ flex: 1, ...blueFieldSx }}
          />
        </Box>

        {/* Row 3: Discount Percent & Selling Price */}
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Discount (%)"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: <InputAdornment position="end" sx={{ color: '#0b1d39', fontWeight: 700 }}>%</InputAdornment>,
              inputProps: { onWheel: blurNumberInputOnWheel },
            }}
            value={discountInput}
            onChange={(e) => onChange('discount_percent', e.target.value)}
            sx={{ flex: 1, ...blueFieldSx }}
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Selling Price"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ color: '#059669', fontWeight: 800 }}>₹</InputAdornment>,
              inputProps: { onWheel: blurNumberInputOnWheel },
            }}
            value={formData.sellingPrice}
            onChange={(e) => onChange('sellingPrice', e.target.value)}
            error={sellingPriceInvalid || sellingInvalid}
            helperText={
              sellingPriceInvalid
                ? 'Selling Price is required'
                : sellingInvalid
                  ? sellingBelowCost
                    ? 'Selling Price must be ≥ Cost Price'
                    : 'Selling Price must be ≤ MRP'
                  : ''
            }
            sx={{ flex: 1, ...blueFieldSx }}
          />
        </Box>

        {/* Row 4: Expiry Date */}
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Expiry Date"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: expiryDateMin, max: expiryDateMax }}
            value={formData.expiryDate}
            onChange={(e) => onChange('expiryDate', e.target.value)}
            sx={{ flex: 1, ...blueFieldSx }}
          />
        </Box>
      </Box>

      {/* Optional Wholesale Configuration */}
      <WholesaleConfiguration
        wholesaleEnabled={Boolean(formData.wholesaleEnabled)}
        onToggleChange={(val) => onChange('wholesaleEnabled', val)}
        wholesalePrice={formData.wholesalePrice}
        onPriceChange={(val) => onChange('wholesalePrice', val)}
        wholesaleMinQty={formData.wholesaleMinQty}
        onMinQtyChange={(val) => onChange('wholesaleMinQty', val)}
        sellingPrice={formData.sellingPrice}
        costPrice={formData.costPrice}
        showErrors={showErrors}
      />
    </>
  );
};

export default BatchFormFields;
