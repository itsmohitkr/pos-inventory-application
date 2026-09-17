import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Promotion,
  PromotionFormState,
  PromoSettings,
  PromoThresholdConfig,
  CategorySale,
  CategorySaleInput,
} from '@/domains/promotions/types';
import type { CategoryNode, Product } from '@/shared/types/models';
import * as Sentry from '@sentry/react';
import type { AlertColor } from '@mui/material';
import { Box, Container, Paper, Typography, Snackbar, Alert, Stack } from '@mui/material';
import inventoryService from '@/shared/api/inventoryService';
import posService from '@/shared/api/posService';
import settingsService from '@/shared/api/settingsService';
import categorySaleService from '@/shared/api/categorySaleService';
import { getResponseArray, getResponseObject } from '@/shared/utils/responseGuards';
import { buildInclusiveDateRange } from '@/shared/utils/isoDate';
import PromotionSidebar from '@/domains/promotions/components/PromotionSidebar';
import ThresholdSettingsPanel from '@/domains/promotions/components/ThresholdSettingsPanel';
import ScheduledSalesPanel from '@/domains/promotions/components/ScheduledSalesPanel';
import CategorySalesPanel from '@/domains/promotions/components/CategorySalesPanel';
import CategorySaleFormDialog from '@/domains/promotions/components/CategorySaleFormDialog';

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('threshold');

  // Category Sale state
  const [openCategorySaleDialog, setOpenCategorySaleDialog] = useState(false);
  const [categorySaleToEdit, setCategorySaleToEdit] = useState<CategorySale | null>(null);

  const [promoSettings, setPromoSettings] = useState<PromoSettings>({
    enabled: false,
    config: [],
  });
  const [newThreshold, setNewThreshold] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: '', severity: 'success' });

  async function fetchCategorySales() {
    try {
      const data = await categorySaleService.fetchCategorySales();
      setCategorySales(data);
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'fetch-category-sales' } });
      console.error('Failed to fetch category sales:', error);
    }
  }

  const handleCreateCategorySale = async (saleInput: CategorySaleInput) => {
    if (categorySaleToEdit) {
      await categorySaleService.updateCategorySale(categorySaleToEdit.id, saleInput);
      setSnackbar({
        open: true,
        message: 'Category sale updated successfully',
        severity: 'success',
      });
    } else {
      await categorySaleService.createCategorySale(saleInput);
      setSnackbar({
        open: true,
        message: 'Category sale created successfully',
        severity: 'success',
      });
    }
    fetchCategorySales();
  };

  const handleToggleCategorySaleStatus = async (id: number, newStatus: 'active' | 'paused') => {
    try {
      await categorySaleService.toggleCategorySaleStatus(id, newStatus);
      setSnackbar({
        open: true,
        message: `Category sale ${newStatus === 'active' ? 'resumed' : 'paused'}`,
        severity: 'success',
      });
      fetchCategorySales();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'toggle-category-sale-status' } });
      setSnackbar({ open: true, message: 'Failed to update sale status', severity: 'error' });
    }
  };

  const handleDeleteCategorySale = async (id: number) => {
    try {
      await categorySaleService.deleteCategorySale(id);
      setSnackbar({ open: true, message: 'Category sale deleted', severity: 'success' });
      fetchCategorySales();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'delete-category-sale' } });
      setSnackbar({ open: true, message: 'Failed to delete category sale', severity: 'error' });
    }
  };

  async function fetchCategories() {
    try {
      const data = await inventoryService.fetchCategories();
      const flatten = (nodes: CategoryNode[]): string[] => {
        const list: string[] = [];
        nodes.forEach((node: CategoryNode) => {
          list.push(node.path);
          if (node.children) list.push(...flatten(node.children));
        });
        return list;
      };
      setCategories(flatten(getResponseArray(data)));
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'promotions-fetch-categories' } });
      console.error('Failed to fetch categories:', error);
    }
  }

  async function fetchPromoSettings() {
    try {
      const data = await settingsService.fetchSettings();
      const settings = getResponseObject(data);
      if (settings.promotion_buy_x_get_free) {
        const promoData = settings.promotion_buy_x_get_free;
        // Migration: If old format (thresholds array) exists but not new config array
        if (promoData.thresholds && !promoData.config) {
          const migratedConfig = promoData.thresholds.map((t: number) => ({
            threshold: t,
            isActive: true,
            profitPercentage: promoData.profitPercentage || 20,
            minCostPrice: promoData.minCostPrice || 0,
            maxCostPrice: promoData.maxCostPrice || null,
            sortBySales: promoData.sortBySales || 'none',
            maxGiftsToShow: promoData.maxGiftsToShow || 5,
          }));
          setPromoSettings({
            enabled: promoData.enabled || false,
            config: migratedConfig,
          });
        } else {
          setPromoSettings({
            enabled: promoData.enabled || false,
            config: promoData.config || [],
          });
        }
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'promotions-fetch-settings' } });
      console.error('Failed to fetch promotion settings:', error);
    }
  }

  const handleSavePromoSettings = async (overrideSettings?: PromoSettings, notify = true) => {
    try {
      const settingsToSave = overrideSettings || promoSettings;
      await settingsService.updateSettings({
        key: 'promotion_buy_x_get_free',
        value: settingsToSave,
      });
      if (notify) {
        setSnackbar({
          open: true,
          message: 'Changes have been applied successfully!',
          severity: 'success',
        });
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'promotions-save-settings' } });
      console.error('Failed to save promotion settings:', error);
      setSnackbar({ open: true, message: 'Failed to save promotion settings', severity: 'error' });
    }
  };

  const handleTogglePromoEnabled = (enabled: boolean) => {
    const updated = { ...promoSettings, enabled };
    setPromoSettings(updated);
    handleSavePromoSettings(updated, true);
  };

  const handleAddThreshold = (customRule?: Partial<PromoThresholdConfig>) => {
    const val = customRule?.threshold ?? parseInt(newThreshold);
    if (isNaN(val) || val <= 0) return;

    const currentConfig = promoSettings.config || [];
    if (currentConfig.some((c) => c.threshold === val)) {
      setSnackbar({
        open: true,
        message: `Rule for ₹${val.toLocaleString()} already exists`,
        severity: 'warning',
      });
      return;
    }

    const newEntry: PromoThresholdConfig = {
      threshold: val,
      isActive: customRule?.isActive ?? true,
      profitPercentage: customRule?.profitPercentage ?? 20,
      minCostPrice: customRule?.minCostPrice ?? 0,
      maxCostPrice: customRule?.maxCostPrice ?? null,
      allowedGroups: customRule?.allowedGroups ?? [],
      disallowedGroups: customRule?.disallowedGroups ?? [],
      sortBySales: customRule?.sortBySales ?? 'none',
      maxGiftsToShow: customRule?.maxGiftsToShow ?? 5,
    };

    const updated: PromoSettings = {
      ...promoSettings,
      config: [...currentConfig, newEntry].sort((a, b) => a.threshold - b.threshold),
    };
    setPromoSettings(updated);
    handleSavePromoSettings(updated, true);
    setNewThreshold('');
  };

  const handleRemoveThreshold = (threshold: number) => {
    const updated: PromoSettings = {
      ...promoSettings,
      config: (promoSettings.config || []).filter((c) => c.threshold !== threshold),
    };
    setPromoSettings(updated);
    handleSavePromoSettings(updated, true);
  };

  const handleUpdateConfig = (
    threshold: number,
    field: keyof PromoThresholdConfig,
    value: unknown,
    autoSave = false
  ) => {
    const updated: PromoSettings = {
      ...promoSettings,
      config: (promoSettings.config || []).map((c) =>
        c.threshold === threshold ? { ...c, [field]: value } : c
      ),
    };
    setPromoSettings(updated);
    if (autoSave) {
      handleSavePromoSettings(updated, true);
    }
  };

  const handleSaveRuleConfig = (
    originalThreshold: number,
    updatedRule: PromoThresholdConfig
  ) => {
    const updated: PromoSettings = {
      ...promoSettings,
      config: (promoSettings.config || [])
        .map((c) => (c.threshold === originalThreshold ? updatedRule : c))
        .sort((a, b) => a.threshold - b.threshold),
    };
    setPromoSettings(updated);
    handleSavePromoSettings(updated, true);
  };

  async function fetchPromotions() {
    try {
      const data = await posService.fetchPromotions();
      setPromotions(data);
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'promotions-fetch' } });
      console.error('Failed to fetch promotions:', error);
    }
  }

  async function fetchProducts() {
    try {
      const data = await inventoryService.fetchProducts({ pageSize: 1000 });
      setProducts(getResponseArray(data));
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'promotions-fetch-products' } });
      console.error('Failed to fetch products:', error);
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fetchPromotions();
      fetchProducts();
      fetchPromoSettings();
      fetchCategories();
      fetchCategorySales();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleCreatePromotion = async (
    promoData: PromotionFormState
  ): Promise<Promotion | null> => {
    if (!promoData.startDate || !promoData.endDate) {
      setSnackbar({
        open: true,
        message: 'Please select both start and end dates',
        severity: 'error',
      });
      return null;
    }

    const range = buildInclusiveDateRange(promoData.startDate, promoData.endDate);
    if (!range) {
      setSnackbar({ open: true, message: 'Invalid date format selected', severity: 'error' });
      return null;
    }

    try {
      const submissionData = {
        ...promoData,
        startDate: range.start,
        endDate: range.end,
      };

      const res = await posService.createPromotion(submissionData);
      const createdPromo = (res && typeof res === 'object' && 'data' in res ? res.data : res) as Promotion;
      setSnackbar({
        open: true,
        message: 'Changes have been applied successfully!',
        severity: 'success',
      });
      await fetchPromotions();
      return createdPromo || null;
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'promotions-create' } });
      console.error('Failed to create promotion:', error);
      setSnackbar({ open: true, message: 'Failed to create promotion', severity: 'error' });
      return null;
    }
  };

  const handleUpdatePromotion = async (
    id: number,
    promoData: PromotionFormState
  ): Promise<boolean> => {
    if (!promoData.startDate || !promoData.endDate) {
      setSnackbar({
        open: true,
        message: 'Please select both start and end dates',
        severity: 'error',
      });
      return false;
    }

    const range = buildInclusiveDateRange(promoData.startDate, promoData.endDate);
    if (!range) {
      setSnackbar({ open: true, message: 'Invalid date format selected', severity: 'error' });
      return false;
    }

    try {
      const submissionData = {
        ...promoData,
        startDate: range.start,
        endDate: range.end,
      };

      await posService.updatePromotion(id, submissionData);
      setSnackbar({
        open: true,
        message: 'Changes have been applied successfully!',
        severity: 'success',
      });
      fetchPromotions();
      return true;
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'promotions-update' } });
      console.error('Failed to update promotion:', error);
      setSnackbar({ open: true, message: 'Failed to update promotion', severity: 'error' });
      return false;
    }
  };

  const handleDeletePromotion = async (id: number, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await posService.deletePromotion(id);
      setSnackbar({
        open: true,
        message: 'Sale event removed successfully',
        severity: 'success',
      });
      fetchPromotions();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'promotions-delete' } });
      console.error('Failed to delete promotion:', error);
      setSnackbar({ open: true, message: 'Failed to delete promotion', severity: 'error' });
    }
  };

  const isPromotionActive = useCallback((promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    return promo.isActive && now >= start && now <= end;
  }, []);

  const activePromotionCount = useMemo(
    () => promotions.filter(isPromotionActive).length,
    [promotions, isPromotionActive]
  );

  return (
    <Box
      sx={{
        bgcolor: '#f8fafc',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header Bar */}
      <Paper
        elevation={0}
        sx={{
          m: 1.5,
          px: 2.5,
          py: 1.75,
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, letterSpacing: -0.3, color: '#0b1d39' }}>
            Promotions & Campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Schedule temporary price reductions and create automated sales events.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ textAlign: 'right', mr: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
              ACTIVE EVENTS
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', lineHeight: 1 }}>
              {activePromotionCount}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0, px: 1.5, pb: 1.5, display: 'flex', gap: 1.5 }}>
        <PromotionSidebar activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
            height: '100%',
          }}
        >
          {activeTab === 'threshold' && (
            <ThresholdSettingsPanel
              promoSettings={promoSettings}
              setPromoSettings={setPromoSettings}
              categories={categories}
              onToggleEnabled={handleTogglePromoEnabled}
              onAddThreshold={handleAddThreshold}
              onUpdateConfig={handleUpdateConfig}
              onSaveRuleConfig={handleSaveRuleConfig}
              onRemoveThreshold={handleRemoveThreshold}
            />
          )}

          {activeTab === 'sales' && (
            <ScheduledSalesPanel
              promotions={promotions}
              products={products}
              onCreatePromotion={handleCreatePromotion}
              onSavePromotion={handleUpdatePromotion}
              onDeletePromotion={(id) => handleDeletePromotion(id, true)}
              isPromotionActive={isPromotionActive}
            />
          )}

          {activeTab === 'category-sales' && (
            <CategorySalesPanel
              sales={categorySales}
              onCreate={() => {
                setCategorySaleToEdit(null);
                setOpenCategorySaleDialog(true);
              }}
              onEdit={(sale) => {
                setCategorySaleToEdit(sale);
                setOpenCategorySaleDialog(true);
              }}
              onDelete={handleDeleteCategorySale}
              onToggleStatus={handleToggleCategorySaleStatus}
            />
          )}
        </Box>
      </Box>

      <CategorySaleFormDialog
        open={openCategorySaleDialog}
        onClose={() => {
          setOpenCategorySaleDialog(false);
          setCategorySaleToEdit(null);
        }}
        onSave={handleCreateCategorySale}
        categories={categories}
        saleToEdit={categorySaleToEdit}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PromotionManagement;
