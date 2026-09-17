import React, { useState, useEffect, useMemo, useRef } from 'react';
import type {
  Promotion,
  PromotionItem,
  PromotionFormState,
  ProductPriceInfo,
} from '@/domains/promotions/types';
import type { Product } from '@/shared/types/models';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Switch,
  TextField,
  Grid,
  Autocomplete,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  QrCodeScanner as QrCodeScannerIcon,
} from '@mui/icons-material';
import posService from '@/shared/api/posService';
import InventoryPanelShell from '@/domains/inventory/components/InventoryPanelShell';
import { useResizablePanel } from '@/shared/hooks/useResizablePanel';
import {
  getPrimaryBarcode,
  matchProductByBarcodeOrQuery,
  filterProductsForSearch,
} from '@/domains/promotions/components/productSearchHelpers';

interface ScheduledSalesPanelProps {
  promotions: Promotion[];
  products: Product[];
  onCreatePromotion?: (promoData: PromotionFormState) => Promise<Promotion | null | boolean>;
  onSavePromotion: (id: number, promoData: PromotionFormState) => Promise<boolean>;
  onDeletePromotion: (id: number) => void;
  /** True when today falls inside the promotion's window and it is enabled. */
  isPromotionActive: (promo: Promotion) => boolean;
}

const columnTypographySx = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#334155',
};

const headCellSx = {
  fontWeight: 700,
  color: '#475569',
  bgcolor: '#f8fafc',
  py: 1.25,
  px: 1.5,
  borderBottom: '1px solid #e2e8f0',
  fontSize: '0.75rem',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
};

const sectionHeaderSx = {
  fontWeight: 700,
  color: '#64748b',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  fontSize: '0.72rem',
  display: 'block',
  mb: 1.5,
};

const fieldLabelSx = {
  fontWeight: 500,
  color: '#334155',
  display: 'block',
  mb: 0.75,
  fontSize: '0.8rem',
};


