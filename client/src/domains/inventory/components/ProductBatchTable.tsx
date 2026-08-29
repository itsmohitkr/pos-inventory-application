import type { Batch, Product } from '@/shared/types/models';
import React, { useState, useEffect } from 'react';
import { formatPrice, limitTwoDecimals } from '@/shared/utils/priceUtils';
import api, { getApiErrorMessage } from '@/shared/api/api';
import inventoryService from '@/shared/api/inventoryService';
import { getExpiryDateInputBounds } from '@/shared/utils/expiryDateBounds';
import BatchFormFields from '@/domains/inventory/components/BatchFormFields';
import { blurNumberInputOnWheel } from '@/shared/utils/numberInputScroll';
import * as Sentry from '@sentry/react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddStockIcon,
  Event as ExpiryIcon,
  Add as AddIcon,
  WarningOutlined as WarningIcon,
  FlashOn as QuickIcon,
} from '@mui/icons-material';

const { min: expiryDateMin, max: expiryDateMax } = getExpiryDateInputBounds();

interface ProductBatchTableProps {
  batches: Batch[];
  product?: Product | null;
  /** Shows the batch-code and expiry columns when true. */
  batchTrackingEnabled?: boolean;
  onAddStock?: () => void;
  onQuickInventoryOpen?: (batch: Batch) => void;
  onBatchEditClick?: (batch: Batch) => void;
  /** Must already be confirmed by the caller — this component's own inline
   * confirm card is the confirmation step, so this should reject on
   * failure rather than showing a second confirmation dialog. */
  onBatchDelete: (batchId: number) => Promise<void>;
  onBatchUpdated?: () => void;
}

