import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Snackbar, Alert } from '@mui/material';
import inventoryService from '@/shared/api/inventoryService';
import posService from '@/shared/api/posService';
import settingsService from '@/shared/api/settingsService';
import { getResponseArray, getResponseObject } from '@/shared/utils/responseGuards';
import PromotionSidebar from '@/domains/promotions/components/PromotionSidebar';
import ThresholdSettingsPanel from '@/domains/promotions/components/ThresholdSettingsPanel';
import ScheduledSalesPanel from '@/domains/promotions/components/ScheduledSalesPanel';
import PromotionFormDialog from '@/domains/promotions/components/PromotionFormDialog';

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('threshold');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
    endDate: new Date().toLocaleDateString('en-CA'),
    items: [],
  });

  // Product selection state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productPriceInfo, setProductPriceInfo] = useState(null);
  const [promoPrice, setPromoPrice] = useState('');

  const [promoSettings, setPromoSettings] = useState({
    enabled: false,
    config: [], // Array of { threshold, profitPercentage, minCostPrice, maxCostPrice, sortBySales, maxGiftsToShow }
  });
  const [newThreshold, setNewThreshold] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  async function fetchCategories() {
    try {
      const data = await inventoryService.fetchCategories();
      const flatten = (nodes) => {
        let list = [];
        nodes.forEach((node) => {
          list.push(node.path);
          if (node.children) list.push(...flatten(node.children));
        });
        return list;
      };
      setCategories(flatten(getResponseArray(data)));
    } catch (error) {
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
          const migratedConfig = promoData.thresholds.map((t) => ({
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
      console.error('Failed to fetch promotion settings:', error);
    }
  }

  const handleSavePromoSettings = async () => {
    try {
      await settingsService.updateSettings({
        key: 'promotion_buy_x_get_free',
        value: promoSettings,
      });
      setSnackbar({
        open: true,
        message: 'Promotion settings saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to save promotion settings:', error);
      setSnackbar({ open: true, message: 'Failed to save promotion settings', severity: 'error' });
    }
  };

  const handleAddThreshold = () => {
    const val = parseInt(newThreshold);
    if (isNaN(val) || val <= 0) return;

    const currentConfig = promoSettings.config || [];
    if (currentConfig.some((c) => c.threshold === val)) return;

    const newEntry = {
      threshold: val,
      isActive: false,
      profitPercentage: 20,
      minCostPrice: 0,
      maxCostPrice: null,
      allowedGroups: [],
      disallowedGroups: [],
      sortBySales: 'none',
      maxGiftsToShow: 5,
    };

    setPromoSettings((prev) => ({
      ...prev,
      config: [...(prev.config || []), newEntry].sort((a, b) => a.threshold - b.threshold),
    }));
    setNewThreshold('');
  };

  const handleRemoveThreshold = (threshold) => {
    setPromoSettings((prev) => ({
      ...prev,
      config: (prev.config || []).filter((c) => c.threshold !== threshold),
    }));
  };

  const handleUpdateConfig = (threshold, field, value) => {
    setPromoSettings((prev) => ({
      ...prev,
      config: prev.config.map((c) => (c.threshold === threshold ? { ...c, [field]: value } : c)),
    }));
  };

  async function fetchPromotions() {
    try {
      const data = await posService.fetchPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    }
  }

  async function fetchProducts() {
    try {
      const data = await inventoryService.fetchProducts({ pageSize: 1000 });
      setProducts(getResponseArray(data));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fetchPromotions();
      fetchProducts();
      fetchPromoSettings();
      fetchCategories();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleOpenDialog = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData({
      name: '',
      startDate: new Date().toLocaleDateString('en-CA'),
      endDate: new Date().toLocaleDateString('en-CA'),
      items: [],
    });
    setOpenDialog(true);
  };

  const handleEditOpen = async (promo) => {
    setIsEditMode(true);
    setEditId(promo.id);

    // Convert ISO dates to YYYY-MM-DD
    const start = promo.startDate.split('T')[0];
    const end = promo.endDate.split('T')[0];

    // Fetch current pricing for the items in the promotion
    const enrichedItems = await Promise.all(
      promo.items.map(async (item) => {
        try {
          const data = await posService.fetchPromotionProductOptions(item.productId);
          return {
            productId: item.productId,
            productName: item.product?.name || 'Unknown Product',
            promoPrice: item.promoPrice,
            mrp: data.mrp,
            costPrice: data.costPrice,
            sellingPrice: data.sellingPrice,
          };
        } catch {
          return {
            productId: item.productId,
            productName: item.product?.name || 'Unknown Product',
            promoPrice: item.promoPrice,
            mrp: 0,
            costPrice: 0,
            sellingPrice: 0,
          };
        }
      })
    );

    setFormData({
      name: promo.name,
      startDate: start,
      endDate: end,
      isActive: promo.isActive,
      items: enrichedItems,
    });

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setProductPriceInfo(null);
    setPromoPrice('');
  };

  const handleProductSelect = async (event, newValue) => {
    setSelectedProduct(newValue);
    if (newValue) {
      try {
        const data = await posService.fetchPromotionProductOptions(newValue.id);
        setProductPriceInfo(data);
        setPromoPrice(data.sellingPrice);
      } catch (error) {
        console.error('Failed to fetch product pricing:', error);
      }
    } else {
      setProductPriceInfo(null);
      setPromoPrice('');
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !promoPrice) return;

    const newItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      promoPrice: parseFloat(promoPrice),
      mrp: productPriceInfo.mrp,
      costPrice: productPriceInfo.costPrice,
      sellingPrice: productPriceInfo.sellingPrice,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedProduct(null);
    setProductPriceInfo(null);
    setPromoPrice('');
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate) {
      setSnackbar({
        open: true,
        message: 'Please select both start and end dates',
        severity: 'error',
      });
      return;
    }

    const [sy, sm, sd] = formData.startDate.split('-').map(Number);
    const [ey, em, ed] = formData.endDate.split('-').map(Number);

    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setSnackbar({ open: true, message: 'Invalid date format selected', severity: 'error' });
      return;
    }

    try {
      const submissionData = {
        ...formData,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };

      if (isEditMode) {
        await posService.updatePromotion(editId, submissionData);
      } else {
        await posService.createPromotion(submissionData);
      }
      fetchPromotions();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save promotion:', error);
    }
  };

  const handleDeletePromotion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await posService.deletePromotion(id);
      fetchPromotions();
    } catch (error) {
      console.error('Failed to delete promotion:', error);
    }
  };

  const isPromotionActive = (promo) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    return promo.isActive && now >= start && now <= end;
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          m: 3,
          px: 4,
          py: 2.5,
          flexShrink: 0,
          background: 'linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)',
          borderBottom: '1px solid rgba(16, 24, 40, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}
            >
              Sales & Promotions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Schedule temporary price reductions and create sales events.
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Container
        disableGutters
        maxWidth={false}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, px: 3, pb: 3 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            flex: 1,
            minHeight: 0,
          }}
        >
          <PromotionSidebar activeTab={activeTab} onChangeTab={setActiveTab} />

          {/* Content Area */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflow: 'auto',
            }}
          >
            {activeTab === 'threshold' && (
              <ThresholdSettingsPanel
                promoSettings={promoSettings}
                setPromoSettings={setPromoSettings}
                newThreshold={newThreshold}
                setNewThreshold={setNewThreshold}
                categories={categories}
                onSave={handleSavePromoSettings}
                onAddThreshold={handleAddThreshold}
                onUpdateConfig={handleUpdateConfig}
                onRemoveThreshold={handleRemoveThreshold}
              />
            )}

            {activeTab === 'sales' && (
              <ScheduledSalesPanel
                promotions={promotions}
                onCreate={handleOpenDialog}
                onEdit={handleEditOpen}
                onDelete={handleDeletePromotion}
                isPromotionActive={isPromotionActive}
              />
            )}
          </Box>
        </Box>
      </Container>

      <PromotionFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        isEditMode={isEditMode}
        formData={formData}
        setFormData={setFormData}
        products={products}
        selectedProduct={selectedProduct}
        onProductSelect={handleProductSelect}
        productPriceInfo={productPriceInfo}
        promoPrice={promoPrice}
        setPromoPrice={setPromoPrice}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onSubmit={handleSubmit}
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
