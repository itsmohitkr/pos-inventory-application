import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import type { CategorySale, CategorySaleInput } from '@/domains/promotions/types';
import { useCategorySaleForm } from '@/domains/promotions/components/useCategorySaleForm';
import { useCategorySaleOverrides } from '@/domains/promotions/components/useCategorySaleOverrides';
import { useCategorySaleProductPreview } from '@/domains/promotions/components/useCategorySaleProductPreview';
import CategorySaleProductPreviewPanel from '@/domains/promotions/components/CategorySaleProductPreviewPanel';
import ProductOverridePopover from '@/domains/promotions/components/ProductOverridePopover';

interface CategorySaleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (saleData: CategorySaleInput) => Promise<void>;
  categories: string[];
  saleToEdit?: CategorySale | null;
}

const CategorySaleFormDialog = ({
  open,
  onClose,
  onSave,
  categories,
  saleToEdit,
}: CategorySaleFormDialogProps) => {
  const form = useCategorySaleForm({ open, saleToEdit, categories, onSave, onClose });
  const overrides = useCategorySaleOverrides({ open, saleToEdit });
  const preview = useCategorySaleProductPreview({
    open,
    category: form.category,
    discountPercentage: form.discountPercentage,
    saleToEdit,
    productOverrides: overrides.productOverrides,
  });

  const handleSubmit = (isDraft: boolean = false) =>
    form.handleSubmit(isDraft, preview.previewProducts, preview.selectedProductIds, overrides.productOverrides);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, color: '#0f172a' }}>
        {saleToEdit ? 'Edit Category Sale' : 'Create Category-Based Sale'}
      </DialogTitle>
      <DialogContent dividers>
        {form.formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {form.formError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
          {/* Sale Name, Category & Discount Percentage — single row */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Sale Name"
              placeholder="e.g. Baby Products Festive Discount"
              fullWidth
              required
              size="small"
              sx={{ flex: 1.2 }}
              value={form.name}
              onChange={(e) => form.setName(e.target.value)}
            />
            <TextField
              select
              label="Product Category"
              fullWidth
              required
              size="small"
              sx={{ flex: 1 }}
              value={form.category}
              onChange={(e) => form.setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Discount (%)"
              type="number"
              inputProps={{ min: 0.01, max: 100, step: 0.5 }}
              fullWidth
              required
              size="small"
              sx={{ flex: 0.8 }}
              value={form.discountPercentage}
              onChange={(e) => form.setDiscountPercentage(e.target.value)}
            />
          </Box>

          {preview.avgDiscounts && (
            <Typography variant="caption" sx={{ color: '#64748b', mt: -0.5 }}>
              Avg. vendor discount on this category: <strong>{preview.avgDiscounts.avgVendor.toFixed(1)}%</strong>
              {' · '}
              Avg. discount you already give customers: <strong>{preview.avgDiscounts.avgCustomer.toFixed(1)}%</strong>
            </Typography>
          )}

          {/* Sale Duration Mode */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5, color: '#334155' }}>
              Sale Duration Mode
            </FormLabel>
            <RadioGroup
              row
              value={form.isIndefinite ? 'indefinite' : 'scheduled'}
              onChange={(e) => form.setIsIndefinite(e.target.value === 'indefinite')}
            >
              <FormControlLabel
                value="indefinite"
                control={<Radio />}
                label="Indefinite Sale (Stays active until manually paused/disabled)"
              />
              <FormControlLabel
                value="scheduled"
                control={<Radio />}
                label="Scheduled Sale (Set start & end dates)"
              />
            </RadioGroup>
          </FormControl>

          {/* Simplified Date Pickers (Without Time Input) */}
          {!form.isIndefinite && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => form.setStartDate(e.target.value)}
                helperText="Starts automatically at 12:00 AM (midnight) on this date"
              />
              <TextField
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => form.setEndDate(e.target.value)}
                helperText="Expires automatically at 11:59 PM (end of day) on this date"
              />
            </Box>
          )}

          {/* Color-Coded & Non-Fluctuating Product Preview Table */}
          <CategorySaleProductPreviewPanel
            category={form.category}
            previewProducts={preview.previewProducts}
            filteredProducts={preview.filteredProducts}
            selectedProductIds={preview.selectedProductIds}
            loadingPreview={preview.loadingPreview}
            previewError={preview.previewError}
            statusFilter={preview.statusFilter}
            setStatusFilter={preview.setStatusFilter}
            orderBy={preview.orderBy}
            order={preview.order}
            handleRequestSort={preview.handleRequestSort}
            handleToggleProduct={preview.handleToggleProduct}
            handleSelectAll={preview.handleSelectAll}
            handleDeselectAll={preview.handleDeselectAll}
            isAllSelected={preview.isAllSelected}
            isSomeSelected={preview.isSomeSelected}
            handleToggleSelectAll={preview.handleToggleSelectAll}
            summaryCounts={preview.summaryCounts}
            productOverrides={overrides.productOverrides}
            computeOverridePreview={overrides.computeOverridePreview}
            openOverridePopover={overrides.openOverridePopover}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="secondary"
          disabled={form.saving}
          onClick={() => handleSubmit(true)}
        >
          Save as Draft
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={form.saving}
            onClick={() => handleSubmit(false)}
            sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
          >
            {form.saving ? 'Publishing...' : saleToEdit ? 'Update Sale' : 'Publish Sale'}
          </Button>
        </Box>
      </DialogActions>

      <ProductOverridePopover
        overridePopover={overrides.overridePopover}
        onClose={overrides.closeOverridePopover}
        overrideDiscountInput={overrides.overrideDiscountInput}
        setOverrideDiscountInput={overrides.setOverrideDiscountInput}
        overrideReasonInput={overrides.overrideReasonInput}
        setOverrideReasonInput={overrides.setOverrideReasonInput}
        overrideError={overrides.overrideError}
        hasExistingOverride={
          !!overrides.overridePopover && overrides.productOverrides.has(overrides.overridePopover.product.id)
        }
        onRemove={overrides.handleRemoveOverride}
        onSave={overrides.handleSaveOverride}
      />
    </Dialog>
  );
};

export default CategorySaleFormDialog;