const ProductBatchTable = ({
  batches,
  product,
  batchTrackingEnabled = false,
  onAddStock,
  onQuickInventoryOpen,
  onBatchEditClick,
  onBatchDelete,
  onBatchUpdated,
}: ProductBatchTableProps) => {
  // Track active inline form per batch card ('add' uses batchId = 0)
  const [inlineAction, setInlineAction] = useState<{
    batchId: number;
    mode: 'quick' | 'edit' | 'delete' | 'add';
  } | null>(null);

  // Weighted average cost setting
  const [isAveragingEnabled, setIsAveragingEnabled] = useState(false);

  // Inline Quick Stock form state
  const [addQty, setAddQty] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline Edit Batch Details form state
  const [editFormData, setEditFormData] = useState<Record<string, any>>({
    batchCode: '',
    quantity: '',
    mrp: '',
    costPrice: '',
    sellingPrice: '',
    wholesaleEnabled: false,
    wholesalePrice: '',
    wholesaleMinQty: '',
    expiryDate: '',
  });
  const [editDiscountInput, setEditDiscountInput] = useState('0');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Inline Add New Batch form state
  const [addBatchFormData, setAddBatchFormData] = useState<Record<string, any>>({
    batchCode: '',
    quantity: '',
    mrp: '',
    costPrice: '',
    sellingPrice: '',
    wholesaleEnabled: false,
    wholesalePrice: '',
    wholesaleMinQty: '',
    expiryDate: '',
  });
  const [addBatchDiscountInput, setAddBatchDiscountInput] = useState('0');
  const [isSavingAddBatch, setIsSavingAddBatch] = useState(false);
  const [addBatchErrorMsg, setAddBatchErrorMsg] = useState<string | null>(null);

  // Confirmation feedback for recently updated batch card
  const [justUpdatedBatchId, setJustUpdatedBatchId] = useState<number | null>(null);

  // Fetch settings on mount to check weighted average cost option
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        if (res.data?.data?.posEnableWeightedAverageCost) {
          setIsAveragingEnabled(true);
        } else {
          setIsAveragingEnabled(false);
        }
      } catch (error) {
        console.error('Failed to fetch settings in ProductBatchTable:', error);
      }
    };
    fetchSettings();
  }, []);

  // Automatically close inline New Batch form if batch tracking is toggled OFF
  useEffect(() => {
    if (!batchTrackingEnabled && inlineAction?.mode === 'add') {
      setInlineAction(null);
      setAddBatchErrorMsg(null);
    }
  }, [batchTrackingEnabled, inlineAction?.mode]);

  const handleToggleInlineAdd = () => {
    if (inlineAction?.mode === 'add') {
      setInlineAction(null);
      setAddBatchErrorMsg(null);
    } else {
      setInlineAction({ batchId: 0, mode: 'add' });
      setAddBatchErrorMsg(null);

      setAddBatchFormData({
        batchCode: '',
        quantity: '',
        mrp: '',
        costPrice: '',
        sellingPrice: '',
        wholesaleEnabled: false,
        wholesalePrice: '',
        wholesaleMinQty: '',
        expiryDate: '',
      });
      setAddBatchDiscountInput('0');
      onAddStock?.();
    }
  };

  const handleToggleInlineQuick = (batch: Batch) => {
    if (inlineAction?.batchId === batch.id && inlineAction.mode === 'quick') {
      setInlineAction(null);
      setErrorMsg(null);
    } else {
      setInlineAction({ batchId: batch.id, mode: 'quick' });
      setAddQty('');
      setNewCostPrice(batch.costPrice ? String(batch.costPrice) : '');
      setErrorMsg(null);
      onQuickInventoryOpen?.(batch);
    }
  };

  const handleToggleInlineEdit = (batch: Batch) => {
    if (inlineAction?.batchId === batch.id && inlineAction.mode === 'edit') {
      setInlineAction(null);
      setEditErrorMsg(null);
    } else {
      setInlineAction({ batchId: batch.id, mode: 'edit' });
      setEditErrorMsg(null);

      const m = batch.mrp || 0;
      const s = batch.sellingPrice || 0;
      const initialDiscount = m > 0 ? (((m - s) / m) * 100).toFixed(1) : '0';

      setEditFormData({
        batchCode: batch.batchCode || '',
        quantity: batch.quantity ?? '',
        mrp: batch.mrp ?? '',
        costPrice: batch.costPrice ?? '',
        sellingPrice: batch.sellingPrice ?? '',
        wholesaleEnabled: batch.wholesaleEnabled || false,
        wholesalePrice: batch.wholesalePrice ?? '',
        wholesaleMinQty: batch.wholesaleMinQty ?? '',
        expiryDate: batch.expiryDate ? batch.expiryDate.split('T')[0] : '',
      });
      setEditDiscountInput(initialDiscount);
      onBatchEditClick?.(batch);
    }
  };

  const handleToggleInlineDelete = (batch: Batch) => {
    if (inlineAction?.batchId === batch.id && inlineAction.mode === 'delete') {
      setInlineAction(null);
      setErrorMsg(null);
    } else {
      setInlineAction({ batchId: batch.id, mode: 'delete' });
      setErrorMsg(null);
    }
  };

  const handleAddBatchFormChange = (name: string, value: string | boolean) => {
    let finalValue = value;
    if (
      typeof value === 'string' &&
      ['mrp', 'costPrice', 'sellingPrice', 'wholesalePrice'].includes(name)
    ) {
      finalValue = limitTwoDecimals(value);
    }

    if (name === 'discount_percent') {
      setAddBatchDiscountInput(String(finalValue));
      const val = parseFloat(String(finalValue));
      if (!isNaN(val)) {
        const m = parseFloat(String(addBatchFormData.mrp)) || 0;
        const newS = m * (1 - val / 100);
        setAddBatchFormData((prev) => ({
          ...prev,
          sellingPrice: Math.max(0, Number(newS.toFixed(2))),
        }));
      }
      return;
    }

    setAddBatchFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (name === 'mrp' || name === 'sellingPrice') {
      const m = name === 'mrp' ? parseFloat(String(finalValue)) : parseFloat(String(addBatchFormData.mrp || 0));
      const s =
        name === 'sellingPrice' ? parseFloat(String(finalValue)) : parseFloat(String(addBatchFormData.sellingPrice || 0));
      if (m > 0) {
        setAddBatchDiscountInput((((m - s) / m) * 100).toFixed(1));
      } else {
        setAddBatchDiscountInput('0');
      }
    }
  };

  const handleEditFormChange = (name: string, value: string | boolean) => {
    let finalValue = value;
    if (
      typeof value === 'string' &&
      ['mrp', 'costPrice', 'sellingPrice', 'wholesalePrice'].includes(name)
    ) {
      finalValue = limitTwoDecimals(value);
    }

    if (name === 'discount_percent') {
      setEditDiscountInput(String(finalValue));
      const val = parseFloat(String(finalValue));
      if (!isNaN(val)) {
        const m = parseFloat(String(editFormData.mrp)) || 0;
        const newS = m * (1 - val / 100);
        setEditFormData((prev) => ({
          ...prev,
          sellingPrice: Math.max(0, Number(newS.toFixed(2))),
        }));
      }
      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (name === 'mrp' || name === 'sellingPrice') {
      const m = name === 'mrp' ? parseFloat(String(finalValue)) : parseFloat(String(editFormData.mrp || 0));
      const s =
        name === 'sellingPrice' ? parseFloat(String(finalValue)) : parseFloat(String(editFormData.sellingPrice || 0));
      if (m > 0) {
        setEditDiscountInput((((m - s) / m) * 100).toFixed(1));
      } else {
        setEditDiscountInput('0');
      }
    }
  };

  const handleSaveAddBatch = async () => {
    setAddBatchErrorMsg(null);
    const mrp = Number(addBatchFormData.mrp) || 0;
    const costPrice = Number(addBatchFormData.costPrice) || 0;
    const sellingPrice = Number(addBatchFormData.sellingPrice) || 0;
    const quantity = Number(addBatchFormData.quantity) || 0;

    if (!addBatchFormData.quantity || quantity <= 0) {
      setAddBatchErrorMsg('Quantity is required and must be greater than zero');
      return;
    }

    if (mrp < 0 || costPrice < 0 || sellingPrice < 0 || quantity < 0) {
      setAddBatchErrorMsg('Values must be zero or greater');
      return;
    }

    if (sellingPrice < costPrice || sellingPrice > mrp) {
      setAddBatchErrorMsg('Invalid pricing: Selling Price must be between Cost Price and MRP');
      return;
    }

    if (addBatchFormData.wholesaleEnabled) {
      if (!addBatchFormData.wholesalePrice || !addBatchFormData.wholesaleMinQty) {
        setAddBatchErrorMsg('Wholesale Price and Minimum Quantity are required when wholesale is enabled');
        return;
      }
      if (Number(addBatchFormData.wholesalePrice) <= 0 || Number(addBatchFormData.wholesaleMinQty) <= 0) {
        setAddBatchErrorMsg('Wholesale Price and Minimum Quantity must be greater than zero');
        return;
      }
    }

    setIsSavingAddBatch(true);
    try {
      const productId = product?.id;
      if (!productId) {
        throw new Error('Product context missing');
      }

      const payload = {
        product_id: productId,
        batch_code: addBatchFormData.batchCode,
        quantity,
        mrp,
        cost_price: costPrice,
        selling_price: sellingPrice,
        wholesaleEnabled: addBatchFormData.wholesaleEnabled,
        wholesalePrice: addBatchFormData.wholesaleEnabled ? Number(addBatchFormData.wholesalePrice) || 0 : null,
        wholesaleMinQty: addBatchFormData.wholesaleEnabled ? Number(addBatchFormData.wholesaleMinQty) || 0 : null,
        expiryDate: addBatchFormData.expiryDate ? new Date(addBatchFormData.expiryDate) : null,
      };

      const result = await inventoryService.addBatch(payload);
      setInlineAction(null);

      if (result?.id) {
        setJustUpdatedBatchId(result.id);
        setTimeout(() => {
          setJustUpdatedBatchId((curr) => (curr === result.id ? null : curr));
        }, 5000);
      }

      if (onBatchUpdated) onBatchUpdated();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inline-add-batch-save' } });
      console.error('Failed to create batch:', error);
      setAddBatchErrorMsg(getApiErrorMessage(error, 'Failed to create new batch'));
    } finally {
      setIsSavingAddBatch(false);
    }
  };

  const handleSaveEditBatch = async (batch: Batch) => {
    setEditErrorMsg(null);

    // An empty Quantity field must not silently save as 0 — this is a
    // second, independent check on top of the Save button's disabled
    // state, since a batch's real stock being zeroed out with no warning
    // is bad enough to guard against defensively, not just via the button.
    if (editFormData.quantity === '') {
      setEditErrorMsg('Quantity is required');
      return;
    }

    const mrp = Number(editFormData.mrp) || 0;
    const costPrice = Number(editFormData.costPrice) || 0;
    const sellingPrice = Number(editFormData.sellingPrice) || 0;
    const quantity = Number(editFormData.quantity) || 0;

    if (mrp < 0 || costPrice < 0 || sellingPrice < 0 || quantity < 0) {
      setEditErrorMsg('Values must be zero or greater');
      return;
    }

    if (sellingPrice < costPrice || sellingPrice > mrp) {
      setEditErrorMsg('Invalid pricing: Selling Price must be between Cost Price and MRP');
      return;
    }

    if (editFormData.wholesaleEnabled) {
      if (!editFormData.wholesalePrice || !editFormData.wholesaleMinQty) {
        setEditErrorMsg('Wholesale Price and Minimum Quantity are required when wholesale is enabled');
        return;
      }
      if (Number(editFormData.wholesalePrice) <= 0 || Number(editFormData.wholesaleMinQty) <= 0) {
        setEditErrorMsg('Wholesale Price and Minimum Quantity must be greater than zero');
        return;
      }
    }

    setIsSavingEdit(true);
    try {
      await inventoryService.updateBatch(batch.id, {
        ...editFormData,
        quantity: Number(editFormData.quantity),
        mrp,
        costPrice,
        sellingPrice,
        wholesaleEnabled: editFormData.wholesaleEnabled,
        wholesalePrice: editFormData.wholesaleEnabled ? Number(editFormData.wholesalePrice) || 0 : null,
        wholesaleMinQty: editFormData.wholesaleEnabled ? Number(editFormData.wholesaleMinQty) || 0 : null,
        expiryDate: editFormData.expiryDate ? new Date(editFormData.expiryDate) : null,
      });

      setInlineAction(null);

      // Trigger 5s visual confirmation feedback on this batch card
      setJustUpdatedBatchId(batch.id);
      setTimeout(() => {
        setJustUpdatedBatchId((curr) => (curr === batch.id ? null : curr));
      }, 5000);

      if (onBatchUpdated) onBatchUpdated();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inline-edit-batch-save' } });
      console.error('Failed to update batch:', error);
      setEditErrorMsg(getApiErrorMessage(error, 'Failed to update batch details'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveQuickStock = async (batch: Batch) => {
    setErrorMsg(null);
    const qtyToAdd = Number(addQty);
    if (!Number.isFinite(qtyToAdd) || qtyToAdd <= 0 || !Number.isInteger(qtyToAdd)) {
      setErrorMsg('Enter a positive whole number quantity');
      return;
    }

    setIsSaving(true);
    try {
      const nextQuantity = Number(batch.quantity || 0) + qtyToAdd;
      const updateData: Record<string, unknown> = { quantity: nextQuantity };

      if (isAveragingEnabled && newCostPrice) {
        const currentCost = Number(batch.costPrice || 0);
        const currentQty = Number(batch.quantity || 0);
        const addedCost = Number(newCostPrice);
        const averagedPrice = (currentQty * currentCost + qtyToAdd * addedCost) / nextQuantity;
        updateData.costPrice = Math.round(averagedPrice * 100) / 100;
      }

      await api.put(`/api/batches/${batch.id}`, updateData);
      setInlineAction(null);

      // Trigger 5s visual confirmation feedback on this batch card
      setJustUpdatedBatchId(batch.id);
      setTimeout(() => {
        setJustUpdatedBatchId((curr) => (curr === batch.id ? null : curr));
      }, 5000);

      if (onBatchUpdated) onBatchUpdated();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inline-quick-inventory-save' } });
      console.error('Failed inline stock update:', error);
      setErrorMsg(getApiErrorMessage(error, 'Failed to update stock quantity'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (batchId: number) => {
    setErrorMsg(null);
    setIsDeleting(true);
    try {
      await onBatchDelete(batchId);
      setInlineAction(null);
    } catch (error) {
      console.error('Inline delete error:', error);
      setErrorMsg(getApiErrorMessage(error, 'Failed to delete batch'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Section Action Bar */}
      {batchTrackingEnabled && inlineAction?.mode !== 'add' && (
        <Box
          sx={{
            py: 0.5,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleToggleInlineAdd}
            sx={{
              height: '30px',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderColor: 'rgba(37, 99, 235, 0.3)',
              color: '#2563eb',
              bgcolor: 'rgba(37, 99, 235, 0.1)',
              borderRadius: '6px',
              px: 1.25,
              py: 0.25,
              boxShadow: 'none',
              '&:hover': {
                borderColor: '#2563eb',
                bgcolor: 'rgba(37, 99, 235, 0.2)',
              },
            }}
          >
            New Batch
          </Button>
        </Box>
      )}

      {/* Batch Cards & Forms Container */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          overflowY: 'auto',
          // @ts-expect-error - Chrome/Electron overlay scrollbar
          overflowY: 'overlay',
          pr: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          '&::-webkit-scrollbar': {
            width: '5px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#94a3b8',
          },
        }}
      >
        {/* Inline Action Form 0: Create New Batch */}
        {inlineAction?.mode === 'add' && (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: '8px',
              bgcolor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
              animation: 'inlineExpand 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
              '@keyframes inlineExpand': {
                '0%': { opacity: 0, transform: 'translateY(-8px) scale(0.98)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AddStockIcon sx={{ fontSize: 18, color: '#2563eb' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.825rem' }}>
                Create New Batch {product?.name ? `for ${product.name}` : ''}
              </Typography>
            </Box>

            {addBatchErrorMsg && (
              <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: '0.72rem' }}>
                {addBatchErrorMsg}
              </Alert>
            )}

            <BatchFormFields
              formData={addBatchFormData}
              discountInput={addBatchDiscountInput}
              onChange={handleAddBatchFormChange}
              batchTrackingEnabled={batchTrackingEnabled}
            />

            {/* Actions Row */}
            {(() => {
              const mrpVal = Number(addBatchFormData.mrp) || 0;
              const cpVal = Number(addBatchFormData.costPrice) || 0;
              const spVal = Number(addBatchFormData.sellingPrice) || 0;
              const qtyVal = Number(addBatchFormData.quantity);

              const sellingBelowCost = spVal > 0 && cpVal > 0 && spVal < cpVal;
              const sellingAboveMrp = spVal > 0 && mrpVal > 0 && spVal > mrpVal;
              const sellingInvalid = sellingBelowCost || sellingAboveMrp;
              const qtyInvalid = !addBatchFormData.quantity || isNaN(qtyVal) || qtyVal <= 0;
              const wholesaleInvalid = addBatchFormData.wholesaleEnabled && (Number(addBatchFormData.wholesalePrice) <= 0 || Number(addBatchFormData.wholesaleMinQty) <= 0);

              const addFormInvalid = sellingInvalid || qtyInvalid || wholesaleInvalid;

              return (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
                  <Button
                    size="small"
                    onClick={() => setInlineAction(null)}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748b' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveAddBatch}
                    disabled={isSavingAddBatch || addFormInvalid}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: '#2563eb !important',
                      color: '#ffffff !important',
                      '&:hover': { bgcolor: '#1d4ed8 !important' },
                      '&.Mui-disabled': {
                        bgcolor: '#94a3b8 !important',
                        color: '#ffffff !important',
                      },
                      borderRadius: '6px',
                      height: 28,
                      px: 1.5,
                    }}
                  >
                    {isSavingAddBatch ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Create Batch'}
                  </Button>
                </Box>
              );
            })()}
          </Paper>
        )}

        {batches.map((batch) => {
          const margin =
            batch.sellingPrice > 0
              ? (((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100).toFixed(1)
              : '0.0';
          const discount =
            batch.mrp > 0
              ? (((batch.mrp - batch.sellingPrice) / batch.mrp) * 100).toFixed(1)
              : '0.0';
          const numMargin = Number(margin);
          const addQtyNum = Number(addQty) || 0;

          const isQuickActive = inlineAction?.batchId === batch.id && inlineAction.mode === 'quick';
          const isEditActive = inlineAction?.batchId === batch.id && inlineAction.mode === 'edit';
          const isDeleteActive = inlineAction?.batchId === batch.id && inlineAction.mode === 'delete';
          const isJustUpdated = justUpdatedBatchId === batch.id;

          return (
            <Paper
              key={batch.id}
              elevation={0}
              data-testid={`inventory-batch-row-${batch.id}`}
              sx={{
                p: 1.5,
                px: 2,
                borderRadius: '8px',
                border: isQuickActive
                  ? '1px solid #10b981'
                  : isEditActive
                  ? '1px solid #2563eb'
                  : isDeleteActive
                  ? '1px solid #ef4444'
                  : isJustUpdated
                  ? '1.5px solid #10b981'
                  : '1px solid #e2e8f0',
                bgcolor: isJustUpdated ? '#f0fdf4' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor:
                    isQuickActive || isJustUpdated
                      ? '#10b981'
                      : isEditActive
                      ? '#2563eb'
                      : isDeleteActive
                      ? '#ef4444'
                      : '#94a3b8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
              }}
            >
              {/* Batch Code & Quantity Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 500 }}>
                    Batch ID:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: '#334155',
                      fontSize: '0.75rem',
                      bgcolor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      px: 0.85,
                      py: 0.25,
                      borderRadius: '5px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {batchTrackingEnabled && batch.batchCode ? batch.batchCode : 'Standard Lot'}
                  </Typography>

                  {/* Stock Updated Visual Confirmation Chip */}
                  {isJustUpdated && (
                    <Chip
                      label="Updated ✓"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        bgcolor: '#10b981',
                        color: '#ffffff',
                        borderRadius: '4px',
                        px: 0.25,
                        boxShadow: '0 1px 4px rgba(16,185,129,0.3)',
                      }}
                    />
                  )}
                </Box>

                <Chip
                  label={`${batch.quantity} in stock`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: batch.quantity > 0 ? 'rgba(16, 185, 129, 0.12)' : '#fef2f2',
                    color: batch.quantity > 0 ? '#059669' : '#ef4444',
                    border: 'none',
                  }}
                />
              </Box>

              {/* Pricing & Financial Metrics Grid: MRP, CP, SP, Margin, Discount */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 0.75,
                  bgcolor: '#f8fafc',
                  p: 1,
                  borderRadius: '6px',
                  border: 'none',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    MRP
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#6366f1', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    ₹{formatPrice(batch.mrp)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Cost (CP)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#ea580c', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    ₹{formatPrice(batch.costPrice)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Selling (SP)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    ₹{formatPrice(batch.sellingPrice)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Margin
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      color:
                        numMargin > 20
                          ? '#059669'
                          : numMargin > 10
                            ? '#d97706'
                            : '#ef4444',
                    }}
                  >
                    {margin}%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Discount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {discount}%
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: '#f1f5f9' }} />

              {/* Expiry & Action Buttons Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ExpiryIcon sx={{ fontSize: 13, color: batch.expiryDate ? '#64748b' : '#94a3b8' }} />
                  <Typography variant="caption" sx={{ color: batch.expiryDate ? '#475569' : '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>
                    {batch.expiryDate
                      ? `EXP: ${new Date(batch.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'EXP: N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Tooltip title="Quick Stock Update (Inline)">
                    <IconButton
                      size="small"
                      onClick={() => handleToggleInlineQuick(batch)}
                      data-testid={`inventory-quick-stock-${batch.id}`}
                      aria-label="Quick Stock Update"
                      sx={{
                        bgcolor: isQuickActive ? '#059669' : 'rgba(16, 185, 129, 0.1)',
                        color: isQuickActive ? '#ffffff' : '#059669',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: isQuickActive ? '#047857' : 'rgba(16, 185, 129, 0.2)' },
                      }}
                    >
                      <AddStockIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Edit Batch Details (Inline)">
                    <IconButton
                      size="small"
                      onClick={() => handleToggleInlineEdit(batch)}
                      aria-label="Edit Batch Details"
                      sx={{
                        bgcolor: isEditActive ? '#2563eb' : 'rgba(37, 99, 235, 0.1)',
                        color: isEditActive ? '#ffffff' : '#2563eb',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: isEditActive ? '#1d4ed8' : 'rgba(37, 99, 235, 0.2)' },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete Batch (Inline)">
                    <IconButton
                      size="small"
                      onClick={() => handleToggleInlineDelete(batch)}
                      aria-label="Delete Batch"
                      sx={{
                        border: '1px solid #fecaca',
                        color: isDeleteActive ? '#ffffff' : '#ef4444',
                        bgcolor: isDeleteActive ? '#dc2626' : '#fef2f2',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: isDeleteActive ? '#b91c1c' : '#fee2e2' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Inline Action Form 1: Quick Stock Addition */}
              {isQuickActive && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.25,
                    borderRadius: '6px',
                    bgcolor: '#f0fdf4',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    animation: 'inlineExpand 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                    '@keyframes inlineExpand': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(-8px) scale(0.98)',
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0) scale(1)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <QuickIcon sx={{ fontSize: 16, color: '#059669' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#065f46', fontSize: '0.75rem' }}>
                        Quick Stock Addition
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600, fontSize: '0.72rem' }}>
                      Current: {batch.quantity} units {addQtyNum > 0 ? `➔ ${batch.quantity + addQtyNum} units` : ''}
                    </Typography>
                  </Box>

                  {errorMsg && (
                    <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: '0.72rem' }}>
                      {errorMsg}
                    </Alert>
                  )}

                  {/* Input Fields Row with Generous Top Spacing */}
                  <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap', mt: 1.5 }}>
                    <TextField
                      size="small"
                      type="number"
                      label="Add Quantity"
                      placeholder="e.g. 10"
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      inputProps={{ onWheel: blurNumberInputOnWheel }}
                      autoFocus
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        '& .MuiInputLabel-root': {
                          fontSize: '0.75rem',
                          color: '#475569',
                          fontWeight: 500,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#059669',
                          fontWeight: 700,
                        },
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.78rem',
                          bgcolor: '#ffffff',
                          borderRadius: '6px',
                          '& fieldset': {
                            borderColor: '#a7f3d0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#059669',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#059669',
                            borderWidth: '1.5px',
                          },
                        },
                      }}
                    />

                    {isAveragingEnabled && (
                      <TextField
                        size="small"
                        type="number"
                        label="New Cost Price (₹)"
                        value={newCostPrice}
                        onChange={(e) => setNewCostPrice(limitTwoDecimals(e.target.value))}
                        inputProps={{ onWheel: blurNumberInputOnWheel }}
                        sx={{
                          flex: 1,
                          minWidth: 120,
                          '& .MuiInputLabel-root': {
                            fontSize: '0.75rem',
                            color: '#475569',
                            fontWeight: 500,
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#059669',
                            fontWeight: 700,
                          },
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.78rem',
                            bgcolor: '#ffffff',
                            borderRadius: '6px',
                            '& fieldset': {
                              borderColor: '#a7f3d0',
                            },
                            '&:hover fieldset': {
                              borderColor: '#059669',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#059669',
                              borderWidth: '1.5px',
                            },
                          },
                        }}
                      />
                    )}
                  </Box>

                  {/* Bottom Action Row: New Avg Cost on Left, Cancel & Update Stock Buttons on Right */}
                  {(() => {
                    const currentQty = Number(batch.quantity || 0);
                    const currentCost = Number(batch.costPrice || 0);
                    const addedCost = (isAveragingEnabled && newCostPrice) ? (Number(newCostPrice) || currentCost) : currentCost;
                    const calculatedAvgCost = (isAveragingEnabled && addQtyNum > 0 && (currentQty + addQtyNum) > 0)
                      ? ((currentQty * currentCost + addQtyNum * addedCost) / (currentQty + addQtyNum))
                      : currentCost;

                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 0.5 }}>
                        {/* Left: New Avg Cost */}
                        <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600, fontSize: '0.75rem' }}>
                          New Avg Cost: <Box component="span" sx={{ fontWeight: 800, color: '#065f46' }}>₹{formatPrice(calculatedAvgCost)}</Box>
                        </Typography>

                        {/* Right: Cancel & Update Stock Buttons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={() => setInlineAction(null)}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748b' }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleSaveQuickStock(batch)}
                            disabled={isSaving}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              bgcolor: '#059669 !important',
                              color: '#ffffff !important',
                              '&:hover': { bgcolor: '#047857 !important' },
                              '&.MuiButton-contained': { bgcolor: '#059669 !important', color: '#ffffff !important' },
                              '&.MuiButton-containedSuccess': { bgcolor: '#059669 !important', color: '#ffffff !important' },
                              '&.Mui-disabled': {
                                bgcolor: '#94a3b8 !important',
                                color: '#ffffff !important',
                              },
                              borderRadius: '6px',
                              height: 28,
                              px: 1.5,
                            }}
                          >
                            {isSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Update Stock'}
                          </Button>
                        </Box>
                      </Box>
                    );
                  })()}
                </Paper>
              )}

              {/* Inline Action Form 2: Edit Batch Details */}
              {isEditActive && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: '6px',
                    bgcolor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                    animation: 'inlineExpand 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                    '@keyframes inlineExpand': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(-8px) scale(0.98)',
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0) scale(1)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EditIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.75rem' }}>
                      Edit Batch Details
                    </Typography>
                  </Box>

                  {editErrorMsg && (
                    <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: '0.72rem' }}>
                      {editErrorMsg}
                    </Alert>
                  )}

                  <BatchFormFields
                    formData={editFormData}
                    discountInput={editDiscountInput}
                    onChange={handleEditFormChange}
                    batchTrackingEnabled={batchTrackingEnabled}
                  />

                  {/* Actions Row */}
                  {(() => {
                    const mrpVal = Number(editFormData.mrp) || 0;
                    const cpVal = Number(editFormData.costPrice) || 0;
                    const spVal = Number(editFormData.sellingPrice) || 0;
                    const qtyVal = Number(editFormData.quantity);

                    const sellingBelowCost = spVal > 0 && cpVal > 0 && spVal < cpVal;
                    const sellingAboveMrp = spVal > 0 && mrpVal > 0 && spVal > mrpVal;
                    const sellingInvalid = sellingBelowCost || sellingAboveMrp;
                    // Empty is invalid too — an empty Quantity used to
                    // silently save as 0 (Number('') || 0 in
                    // handleSaveEditBatch below), which could zero out a
                    // batch's real stock with no warning.
                    const qtyInvalid = editFormData.quantity === '' || isNaN(qtyVal) || qtyVal < 0;
                    const wholesaleInvalid = editFormData.wholesaleEnabled && (Number(editFormData.wholesalePrice) <= 0 || Number(editFormData.wholesaleMinQty) <= 0);

                    const editFormInvalid = sellingInvalid || qtyInvalid || wholesaleInvalid;

                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
                        <Button
                          size="small"
                          onClick={() => setInlineAction(null)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748b' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSaveEditBatch(batch)}
                          disabled={isSavingEdit || editFormInvalid}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: '#2563eb !important',
                            color: '#ffffff !important',
                            '&:hover': { bgcolor: '#1d4ed8 !important' },
                            '&.Mui-disabled': {
                              bgcolor: '#94a3b8 !important',
                              color: '#ffffff !important',
                            },
                            borderRadius: '6px',
                            height: 28,
                            px: 1.5,
                          }}
                        >
                          {isSavingEdit ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Save Details'}
                        </Button>
                      </Box>
                    );
                  })()}
                </Paper>
              )}

              {/* Inline Action Form 3: Delete Confirmation */}
              {isDeleteActive && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.25,
                    borderRadius: '6px',
                    bgcolor: '#fef2f2',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    animation: 'inlineExpand 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                    '@keyframes inlineExpand': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(-8px) scale(0.98)',
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0) scale(1)',
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <WarningIcon sx={{ fontSize: 16, color: '#dc2626' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#991b1b', fontSize: '0.75rem' }}>
                        Delete Batch {batch.batchCode ? `(${batch.batchCode})` : `#${batch.id}`}?
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#b91c1c', fontSize: '0.72rem', fontWeight: 600 }}>
                      Current stock: {batch.quantity} units
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#7f1d1d', fontSize: '0.72rem' }}>
                    This action cannot be undone. If it has sales history, the batch will be retired rather than erased. Continue?
                  </Typography>

                  {errorMsg && (
                    <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: '0.72rem' }}>
                      {errorMsg}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
                    <Button
                      size="small"
                      onClick={() => setInlineAction(null)}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748b' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleConfirmDelete(batch.id)}
                      disabled={isDeleting}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: '#dc2626',
                        '&:hover': { bgcolor: '#b91c1c' },
                        borderRadius: '6px',
                        height: 28,
                        px: 1.5,
                      }}
                    >
                      {isDeleting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Confirm Delete'}
                    </Button>
                  </Box>
                </Paper>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProductBatchTable;