const ScheduledSalesPanel = ({
  promotions,
  products,
  onCreatePromotion,
  onSavePromotion,
  onDeletePromotion,
  isPromotionActive,
}: ScheduledSalesPanelProps) => {
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draftPromo, setDraftPromo] = useState<PromotionFormState | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Product addition state inside the right card
  const [productSearchInput, setProductSearchInput] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const { width: rightPanelWidth, isResizing, startResizing } = useResizablePanel({
    storageKey: 'promotions-scheduled-sales-panel-width',
    defaultWidth: 460,
    min: 360,
    maxRatio: 0.55,
  });

  const activePromotionCount = useMemo(
    () => promotions.filter(isPromotionActive).length,
    [promotions, isPromotionActive]
  );

  // Keep selection synchronized if promotions list updates
  useEffect(() => {
    if (selectedPromoId !== null) {
      const exists = promotions.some((p) => p.id === selectedPromoId);
      if (!exists && !isCreating) {
        setSelectedPromoId(null);
        setDraftPromo(null);
        setPanelError('');
      }
    }
  }, [promotions, selectedPromoId, isCreating]);

  const resetProductInput = () => {
    setProductSearchInput('');
  };

  const handleStartCreate = () => {
    setPanelError('');
    if (isCreating) {
      setIsCreating(false);
      setDraftPromo(null);
      resetProductInput();
      return;
    }
    setSelectedPromoId(null);
    setIsCreating(true);
    resetProductInput();
    const today = new Date().toISOString().split('T')[0];
    setDraftPromo({
      name: '',
      startDate: today,
      endDate: today,
      isActive: true,
      items: [],
    });
  };

  const handleRowClick = async (promo: Promotion) => {
    setPanelError('');
    setIsCreating(false);
    if (selectedPromoId === promo.id) {
      setSelectedPromoId(null);
      setDraftPromo(null);
      resetProductInput();
      return;
    }

    setSelectedPromoId(promo.id);
    resetProductInput();
    setLoadingItems(true);

    const start = promo.startDate.split('T')[0];
    const end = promo.endDate.split('T')[0];

    try {
      const enrichedItems = await Promise.all(
        promo.items.map(async (item: PromotionItem) => {
          try {
            const data = await posService.fetchPromotionProductOptions(item.productId);
            return {
              productId: item.productId,
              productName: item.product?.name || item.productName || 'Unknown Product',
              promoPrice: item.promoPrice,
              mrp: data.mrp,
              costPrice: data.costPrice,
              sellingPrice: data.sellingPrice,
            };
          } catch {
            return {
              productId: item.productId,
              productName: item.product?.name || item.productName || 'Unknown Product',
              promoPrice: item.promoPrice,
              mrp: item.mrp || 0,
              costPrice: item.costPrice || 0,
              sellingPrice: item.sellingPrice || 0,
            };
          }
        })
      );

      setDraftPromo({
        name: promo.name,
        startDate: start,
        endDate: end,
        isActive: promo.isActive,
        items: enrichedItems,
      });
    } catch (err) {
      console.error('Failed to enrich promotion items:', err);
      setDraftPromo({
        name: promo.name,
        startDate: start,
        endDate: end,
        isActive: promo.isActive,
        items: promo.items,
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCloseSidebar = () => {
    setSelectedPromoId(null);
    setIsCreating(false);
    setDraftPromo(null);
    setPanelError('');
    resetProductInput();
  };

  const handleAddProduct = async (product: Product) => {
    if (!draftPromo) return;

    const existing = draftPromo.items.find((item) => item.productId === product.id);
    if (existing) {
      setRecentlyAddedId(product.id);
      setTimeout(() => setRecentlyAddedId(null), 1200);
      priceInputRefs.current[product.id]?.focus();
      priceInputRefs.current[product.id]?.select();
      return;
    }

    let priceInfo = { mrp: 0, costPrice: 0, sellingPrice: 0 };
    try {
      priceInfo = await posService.fetchPromotionProductOptions(product.id);
    } catch (err) {
      console.error('Failed to fetch pricing options:', err);
    }

    const defaultPromoPrice = priceInfo.sellingPrice > 0 ? priceInfo.sellingPrice : 0;

    const newItem: PromotionItem = {
      productId: product.id,
      productName: product.name,
      promoPrice: defaultPromoPrice,
      mrp: priceInfo.mrp,
      costPrice: priceInfo.costPrice,
      sellingPrice: priceInfo.sellingPrice,
    };

    setDraftPromo((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: [newItem, ...prev.items],
      };
    });

    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 1200);

    setTimeout(() => {
      priceInputRefs.current[product.id]?.focus();
      priceInputRefs.current[product.id]?.select();
    }, 80);

    setPanelError('');
  };

  const handlePromoPriceChange = (productId: number, newPriceStr: string) => {
    const val = parseFloat(newPriceStr);
    setDraftPromo((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.productId === productId
            ? { ...item, promoPrice: isNaN(val) ? 0 : val }
            : item
        ),
      };
    });
  };

  const handleClearAllProducts = () => {
    setDraftPromo((prev) => (prev ? { ...prev, items: [] } : null));
  };

  const handleRemoveItem = (index: number) => {
    setDraftPromo((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      };
    });
  };

  const handleSaveChanges = async () => {
    if (!draftPromo || (selectedPromoId === null && !isCreating)) return;

    if (!draftPromo.name.trim()) {
      setPanelError('Please enter a sale event name.');
      return;
    }
    if (!draftPromo.startDate || !draftPromo.endDate) {
      setPanelError('Please specify both start and end dates.');
      return;
    }
    if (new Date(draftPromo.endDate) < new Date(draftPromo.startDate)) {
      setPanelError('End date cannot be earlier than start date.');
      return;
    }
    if (draftPromo.items.length === 0) {
      setPanelError('Please add at least one product to the sale event.');
      return;
    }

    setPanelError('');
    setIsSaving(true);
    try {
      if (isCreating) {
        if (onCreatePromotion) {
          const result = await onCreatePromotion(draftPromo);
          if (result && typeof result === 'object' && 'id' in result && result.id) {
            setIsCreating(false);
            setSelectedPromoId(result.id);
          }
        }
      } else if (selectedPromoId !== null) {
        await onSavePromotion(selectedPromoId, draftPromo);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRemove = () => {
    if (saleToDelete !== null) {
      onDeletePromotion(saleToDelete);
      if (selectedPromoId === saleToDelete) {
        handleCloseSidebar();
      }
      setSaleToDelete(null);
    }
  };

  const targetSaleToDelete = promotions.find((p) => p.id === saleToDelete);
  const selectedPromo = promotions.find((p) => p.id === selectedPromoId);
  const isPanelOpen = Boolean(draftPromo && (selectedPromo || isCreating));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 1.5,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Main Table Paper */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minWidth: 0,
          bgcolor: '#ffffff',
          height: '100%',
        }}
      >
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0b1d39', lineHeight: 1.2 }}
              >
                Scheduled Sales & Campaigns
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem', lineHeight: 1 }}
              >
                {activePromotionCount} Active • {promotions.length} Events Scheduled
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleStartCreate}
              sx={{
                bgcolor: isCreating ? '#1e293b' : '#0b1d39',
                borderRadius: '8px',
                px: 2.5,
                height: 36,
                fontWeight: 600,
                fontSize: '0.82rem',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1e293b' },
              }}
            >
              Create New Event
            </Button>
          </Box>
        </Box>

        <TableContainer
          sx={{
            flex: 1,
            overflow: 'auto',
            overflowX: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
            '&::-webkit-scrollbar': { height: '6px', width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
          }}
        >
          <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', width: '100%', minWidth: '700px' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0' }}>
                <TableCell sx={{ ...headCellSx, width: '6%', minWidth: '55px' }}>S.NO.</TableCell>
                <TableCell sx={{ ...headCellSx, width: '28%', minWidth: '150px' }}>EVENT</TableCell>
                <TableCell sx={{ ...headCellSx, width: '20%', minWidth: '110px' }}>START DATE</TableCell>
                <TableCell sx={{ ...headCellSx, width: '20%', minWidth: '110px' }}>END DATE</TableCell>
                <TableCell sx={{ ...headCellSx, width: '14%', minWidth: '95px' }}>PRODUCTS</TableCell>
                <TableCell align="center" sx={{ ...headCellSx, width: '12%', minWidth: '85px' }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promotions.map((promo: Promotion, idx: number) => {
                const isSelected = selectedPromoId === promo.id;
                return (
                  <TableRow
                    key={promo.id}
                    hover
                    onClick={() => handleRowClick(promo)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Edit scheduled event ${promo.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(promo);
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'rgba(11, 29, 57, 0.08)' : 'transparent',
                      '& td': { px: 1.5 },
                      '&:hover': {
                        bgcolor: isSelected ? 'rgba(11, 29, 57, 0.12)' : '#f8fafc',
                      },
                      '&:focus-visible': {
                        outline: '2px solid #0b1d39',
                        outlineOffset: '-2px',
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        py: 1.25,
                        px: 1.5,
                        ...columnTypographySx,
                        width: '6%',
                        minWidth: '55px',
                        whiteSpace: 'nowrap',
                        borderLeft: isSelected ? '3px solid #0b1d39' : '3px solid transparent',
                      }}
                    >
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: '#0b1d39',
                          fontSize: '0.85rem',
                          textTransform: 'capitalize',
                        }}
                      >
                        {promo.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Typography variant="body2" sx={columnTypographySx}>
                        {new Date(promo.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Typography variant="body2" sx={columnTypographySx}>
                        {new Date(promo.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Typography variant="body2" sx={columnTypographySx}>
                        {promo.items?.length || 0} {promo.items?.length === 1 ? 'Product' : 'Products'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.25, px: 1.5 }}>
                      {isPromotionActive(promo) ? (
                        <Chip
                          label="ACTIVE"
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                          }}
                        />
                      ) : new Date() < new Date(promo.startDate) ? (
                        <Chip
                          label="UPCOMING"
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: '#fffbeb',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                          }}
                        />
                      ) : (
                        <Chip
                          label="EXPIRED"
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: '#fef2f2',
                            color: '#991b1b',
                            border: '1px solid #fecaca',
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {promotions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>
                      NO EVENTS SCHEDULED
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                      Click 'Create New Event' to begin scheduling price reductions
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Resizer Handle */}
      {isPanelOpen && (
        <Box
          onMouseDown={startResizing}
          sx={{
            display: { xs: 'none', lg: 'flex' },
            width: '12px',
            mx: -1.5,
            cursor: 'col-resize',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            flexShrink: 0,
            '&:hover .handle': {
              bgcolor: '#0b1d39',
              width: '4px',
            },
          }}
        >
          <Box
            className="handle"
            sx={{
              width: '2px',
              height: '60px',
              bgcolor: isResizing ? '#0b1d39' : '#cbd5e1',
              borderRadius: '4px',
              transition: 'all 0.2s',
              ...(isResizing && { width: '4px' }),
            }}
          />
        </Box>
      )}

      {/* Right-Side Configuration Card */}
      {isPanelOpen && draftPromo && (
        <Box
          sx={{
            width: { xs: '100%', lg: rightPanelWidth },
            minWidth: { lg: 360 },
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          }}
        >
          <InventoryPanelShell
            title={
              isCreating
                ? (draftPromo?.name ? `New Scheduled Sale: ${draftPromo.name}` : 'New Scheduled Sale')
                : `Scheduled Sale: ${draftPromo?.name || 'Untitled'}`
            }
            headerRight={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                {!isCreating && (
                  <>
                    <Typography
                      component="button"
                      type="button"
                      onClick={() => setSaleToDelete(selectedPromoId)}
                      sx={{
                        background: 'none',
                        border: 'none',
                        p: 0,
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#dc2626',
                        textDecoration: 'none',
                        '&:hover': {
                          color: '#b91c1c',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Remove sale
                    </Typography>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ height: 16, my: 'auto', borderColor: '#cbd5e1' }}
                    />
                  </>
                )}
                <IconButton
                  onClick={handleCloseSidebar}
                  size="small"
                  aria-label="Close Sidebar"
                  sx={{
                    color: '#64748b',
                    p: 0.5,
                    '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            {/* Scrollable Form Content */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent',
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
              }}
            >
              {panelError && (
                <Alert severity="error" sx={{ borderRadius: '8px', fontSize: '0.82rem' }}>
                  {panelError}
                </Alert>
              )}

              {loadingItems ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                  <CircularProgress size={28} sx={{ color: '#0b1d39' }} />
                </Box>
              ) : (
                <>
                  {/* SECTION 1: EVENT DETAILS */}
                  <Box>
                    <Typography sx={sectionHeaderSx}>EVENT DETAILS</Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography sx={fieldLabelSx}>Sale Name *</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={draftPromo.name}
                          onChange={(e) => {
                            setDraftPromo((prev) => (prev ? { ...prev, name: e.target.value } : null));
                            if (panelError) setPanelError('');
                          }}
                          placeholder="e.g. Summer Festival Clearance"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              bgcolor: '#f8fafc',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.25,
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          bgcolor: '#f8fafc',
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                            Campaign Active Status
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                            Toggle whether this promotion is currently active
                          </Typography>
                        </Box>
                        <Switch
                          size="small"
                          checked={draftPromo.isActive !== false}
                          onChange={(e) =>
                            setDraftPromo((prev) => (prev ? { ...prev, isActive: e.target.checked } : null))
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#10b981',
                            },
                          }}
                        />
                      </Box>

                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Typography sx={fieldLabelSx}>Start Date *</Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={draftPromo.startDate}
                            onChange={(e) => {
                              setDraftPromo((prev) => (prev ? { ...prev, startDate: e.target.value } : null));
                              if (panelError) setPanelError('');
                            }}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                bgcolor: '#f8fafc',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                              },
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography sx={fieldLabelSx}>End Date *</Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            value={draftPromo.endDate}
                            onChange={(e) => {
                              setDraftPromo((prev) => (prev ? { ...prev, endDate: e.target.value } : null));
                              if (panelError) setPanelError('');
                            }}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                bgcolor: '#f8fafc',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>

                  <Divider sx={{ borderColor: '#f1f5f9' }} />

                  {/* SECTION 2: PRODUCT SELECTION & SCAN */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      bgcolor: '#f8fafc',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '0.9rem' }}>
                        Product Selection ({draftPromo.items.length})
                      </Typography>
                      {draftPromo.items.length > 0 && (
                        <Typography
                          component="button"
                          type="button"
                          onClick={() => setConfirmClearOpen(true)}
                          sx={{
                            background: 'none',
                            border: 'none',
                            p: 0,
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#dc2626',
                            textDecoration: 'none',
                            '&:hover': {
                              color: '#b91c1c',
                              textDecoration: 'underline',
                              background: 'none',
                            },
                          }}
                        >
                          Clear all
                        </Typography>
                      )}
                    </Box>

                    <Autocomplete
                      autoHighlight
                      options={products}
                      filterOptions={filterProductsForSearch}
                      value={null}
                      inputValue={productSearchInput}
                      onInputChange={(_event, newInputValue, reason) => {
                        if (reason !== 'reset') {
                          setProductSearchInput(newInputValue);
                        }
                      }}
                      onChange={(_event, product) => {
                        if (product && typeof product !== 'string') {
                          handleAddProduct(product);
                          setProductSearchInput('');
                        }
                      }}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        const barcode = getPrimaryBarcode(option);
                        return barcode ? `${option.name} (${barcode})` : option.name;
                      }}
                      isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                      renderOption={(props, option) => {
                        const primaryBarcode = getPrimaryBarcode(option);
                        return (
                          <Box
                            component="li"
                            {...props}
                            key={option.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                              py: 1,
                              px: 1.5,
                            }}
                          >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.82rem' }}>
                                {option.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                                {option.category || 'Uncategorized'}
                              </Typography>
                            </Box>
                            {primaryBarcode && (
                              <Chip
                                size="small"
                                label={primaryBarcode}
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  bgcolor: 'rgba(11, 29, 57, 0.08)',
                                  color: '#0b1d39',
                                  borderRadius: '4px',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          inputRef={searchInputRef}
                          label="Search product or scan barcode"
                          placeholder="Scan barcode or type product name..."
                          size="small"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && productSearchInput.trim()) {
                              const query = productSearchInput.trim();
                              const matchedProduct = matchProductByBarcodeOrQuery(products, query);
                              if (matchedProduct) {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddProduct(matchedProduct);
                                setProductSearchInput('');
                              }
                            }
                          }}
                          sx={{ bgcolor: '#ffffff', borderRadius: '8px' }}
                        />
                      )}
                      sx={{ mb: 1.5 }}
                    />

                    <Divider sx={{ my: 1.5, borderColor: '#e2e8f0' }} />

                    {draftPromo.items.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3, fontSize: '0.82rem' }}>
                        No products selected yet. Scan barcode or search above to add products.
                      </Typography>
                    ) : (
                      <TableContainer
                        sx={{
                          maxHeight: 280,
                          overflowY: 'auto',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          bgcolor: '#ffffff',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e1 transparent',
                          '&::-webkit-scrollbar': { width: '5px' },
                          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '3px' },
                        }}
                      >
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                              <TableCell sx={{ ...headCellSx, py: 1 }}>Product</TableCell>
                              <TableCell align="right" sx={{ ...headCellSx, py: 1 }}>MRP</TableCell>
                              <TableCell align="right" sx={{ ...headCellSx, py: 1 }}>Current SP</TableCell>
                              <TableCell align="center" sx={{ ...headCellSx, py: 1, width: 110 }}>Sale Price</TableCell>
                              <TableCell align="right" sx={{ ...headCellSx, py: 1, width: 40 }} />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {draftPromo.items.map((item: PromotionItem, index: number) => {
                              const isJustAdded = recentlyAddedId === item.productId;
                              return (
                                <TableRow
                                  key={`${item.productId}-${index}`}
                                  hover
                                  sx={{
                                    bgcolor: isJustAdded ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                                    transition: 'background-color 0.4s ease-in-out',
                                    borderLeft: isJustAdded ? '3px solid #16a34a' : '3px solid transparent',
                                  }}
                                >
                                  <TableCell sx={{ py: 1, fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                                    {item.productName}
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1, fontSize: '0.8rem', color: '#64748b' }}>
                                    ₹{item.mrp || 0}
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1, fontSize: '0.8rem', color: '#64748b' }}>
                                    ₹{item.sellingPrice || 0}
                                  </TableCell>
                                  <TableCell align="center" sx={{ py: 0.75 }}>
                                    <TextField
                                      inputRef={(el) => {
                                        priceInputRefs.current[item.productId] = el;
                                      }}
                                      size="small"
                                      type="number"
                                      value={item.promoPrice !== undefined ? item.promoPrice : ''}
                                      onChange={(e) => handlePromoPriceChange(item.productId, e.target.value)}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start" sx={{ mr: 0.25 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                                              ₹
                                            </Typography>
                                          </InputAdornment>
                                        ),
                                      }}
                                      inputProps={{
                                        min: 0,
                                        step: 'any',
                                        style: {
                                          padding: '3px 6px',
                                          fontSize: '0.82rem',
                                          fontWeight: 700,
                                          color: '#16a34a',
                                          textAlign: 'right',
                                        },
                                      }}
                                      sx={{
                                        width: 95,
                                        bgcolor: '#ffffff',
                                        '& .MuiOutlinedInput-root': {
                                          height: 30,
                                          borderRadius: '6px',
                                        },
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveItem(index)}
                                      sx={{
                                        color: '#94a3b8',
                                        p: 0.5,
                                        '&:hover': { color: '#dc2626', bgcolor: '#fef2f2' },
                                      }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Paper>
                </>
              )}
            </Box>

            {/* Footer Actions */}
            <Box
              sx={{
                p: 1.5,
                px: 2,
                bgcolor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={handleCloseSidebar}
                disabled={isSaving}
                sx={{
                  borderRadius: '8px',
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveChanges}
                disabled={isSaving || loadingItems}
                sx={{
                  bgcolor: '#0b1d39',
                  borderRadius: '8px',
                  px: 2.5,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
              >
                {isSaving
                  ? isCreating ? 'Creating Event...' : 'Saving...'
                  : isCreating ? 'Create Event' : 'Save Changes'}
              </Button>
            </Box>
          </InventoryPanelShell>
        </Box>
      )}

      {/* Confirmation Dialog for Removing Sale Event */}
      <Dialog
        open={saleToDelete !== null}
        onClose={() => setSaleToDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            pt: 1.5,
            px: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
            Remove Sale Event
          </Typography>
          <IconButton size="small" onClick={() => setSaleToDelete(null)} sx={{ color: '#64748b' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 2, pt: '10px !important', pb: 2 }}>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
            Are you sure you want to remove this sale event?
          </Typography>
          {targetSaleToDelete && (
            <Typography
              variant="caption"
              sx={{ color: '#64748b', fontSize: '0.75rem', mt: 0.75, display: 'block' }}
            >
              Event: {targetSaleToDelete.name}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSaleToDelete(null)}
            sx={{
              borderRadius: '8px',
              borderColor: '#cbd5e1',
              color: '#475569',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              px: 2,
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            No
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleConfirmRemove}
            sx={{
              borderRadius: '8px',
              bgcolor: '#dc2626',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              px: 2.5,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Clear All Products Dialog */}
      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '10px' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            pt: 1.5,
            px: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
            Clear All Products
          </Typography>
          <IconButton size="small" onClick={() => setConfirmClearOpen(false)} sx={{ color: '#64748b' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 2, pt: '10px !important', pb: 2 }}>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
            Are you sure you want to clear all products from this sale event?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setConfirmClearOpen(false)}
            sx={{
              borderRadius: '8px',
              borderColor: '#cbd5e1',
              color: '#475569',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              px: 2,
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            No
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              handleClearAllProducts();
              setConfirmClearOpen(false);
            }}
            sx={{
              borderRadius: '8px',
              bgcolor: '#dc2626',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              px: 2.5,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduledSalesPanel;
