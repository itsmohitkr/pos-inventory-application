import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import { formatPrice } from '@/shared/utils/priceUtils';
import { getExpiryDateInputBounds } from '@/shared/utils/expiryDateBounds';
import { blurNumberInputOnWheel } from '@/shared/utils/numberInputScroll';
import WholesaleConfiguration from '@/domains/inventory/components/WholesaleConfiguration';
import PricingSummaryCard from '@/domains/inventory/components/PricingSummaryCard';

const { min: expiryDateMin, max: expiryDateMax } = getExpiryDateInputBounds();

interface BatchFormFieldsProps {
  formData: Record<string, any>;
  discountInput: string;
  onChange: (name: string, value: string | boolean) => void;
  batchTrackingEnabled?: boolean;
}

export const BatchFormFields = ({
  formData,
  discountInput,
  onChange,
  batchTrackingEnabled = false,
}: BatchFormFieldsProps) => {
  const mrp = Number(formData.mrp) || 0;
  const costPrice = Number(formData.costPrice) || 0;
  const sellingPrice = Number(formData.sellingPrice) || 0;
  const quantity = Number(formData.quantity);

  const discountValue = mrp > 0 && sellingPrice > 0 ? Math.max(0, mrp - sellingPrice) : 0;
  const discountPercent = mrp > 0 ? Math.max(0, ((mrp - sellingPrice) / mrp) * 100) : 0;

  const marginValue = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;

  const vendorDiscountValue = mrp > 0 && costPrice > 0 ? Math.max(0, mrp - costPrice) : 0;
  const vendorDiscountPercent = mrp > 0 ? Math.max(0, ((mrp - costPrice) / mrp) * 100) : 0;

  const sellingBelowCost = sellingPrice > 0 && costPrice > 0 && sellingPrice < costPrice;
  const sellingAboveMrp = sellingPrice > 0 && mrp > 0 && sellingPrice > mrp;
  const sellingInvalid = sellingBelowCost || sellingAboveMrp;
  // Empty is invalid too, not just negative/NaN — an empty Quantity field
  // used to silently save as 0 (Number('') || 0), which could zero out a
  // batch's real stock if someone cleared the field to retype it and got
  // interrupted before finishing.
  const qtyInvalid = formData.quantity === '' || isNaN(quantity) || quantity < 0;

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
              sx={{
                flex: 1,
                '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
                '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
              }}
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
            sx={{
              flex: 1,
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
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
            error={sellingAboveMrp}
            helperText={sellingAboveMrp ? 'MRP must be ≥ Selling Price' : ''}
            sx={{
              flex: 1,
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
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
            error={sellingBelowCost}
            helperText={sellingBelowCost ? 'CP must be ≤ Selling Price' : ''}
            sx={{
              flex: 1,
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
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
            sx={{
              flex: 1,
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
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
            error={sellingInvalid}
            helperText={
              sellingInvalid
                ? sellingBelowCost
                  ? 'Selling Price must be ≥ Cost Price'
                  : 'Selling Price must be ≤ MRP'
                : ''
            }
            sx={{
              flex: 1,
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
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
            sx={{
              flex: 1,
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
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
      />
    </>
  );
};

export default BatchFormFields;
