import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  TableSortLabel,
  Checkbox,
  Popover,
  Stack,
  IconButton,
} from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import type {
  CategorySale,
  CategorySaleInput,
  CategorySaleProductOverride,
  CategorySaleProductPreview,
} from '@/domains/promotions/types';
import categorySaleService from '@/shared/api/categorySaleService';
import type { ApiError } from '@/shared/api/api';

type SortField = keyof CategorySaleProductPreview;

/** Which bucket a preview row falls into — drives both the summary counts and the filter chips. */
type RowStatusFilter =
  | 'all'
  | 'eligible'
  | 'alreadyBetter'
  | 'marginProtected'
  | 'overridden'
  | 'noPricingData'
  | 'excluded';

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
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('10');
  const [isIndefinite, setIsIndefinite] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'paused'>('active');

  const [previewProducts, setPreviewProducts] = useState<CategorySaleProductPreview[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RowStatusFilter>('all');

  // Admin-gated per-product overrides, entered as draft state here and only
  // sent to the server on submit (excludedProductIds already works the same
  // way — the preview endpoint has no knowledge of either until saved).
  const [productOverrides, setProductOverrides] = useState<
    Map<number, { discountPercentage: number; reason: string }>
  >(new Map());
  const [overridePopover, setOverridePopover] = useState<{
    anchorEl: HTMLElement;
    product: CategorySaleProductPreview;
  } | null>(null);
  const [overrideDiscountInput, setOverrideDiscountInput] = useState('');
  const [overrideReasonInput, setOverrideReasonInput] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Sorting state
  const [orderBy, setOrderBy] = useState<SortField>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const handleRequestSort = (property: SortField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedProducts = React.useMemo(() => {
    return [...previewProducts].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return order === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [previewProducts, orderBy, order]);

  useEffect(() => {
    if (saleToEdit) {
      setName(saleToEdit.name);
      setCategory(saleToEdit.category);
      setDiscountPercentage(String(saleToEdit.discountPercentage));
      setIsIndefinite(saleToEdit.isIndefinite);
      setStartDate(
        saleToEdit.startDate ? new Date(saleToEdit.startDate).toISOString().slice(0, 10) : ''
      );
      setEndDate(
        saleToEdit.endDate ? new Date(saleToEdit.endDate).toISOString().slice(0, 10) : ''
      );
      setStatus(saleToEdit.status);
      setProductOverrides(
        new Map(
          (saleToEdit.productOverrides ?? []).map((o) => [
            o.productId,
            { discountPercentage: o.discountPercentage, reason: o.reason },
          ])
        )
      );
    } else {
      setName('');
      setCategory(categories[0] || '');
      setDiscountPercentage('10');
      setIsIndefinite(true);
      setStartDate('');
      setEndDate('');
      setStatus('active');
      setProductOverrides(new Map());
    }
    setStatusFilter('all');
    setFormError(null);
  }, [saleToEdit, open, categories]);

  // Debounced product preview fetching to prevent recalculation screen flickering
  useEffect(() => {
    setStatusFilter('all');
    const discount = parseFloat(discountPercentage);
    if (!category || isNaN(discount) || discount <= 0 || discount > 100) {
      setPreviewProducts([]);
      setSelectedProductIds(new Set());
      return;
    }

    let isMounted = true;
    setLoadingPreview(true);
    setPreviewError(null);

    const timer = setTimeout(() => {
      categorySaleService
        .previewProducts(category, discount)
        .then((data) => {
          if (isMounted) {
            setPreviewProducts(data);
            setLoadingPreview(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setPreviewError('Failed to load product preview');
            setLoadingPreview(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [category, discountPercentage]);

  // Sync selectedProductIds when previewProducts or saleToEdit changes
  useEffect(() => {
    if (previewProducts.length > 0) {
      if (saleToEdit && saleToEdit.category === category && saleToEdit.excludedProductIds) {
        const excluded = new Set(saleToEdit.excludedProductIds);
        setSelectedProductIds(new Set(previewProducts.map((p) => p.id).filter((id) => !excluded.has(id))));
      } else {
        setSelectedProductIds(new Set(previewProducts.map((p) => p.id)));
      }
    } else {
      setSelectedProductIds(new Set());
    }
  }, [previewProducts, saleToEdit, category]);

  const handleToggleProduct = (id: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedProductIds(new Set(previewProducts.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedProductIds(new Set());
  };

  const isAllSelected =
    previewProducts.length > 0 && previewProducts.every((p) => selectedProductIds.has(p.id));
  const isSomeSelected =
    previewProducts.some((p) => selectedProductIds.has(p.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  };

  /**
   * The same "MRP discount, no floor, no comparison to current price" math
   * category-sale.service.ts's previewCategorySaleProducts and
   * sale.service.ts's getCategorySalePrice use for a saved override —
   * mirrored here purely for instant preview feedback while the admin is
   * typing. The server remains authoritative at save/checkout time.
   */
  const computeOverridePreview = (product: CategorySaleProductPreview, discountPct: number) => {
    const basePrice = product.mrp > 0 ? product.mrp : product.currentSellingPrice;
    const price = Math.round(basePrice * (1 - discountPct / 100) * 100) / 100;
    const profitAmount = Math.round((price - product.costPrice) * 100) / 100;
    const profitMargin = price > 0 ? Math.round(((price - product.costPrice) / price) * 1000) / 10 : 0;
    return { price, profitAmount, profitMargin };
  };

  const openOverridePopover = (event: React.MouseEvent<HTMLElement>, product: CategorySaleProductPreview) => {
    const existing = productOverrides.get(product.id);
    setOverrideDiscountInput(existing ? String(existing.discountPercentage) : String(product.discountPercentage));
    setOverrideReasonInput(existing?.reason ?? '');
    setOverrideError(null);
    setOverridePopover({ anchorEl: event.currentTarget, product });
  };

  const closeOverridePopover = () => {
    setOverridePopover(null);
    setOverrideError(null);
  };

  const handleSaveOverride = () => {
    if (!overridePopover) return;
    const pct = parseFloat(overrideDiscountInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setOverrideError('Discount percentage must be between 0 and 100.');
      return;
    }
    if (overrideReasonInput.trim().length < 3) {
      setOverrideError('A reason is required (at least 3 characters).');
      return;
    }
    setProductOverrides((prev) => {
      const next = new Map(prev);
      next.set(overridePopover.product.id, {
        discountPercentage: pct,
        reason: overrideReasonInput.trim(),
      });
      return next;
    });
    closeOverridePopover();
  };

  const handleRemoveOverride = () => {
    if (!overridePopover) return;
    setProductOverrides((prev) => {
      const next = new Map(prev);
      next.delete(overridePopover.product.id);
      return next;
    });
    closeOverridePopover();
  };

  /**
   * Single source of truth for which bucket a row falls into — used by both
   * the summary counts and the clickable filter chips, so they can never
   * disagree with each other.
   */
  const getRowStatus = React.useCallback(
    (p: CategorySaleProductPreview): RowStatusFilter => {
      if (!selectedProductIds.has(p.id)) return 'excluded';
      if (!p.hasPricingData) return 'noPricingData';
      if (productOverrides.has(p.id)) return 'overridden';
      if (p.noAdditionalDiscount) return 'alreadyBetter';
      if (p.marginProtected) return 'marginProtected';
      return 'eligible';
    },
    [selectedProductIds, productOverrides]
  );

  // Cheap to derive from what's already loaded — no separate server call.
  const summaryCounts = React.useMemo(() => {
    const counts = {
      eligible: 0,
      alreadyBetter: 0,
      marginProtected: 0,
      overridden: 0,
      noPricingData: 0,
      excluded: 0,
    };
    previewProducts.forEach((p) => {
      const status = getRowStatus(p);
      counts[status] += 1;
    });
    return counts;
  }, [previewProducts, getRowStatus]);

  /**
   * Rough guidance for picking a discount: what suppliers already give us
   * (vendor discount off MRP) vs. what we already pass on to customers
   * (regular selling-price discount off MRP), averaged across products that
   * actually have pricing data. Purely informational — not used in any
   * calculation.
   */
  const avgDiscounts = React.useMemo(() => {
    const priced = previewProducts.filter((p) => p.hasPricingData);
    if (priced.length === 0) return null;
    const avgVendor =
      priced.reduce((sum, p) => sum + p.vendorDiscountPercentage, 0) / priced.length;
    const avgCustomer =
      priced.reduce((sum, p) => sum + p.currentCustomerDiscountPercentage, 0) / priced.length;
    return { avgVendor, avgCustomer };
  }, [previewProducts]);

  const filteredProducts = React.useMemo(() => {
    if (statusFilter === 'all') return sortedProducts;
    return sortedProducts.filter((p) => getRowStatus(p) === statusFilter);
  }, [sortedProducts, statusFilter, getRowStatus]);

  const handleSubmit = async (isDraft: boolean = false) => {
    setFormError(null);
    const discount = parseFloat(discountPercentage);

    if (!name.trim()) {
      setFormError('Sale name is required.');
      return;
    }
    if (!category) {
      setFormError('Please select a product category.');
      return;
    }
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      setFormError('Discount percentage must be between 0.01% and 100%.');
      return;
    }
    if (!isIndefinite && !isDraft) {
      if (!startDate || !endDate) {
        setFormError('Start and end dates are required for scheduled sales.');
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setFormError('End date must be on or after start date.');
        return;
      }
    }

    if (selectedProductIds.size === 0 && !isDraft) {
      setFormError('Please select at least one product to include in the sale.');
      return;
    }

    const excludedProductIds = previewProducts
      .map((p) => p.id)
      .filter((id) => !selectedProductIds.has(id));

    // Only overrides on products still selected (an excluded product's
    // override, if any, is dropped rather than sent to the server).
    const productOverridesPayload: CategorySaleProductOverride[] = Array.from(
      productOverrides.entries()
    )
      .filter(([productId]) => selectedProductIds.has(productId))
      .map(([productId, o]) => ({ productId, ...o }));

    setSaving(true);
    try {
      // Default scheduled start to 12:00 AM midnight, end to 11:59:59 PM end of day
      const formattedStartDate =
        !isIndefinite && startDate ? new Date(`${startDate}T00:00:00.000`).toISOString() : null;
      const formattedEndDate =
        !isIndefinite && endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : null;

      await onSave({
        name: name.trim(),
        category,
        discountPercentage: discount,
        isIndefinite,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: isDraft ? 'draft' : status === 'draft' ? 'active' : status,
        excludedProductIds,
        productOverrides: productOverridesPayload,
      });
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.response?.status === 401 || apiErr.response?.status === 403) {
        setFormError(
          'This sale includes an admin-approved product override — verify as admin and try again.'
        );
      } else {
        setFormError(apiErr.response?.data?.message || 'Failed to save category sale.');
      }
    } finally {
      setSaving(false);
    }
  };

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
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              select
              label="Product Category"
              fullWidth
              required
              size="small"
              sx={{ flex: 1 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
            />
          </Box>

          {avgDiscounts && (
            <Typography variant="caption" sx={{ color: '#64748b', mt: -0.5 }}>
              Avg. vendor discount on this category: <strong>{avgDiscounts.avgVendor.toFixed(1)}%</strong>
              {' · '}
              Avg. discount you already give customers: <strong>{avgDiscounts.avgCustomer.toFixed(1)}%</strong>
            </Typography>
          )}

          {/* Sale Duration Mode */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5, color: '#334155' }}>
              Sale Duration Mode
            </FormLabel>
            <RadioGroup
              row
              value={isIndefinite ? 'indefinite' : 'scheduled'}
              onChange={(e) => setIsIndefinite(e.target.value === 'indefinite')}
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
          {!isIndefinite && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                helperText="Starts automatically at 12:00 AM (midnight) on this date"
              />
              <TextField
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                helperText="Expires automatically at 11:59 PM (end of day) on this date"
              />
            </Box>
          )}

          {/* Color-Coded & Non-Fluctuating Product Preview Table */}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                Product Selection & Impact Preview ({selectedProductIds.size} of {previewProducts.length} products selected)
              </Typography>
              {previewProducts.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectAll}
                    disabled={isAllSelected}
                    sx={{ fontSize: '0.725rem', py: 0.2, px: 1, textTransform: 'none' }}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={handleDeselectAll}
                    disabled={selectedProductIds.size === 0}
                    sx={{ fontSize: '0.725rem', py: 0.2, px: 1, textTransform: 'none' }}
                  >
                    Deselect All
                  </Button>
                </Box>
              )}
            </Box>

            {previewProducts.length > 0 && !loadingPreview && (
              <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', rowGap: 0.5, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, mr: 0.5 }}>
                  View:
                </Typography>
                <Chip
                  size="small"
                  label={`All (${previewProducts.length})`}
                  variant={statusFilter === 'all' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('all')}
                  sx={{ fontWeight: 700, cursor: 'pointer' }}
                />
                <Chip
                  size="small"
                  label={`${summaryCounts.eligible} eligible`}
                  variant={statusFilter === 'eligible' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter(statusFilter === 'eligible' ? 'all' : 'eligible')}
                  sx={{
                    fontWeight: 700,
                    cursor: 'pointer',
                    bgcolor: statusFilter === 'eligible' ? '#fff7ed' : 'transparent',
                    borderColor: '#fdba74',
                    color: '#c2410c',
                  }}
                />
                {summaryCounts.alreadyBetter > 0 && (
                  <Chip
                    size="small"
                    label={`${summaryCounts.alreadyBetter} already better priced`}
                    variant={statusFilter === 'alreadyBetter' ? 'filled' : 'outlined'}
                    onClick={() => setStatusFilter(statusFilter === 'alreadyBetter' ? 'all' : 'alreadyBetter')}
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'alreadyBetter' ? '#f1f5f9' : 'transparent',
                      borderColor: '#cbd5e1',
                      color: '#475569',
                    }}
                  />
                )}
                {summaryCounts.marginProtected > 0 && (
                  <Chip
                    size="small"
                    label={`${summaryCounts.marginProtected} margin-protected`}
                    variant={statusFilter === 'marginProtected' ? 'filled' : 'outlined'}
                    onClick={() => setStatusFilter(statusFilter === 'marginProtected' ? 'all' : 'marginProtected')}
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'marginProtected' ? '#eef2ff' : 'transparent',
                      borderColor: '#a5b4fc',
                      color: '#4338ca',
                    }}
                  />
                )}
                {summaryCounts.overridden > 0 && (
                  <Chip
                    size="small"
                    icon={<AdminIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label={`${summaryCounts.overridden} admin override${summaryCounts.overridden === 1 ? '' : 's'}`}
                    variant={statusFilter === 'overridden' ? 'filled' : 'outlined'}
                    onClick={() => setStatusFilter(statusFilter === 'overridden' ? 'all' : 'overridden')}
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'overridden' ? '#fef2f2' : 'transparent',
                      borderColor: '#fca5a5',
                      color: '#b91c1c',
                    }}
                  />
                )}
                {summaryCounts.noPricingData > 0 && (
                  <Tooltip title="No stock has ever been added for these products, so there's no MRP, cost, or selling price to discount." arrow>
                    <Chip
                      size="small"
                      label={`${summaryCounts.noPricingData} no pricing data`}
                      variant={statusFilter === 'noPricingData' ? 'filled' : 'outlined'}
                      onClick={() => setStatusFilter(statusFilter === 'noPricingData' ? 'all' : 'noPricingData')}
                      sx={{
                        fontWeight: 700,
                        cursor: 'pointer',
                        bgcolor: statusFilter === 'noPricingData' ? '#fefce8' : 'transparent',
                        borderColor: '#fde047',
                        color: '#a16207',
                      }}
                    />
                  </Tooltip>
                )}
                {summaryCounts.excluded > 0 && (
                  <Chip
                    size="small"
                    label={`${summaryCounts.excluded} excluded`}
                    variant={statusFilter === 'excluded' ? 'filled' : 'outlined'}
                    onClick={() => setStatusFilter(statusFilter === 'excluded' ? 'all' : 'excluded')}
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: statusFilter === 'excluded' ? '#f8fafc' : 'transparent',
                      borderColor: '#e2e8f0',
                      color: '#64748b',
                    }}
                  />
                )}
              </Stack>
            )}

            <Paper
              variant="outlined"
              sx={{
                height: 480,
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Overlay Spinner while updating preview */}
              {loadingPreview && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={32} sx={{ color: '#0f172a' }} />
                </Box>
              )}

              {previewError ? (
                <Alert severity="warning" sx={{ m: 2 }}>
                  {previewError}
                </Alert>
              ) : previewProducts.length === 0 && !loadingPreview ? (
                <Box sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No products found in category "{category}".
                  </Typography>
                </Box>
              ) : filteredProducts.length === 0 && !loadingPreview ? (
                <Box sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No products match this filter.
                  </Typography>
                  <Button size="small" onClick={() => setStatusFilter('all')} sx={{ mt: 1, textTransform: 'none' }}>
                    Clear filter
                  </Button>
                </Box>
              ) : (
                <TableContainer sx={{ flex: 1, height: '100%' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      {/* Top Group Header Row */}
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            bgcolor: '#f1f5f9',
                            color: '#334155',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderRight: '1px solid #cbd5e1',
                            py: 0.75,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          1. Product Baseline
                        </TableCell>
                        <TableCell
                          colSpan={2}
                          align="center"
                          sx={{
                            bgcolor: '#ccfbf1',
                            color: '#0f766e',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderRight: '1px solid #99f6e4',
                            py: 0.75,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          2. Vendor Discount
                        </TableCell>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            bgcolor: '#e0e7ff',
                            color: '#3730a3',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderRight: '1px solid #c7d2fe',
                            py: 0.75,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          3. Current Store Pricing & Profit
                        </TableCell>
                        <TableCell
                          colSpan={2}
                          align="center"
                          sx={{
                            bgcolor: '#ffedd5',
                            color: '#9a3412',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderRight: '1px solid #fed7aa',
                            py: 0.75,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          4. Proposed Category Sale
                        </TableCell>
                        <TableCell
                          colSpan={2}
                          align="center"
                          sx={{
                            bgcolor: '#dcfce7',
                            color: '#166534',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            py: 0.75,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          5. Profitability During Sale
                        </TableCell>
                      </TableRow>

                      {/* Sub-Header Column Titles with Sorting */}
                      <TableRow>
                        {/* Group 1 Columns */}
                        <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc', width: 48 }}>
                          <Checkbox
                            size="small"
                            checked={isAllSelected}
                            indeterminate={isSomeSelected}
                            onChange={handleToggleSelectAll}
                            disabled={loadingPreview || previewProducts.length === 0}
                          />
                        </TableCell>
                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>
                          <TableSortLabel
                            active={orderBy === 'name'}
                            direction={orderBy === 'name' ? order : 'asc'}
                            onClick={() => handleRequestSort('name')}
                          >
                            Product Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 700 }}>
                          <TableSortLabel
                            active={orderBy === 'mrp'}
                            direction={orderBy === 'mrp' ? order : 'asc'}
                            onClick={() => handleRequestSort('mrp')}
                          >
                            MRP
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>
                          <TableSortLabel
                            active={orderBy === 'costPrice'}
                            direction={orderBy === 'costPrice' ? order : 'asc'}
                            onClick={() => handleRequestSort('costPrice')}
                          >
                            Cost Price
                          </TableSortLabel>
                        </TableCell>
                        
                        {/* Group 2 Columns */}
                        <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 700, color: '#0f766e' }}>
                          <TableSortLabel
                            active={orderBy === 'vendorDiscountAmount'}
                            direction={orderBy === 'vendorDiscountAmount' ? order : 'asc'}
                            onClick={() => handleRequestSort('vendorDiscountAmount')}
                          >
                            Vendor Discount
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 700, color: '#0f766e', borderRight: '1px solid #ccfbf1' }}>
                          <TableSortLabel
                            active={orderBy === 'vendorDiscountPercentage'}
                            direction={orderBy === 'vendorDiscountPercentage' ? order : 'asc'}
                            onClick={() => handleRequestSort('vendorDiscountPercentage')}
                          >
                            Vendor %
                          </TableSortLabel>
                        </TableCell>

                        {/* Group 3 Columns */}
                        <TableCell align="right" sx={{ bgcolor: '#f5f3ff', fontWeight: 700, color: '#4338ca' }}>
                          <TableSortLabel
                            active={orderBy === 'currentSellingPrice'}
                            direction={orderBy === 'currentSellingPrice' ? order : 'asc'}
                            onClick={() => handleRequestSort('currentSellingPrice')}
                          >
                            Current Selling Price
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f3ff', fontWeight: 700, color: '#4338ca' }}>
                          <TableSortLabel
                            active={orderBy === 'currentCustomerDiscountPercentage'}
                            direction={orderBy === 'currentCustomerDiscountPercentage' ? order : 'asc'}
                            onClick={() => handleRequestSort('currentCustomerDiscountPercentage')}
                          >
                            Regular Disc %
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f3ff', fontWeight: 700, color: '#4338ca' }}>
                          <TableSortLabel
                            active={orderBy === 'regularProfitAmount'}
                            direction={orderBy === 'regularProfitAmount' ? order : 'asc'}
                            onClick={() => handleRequestSort('regularProfitAmount')}
                          >
                            Regular Profit
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f3ff', fontWeight: 700, color: '#4338ca', borderRight: '1px solid #ddd6fe' }}>
                          <TableSortLabel
                            active={orderBy === 'regularProfitMargin'}
                            direction={orderBy === 'regularProfitMargin' ? order : 'asc'}
                            onClick={() => handleRequestSort('regularProfitMargin')}
                          >
                            Regular Margin %
                          </TableSortLabel>
                        </TableCell>

                        {/* Group 4 Columns */}
                        <TableCell align="right" sx={{ bgcolor: '#fff7ed', fontWeight: 700, color: '#ea580c' }}>
                          <TableSortLabel
                            active={orderBy === 'discountPercentage'}
                            direction={orderBy === 'discountPercentage' ? order : 'asc'}
                            onClick={() => handleRequestSort('discountPercentage')}
                          >
                            Sale Disc %
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#fff7ed', fontWeight: 700, color: '#ea580c', borderRight: '1px solid #ffedd5' }}>
                          <TableSortLabel
                            active={orderBy === 'newSellingPrice'}
                            direction={orderBy === 'newSellingPrice' ? order : 'asc'}
                            onClick={() => handleRequestSort('newSellingPrice')}
                          >
                            New Selling Price
                          </TableSortLabel>
                        </TableCell>

                        {/* Group 5 Columns */}
                        <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 700, color: '#15803d' }}>
                          <TableSortLabel
                            active={orderBy === 'profitAmount'}
                            direction={orderBy === 'profitAmount' ? order : 'asc'}
                            onClick={() => handleRequestSort('profitAmount')}
                          >
                            Sale Profit
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f0fdf4', fontWeight: 700, color: '#15803d' }}>
                          <TableSortLabel
                            active={orderBy === 'profitMargin'}
                            direction={orderBy === 'profitMargin' ? order : 'asc'}
                            onClick={() => handleRequestSort('profitMargin')}
                          >
                            Sale Margin %
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProducts.map((p) => {
                        const isSelected = selectedProductIds.has(p.id);
                        const override = productOverrides.get(p.id);
                        const overrideResult = override ? computeOverridePreview(p, override.discountPercentage) : null;
                        const displayPrice = overrideResult ? overrideResult.price : p.newSellingPrice;
                        const displayProfitAmount = overrideResult ? overrideResult.profitAmount : p.profitAmount;
                        const displayProfitMargin = overrideResult ? overrideResult.profitMargin : p.profitMargin;
                        const isNegativeMargin = isSelected ? displayProfitMargin < 0 : p.regularProfitMargin < 0;
                        const canOverride =
                          isSelected && p.hasPricingData && (!!override || p.noAdditionalDiscount || p.marginProtected);
                        return (
                          <TableRow
                            key={p.id}
                            hover
                            sx={{
                              bgcolor: !isSelected ? '#f8fafc' : isNegativeMargin ? '#fef2f2' : 'inherit',
                              opacity: !isSelected ? 0.65 : 1,
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={isSelected}
                                onChange={() => handleToggleProduct(p.id)}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {p.name}
                              {!p.hasPricingData && (
                                <Tooltip title="No stock has ever been added for this product — there's no MRP, cost, or selling price yet." arrow>
                                  <Chip
                                    label="No stock"
                                    size="small"
                                    sx={{ ml: 1, height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#fefce8', color: '#a16207' }}
                                  />
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell align="right">{p.hasPricingData ? p.mrp.toFixed(2) : '—'}</TableCell>
                            <TableCell align="right" sx={{ borderRight: '1px solid #e2e8f0' }}>
                              {p.hasPricingData ? p.costPrice.toFixed(2) : '—'}
                            </TableCell>

                            {/* Group 2 Data: Vendor Discount */}
                            <TableCell align="right" sx={{ bgcolor: isSelected ? '#f0fdf4' : 'inherit', color: '#0f766e', fontWeight: 600 }}>
                              {p.hasPricingData ? p.vendorDiscountAmount.toFixed(2) : '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: isSelected ? '#f0fdf4' : 'inherit', color: '#0f766e', borderRight: '1px solid #e2e8f0' }}>
                              {p.hasPricingData ? `${p.vendorDiscountPercentage}%` : '—'}
                            </TableCell>

                            {/* Group 3 Data: Regular Store Pricing & Profit */}
                            <TableCell align="right" sx={{ bgcolor: isSelected ? '#f5f3ff' : 'inherit', fontWeight: 600 }}>
                              {p.hasPricingData ? p.currentSellingPrice.toFixed(2) : '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: isSelected ? '#f5f3ff' : 'inherit', color: '#4338ca', fontWeight: 600 }}>
                              {p.hasPricingData ? `${p.currentCustomerDiscountPercentage}%` : '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: isSelected ? '#f5f3ff' : 'inherit', color: '#4338ca', fontWeight: 600 }}>
                              {p.hasPricingData ? p.regularProfitAmount.toFixed(2) : '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: isSelected ? '#f5f3ff' : 'inherit', borderRight: '1px solid #e2e8f0' }}>
                              {p.hasPricingData ? (
                                <Chip
                                  label={`${p.regularProfitMargin}%`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem', borderColor: '#a5b4fc', color: '#4338ca' }}
                                />
                              ) : (
                                '—'
                              )}
                            </TableCell>

                            {/* Group 4 Data: Proposed Category Sale */}
                            <TableCell align="right" sx={{ bgcolor: isSelected ? '#fff7ed' : 'inherit', color: isSelected ? '#ea580c' : '#64748b', fontWeight: 700 }}>
                              {!isSelected ? (
                                'Excluded'
                              ) : !p.hasPricingData ? (
                                <Tooltip title="No stock has ever been added for this product, so there's nothing to discount." arrow>
                                  <span>No pricing data</span>
                                </Tooltip>
                              ) : override ? (
                                <Tooltip title={`Admin override: ${override.reason}`} arrow>
                                  <span>{override.discountPercentage}% (override)</span>
                                </Tooltip>
                              ) : p.noAdditionalDiscount ? (
                                <Tooltip title="This product's current regular price is already lower than (or equal to) what this category discount would offer, so it keeps its regular price." arrow>
                                  <span>No extra discount</span>
                                </Tooltip>
                              ) : (
                                `${p.discountPercentage}% OFF`
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: isSelected ? '#fff7ed' : 'inherit', fontWeight: 800, color: isSelected ? '#c2410c' : '#475569', borderRight: '1px solid #e2e8f0' }}>
                              {!p.hasPricingData ? '—' : isSelected ? displayPrice.toFixed(2) : p.currentSellingPrice.toFixed(2)}
                            </TableCell>

                            {/* Group 5 Data: Sale Profitability */}
                            <TableCell
                              align="right"
                              sx={{
                                bgcolor: !isSelected ? 'inherit' : isNegativeMargin ? '#fee2e2' : '#f0fdf4',
                                fontWeight: 700,
                                color: !isSelected ? '#475569' : isNegativeMargin ? '#dc2626' : '#15803d',
                              }}
                            >
                              {!p.hasPricingData
                                ? '—'
                                : isSelected
                                  ? displayProfitAmount.toFixed(2)
                                  : p.regularProfitAmount.toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: !isSelected ? 'inherit' : isNegativeMargin ? '#fee2e2' : '#f0fdf4' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                {!p.hasPricingData ? (
                                  <Chip label="—" size="small" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                                ) : (
                                  <Chip
                                    label={`${isSelected ? displayProfitMargin : p.regularProfitMargin}%`}
                                    size="small"
                                    color={!isSelected ? 'default' : isNegativeMargin ? 'error' : 'success'}
                                    variant={!isSelected ? 'outlined' : isNegativeMargin ? 'filled' : 'outlined'}
                                    sx={{ height: 22, fontWeight: 700 }}
                                  />
                                )}
                                {isSelected && override && (
                                  <Tooltip title={`Admin override: ${override.reason}`} arrow>
                                    <Chip
                                      icon={<AdminIcon sx={{ fontSize: '0.9rem !important' }} />}
                                      label="Admin override"
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, borderColor: '#fca5a5', color: '#b91c1c' }}
                                    />
                                  </Tooltip>
                                )}
                                {isSelected && !override && p.marginProtected && (
                                  <Tooltip title="The discount was capped at your cost price to avoid selling this product at a loss." arrow>
                                    <Chip
                                      label="Margin protected"
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, borderColor: '#a5b4fc', color: '#4338ca' }}
                                    />
                                  </Tooltip>
                                )}
                                {canOverride && (
                                  <Tooltip title={override ? 'Edit admin override' : 'Admin: override this discount'} arrow>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => openOverridePopover(e, p)}
                                      sx={{ p: 0.25, color: override ? '#b91c1c' : '#94a3b8' }}
                                    >
                                      <AdminIcon sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="secondary"
          disabled={saving}
          onClick={() => handleSubmit(true)}
        >
          Save as Draft
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => handleSubmit(false)}
            sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
          >
            {saving ? 'Publishing...' : saleToEdit ? 'Update Sale' : 'Publish Sale'}
          </Button>
        </Box>
      </DialogActions>

      <Popover
        open={!!overridePopover}
        anchorEl={overridePopover?.anchorEl}
        onClose={closeOverridePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {overridePopover && (
          <Box sx={{ p: 2, width: 300 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Admin override — {overridePopover.product.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Bypasses the automatic margin floor. Use only for a deliberate
              pricing decision (e.g. a festival clearance sold below cost).
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Discount Percentage (%)"
                type="number"
                size="small"
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.5 }}
                value={overrideDiscountInput}
                onChange={(e) => setOverrideDiscountInput(e.target.value)}
              />
              <TextField
                label="Reason"
                placeholder="e.g. Festival clearance, expiring stock"
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={overrideReasonInput}
                onChange={(e) => setOverrideReasonInput(e.target.value)}
              />
              {overrideError && (
                <Alert severity="error" sx={{ py: 0 }}>
                  {overrideError}
                </Alert>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                {productOverrides.has(overridePopover.product.id) ? (
                  <Button size="small" color="error" onClick={handleRemoveOverride}>
                    Remove Override
                  </Button>
                ) : (
                  <Box />
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={closeOverridePopover}>
                    Cancel
                  </Button>
                  <Button size="small" variant="contained" onClick={handleSaveOverride}>
                    Save
                  </Button>
                </Box>
              </Box>
            </Stack>
          </Box>
        )}
      </Popover>
    </Dialog>
  );
};

export default CategorySaleFormDialog;
