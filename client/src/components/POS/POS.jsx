import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
    Box,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    ButtonBase
} from '@mui/material';
import {
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    LocalOffer as PromoIcon,
    Close as CloseIcon,
    Calculate as CalculateIcon
} from '@mui/icons-material';

import POSSearchBar from './POSSearchBar';
import CartTable from './CartTable';
import TransactionPanel from './TransactionPanel';
import BatchSelectionDialog from './BatchSelectionDialog';
import ReceiptPreviewDialog from './ReceiptPreviewDialog';
import QuantityDialog from './QuantityDialog';
import LooseSaleDialog from './LooseSaleDialog';
import POSTabs from './POSTabs';
import Receipt from './Receipt';
import Calculator from './Calculator';
import NumpadDialog from './NumpadDialog';
import CustomDialog from '../common/CustomDialog';
import SuccessNotification from '../common/SuccessNotification';
import useCustomDialog from '../../hooks/useCustomDialog';
import { getStoredPaymentSettings, getFullscreenEnabled, getNotificationDuration, getExtraDiscountEnabled, getChangeCalculatorEnabled, setChangeCalculatorEnabled, getPaymentMethodsEnabled, getCalculatorEnabled, STORAGE_KEYS as PAYMENT_STORAGE_KEYS } from '../../utils/paymentSettings';

const STORAGE_KEYS = {
    receipt: 'posReceiptSettings',
    shopName: 'posShopName'
};

const DEFAULT_RECEIPT_SETTINGS = {
    shopName: true,
    header: true,
    footer: true,
    mrp: true,
    price: true,
    discount: true,
    totalValue: true,
    productName: true,
    exp: true,
    barcode: true,
    totalSavings: true,
    customShopName: 'Bachat Bazaar',
    customHeader: '123 Business Street, City',
    customHeader2: '',
    customHeader3: '',
    customFooter: 'Thank You! Visit Again',
    customFooter2: '',
    directPrint: true,
    printerType: '',
    paperSize: '72mm',
    marginTop: 0,
    marginBottom: 0,
    marginSide: 4,
    roundOff: true,
    billFormat: 'Standard',
    fontSize: 0.7,
    itemFontSize: 0.7,
    lineHeight: 1.1,
    invoiceLabel: 'Tax Invoice',
    showBranding: false,
    titleAlign: 'center',
    headerAlign: 'center',
    footerAlign: 'center'
};

const getStoredReceiptSettings = () => {
    try {
        const shopName = localStorage.getItem(STORAGE_KEYS.shopName) || 'Bachat Bazaar';
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.receipt));
        return {
            ...DEFAULT_RECEIPT_SETTINGS,
            customShopName: shopName,
            ...stored
        };
    } catch {
        return { ...DEFAULT_RECEIPT_SETTINGS };
    }
};

const POS = ({ receiptSettings: propReceiptSettings, shopMetadata: propShopMetadata, printers = [], defaultPrinter = null }) => {
    const navigate = useNavigate();
    const { dialogState, showError, showWarning, showConfirm, closeDialog } = useCustomDialog();
    const [products, setProducts] = useState(() => {
        try {
            const cached = localStorage.getItem('posCachedProducts');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [currentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('posCurrentUser'));
        } catch {
            return null;
        }
    });

    // Multi-tab state
    const [tabs, setTabs] = useState(() => {
        try {
            const savedTabs = sessionStorage.getItem('posOrderTabs');
            if (savedTabs) {
                return JSON.parse(savedTabs);
            }
        } catch (e) {
            console.error('Failed to parse saved tabs from session storage');
        }
        return [{ id: 1, name: 'Order 1', cart: [], discount: 0 }];
    });

    const [activeTabId, setActiveTabId] = useState(() => {
        try {
            const savedActiveTab = sessionStorage.getItem('posActiveTabId');
            if (savedActiveTab) {
                return parseInt(savedActiveTab, 10);
            }
        } catch (e) {
            console.error('Failed to parse saved active tab from session storage');
        }
        return 1;
    });

    const [scannedProduct, setScannedProduct] = useState(null);
    const [manualQuantityItem, setManualQuantityItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSale, setLastSale] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [receiptSettings, setReceiptSettings] = useState(() => propReceiptSettings || getStoredReceiptSettings());
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [paymentSettings, setPaymentSettings] = useState(() => getStoredPaymentSettings());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenEnabled, setFullscreenEnabled] = useState(getFullscreenEnabled);
    const [extraDiscountEnabled, setExtraDiscountEnabled] = useState(() => getExtraDiscountEnabled());
    const [showCalculator, setShowCalculator] = useState(false);
    const [isCalculatorEnabled, setIsCalculatorEnabled] = useState(getCalculatorEnabled);
    const [changeCalculatorEnabled, setChangeCalculatorEnabledState] = useState(getChangeCalculatorEnabled());
    const [paymentMethodsEnabled, setPaymentMethodsEnabled] = useState(getPaymentMethodsEnabled());
    const [shouldPrintAfterPayment, setShouldPrintAfterPayment] = useState(false);
    const [notificationDuration, setNotificationDuration] = useState(() => getNotificationDuration());

    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [lastAddedItemId, setLastAddedItemId] = useState(null);
    const searchBarRef = useRef(null);
    const [showLooseSaleDialog, setShowLooseSaleDialog] = useState(false);
    const [looseSaleEnabled, setLooseSaleEnabled] = useState(() => localStorage.getItem('posLooseSaleEnabled') !== 'false');
    const [promoSettings, setPromoSettings] = useState({
        enabled: false,
        config: []
    });
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [showNumpad, setShowNumpad] = useState(false);
    const [showPromoGifts, setShowPromoGifts] = useState(false);
    const [shopMetadata, setShopMetadata] = useState(() => propShopMetadata || {
        shopMobile: '',
        shopMobile2: '',
        shopAddress: '',
        shopEmail: '',
        shopGST: '',
        shopLogo: ''
    });

    // Update state when props change
    useEffect(() => {
        if (propReceiptSettings) setReceiptSettings(propReceiptSettings);
    }, [propReceiptSettings]);

    useEffect(() => {
        if (propShopMetadata) setShopMetadata(propShopMetadata);
    }, [propShopMetadata]);

    // Reliable focus management for POS Search Bar
    const refocus = useCallback(() => {
        const timer = setTimeout(() => {
            const activeElement = document.activeElement;
            const isInput = activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'SELECT' ||
                activeElement.isContentEditable;

            // Only refocus if focus isn't already on an input
            if (!isInput && searchBarRef.current) {
                searchBarRef.current.focus();
            }
        }, 300); // Settling time for transitions/mount
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // 1. Refocus on mount
        const cleanup = refocus();

        // 2. Refocus when window/app gains focus (fixes Windows Alt-Tab issue)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refocus();
            }
        };

        const handleFocus = () => refocus();
        const handlePosRefocus = () => refocus();

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('pos-refocus', handlePosRefocus);

        return () => {
            cleanup();
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('pos-refocus', handlePosRefocus);
        };
    }, [refocus, activeTabId]);

    const refreshSettings = useCallback(async (retries = 3) => {
        try {
            const [settingsRes, statsRes] = await Promise.all([
                api.get('/api/settings'),
                api.get('/api/reports/top-selling')
            ]);

            const sett = settingsRes.data.data;
            if (sett.posReceiptSettings) setReceiptSettings(sett.posReceiptSettings);
            if (sett.posPaymentSettings) setPaymentSettings(sett.posPaymentSettings);
            if (sett.posEnableExtraDiscount !== undefined) setExtraDiscountEnabled(sett.posEnableExtraDiscount);
            if (sett.posNotificationDuration !== undefined) setNotificationDuration(sett.posNotificationDuration);
            setProductSales(statsRes.data || {});
            setShopMetadata({
                shopMobile: sett.shopMobile || '',
                shopMobile2: sett.shopMobile2 || '',
                shopAddress: sett.shopAddress || '',
                shopEmail: sett.shopEmail || '',
                shopGST: sett.shopGST || '',
                shopLogo: sett.shopLogo || ''
            });

            if (sett.promotion_buy_x_get_free) {
                const data = sett.promotion_buy_x_get_free;
                if (data.thresholds && !data.config) {
                    const migratedConfig = data.thresholds.map(t => ({
                        threshold: t,
                        isActive: true,
                        profitPercentage: data.profitPercentage || 20,
                        minCostPrice: data.minCostPrice || 0,
                        maxCostPrice: data.maxCostPrice || null,
                        sortBySales: data.sortBySales || 'none',
                        maxGiftsToShow: data.maxGiftsToShow || 5
                    }));
                    setPromoSettings({
                        enabled: data.enabled || false,
                        config: migratedConfig
                    });
                } else {
                    setPromoSettings({
                        enabled: data.enabled || false,
                        config: data.config || []
                    });
                }
            }
        } catch (error) {
            console.error(`Failed to refresh POS settings (remaining retries: ${retries}):`, error);
            if (retries > 0) {
                setTimeout(() => refreshSettings(retries - 1), 1000);
            }
        }
    }, []);

    // Save tabs state to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem('posOrderTabs', JSON.stringify(tabs));
    }, [tabs]);

    // Save activeTabId to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem('posActiveTabId', activeTabId.toString());
    }, [activeTabId]);

    useEffect(() => {
        refreshSettings();
        const handleSettingsUpdated = () => {
            refreshSettings();
            setFullscreenEnabled(getFullscreenEnabled());
            setIsCalculatorEnabled(getCalculatorEnabled());
        };
        window.addEventListener('pos-settings-updated', handleSettingsUpdated);
        return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
    }, [refreshSettings]);


    // Resizable Layout State
    const [transactionPanelWidth, setTransactionPanelWidth] = useState(() => {
        return Number(localStorage.getItem('posTransactionPanelWidth')) || 450;
    });
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e) => {
        if (isResizing) {
            // Calculate width from the right side
            const newWidth = window.innerWidth - e.clientX - 24; // 24px is for the standard padding
            if (newWidth > 320 && newWidth < window.innerWidth * 0.6) {
                setTransactionPanelWidth(newWidth);
                localStorage.setItem('posTransactionPanelWidth', newWidth.toString());
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'default';
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'default';
        };
    }, [isResizing, resize, stopResizing]);

    useEffect(() => {
        const handleBarcodeNotFound = (e) => {
            setNotification({ open: true, message: `No product found for barcode: ${e.detail}`, severity: 'error', duration: 300 });
        };
        window.addEventListener('pos-barcode-not-found', handleBarcodeNotFound);
        return () => window.removeEventListener('pos-barcode-not-found', handleBarcodeNotFound);
    }, []);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0] || { id: 1, name: 'Order 1', cart: [], discount: 0 };
    const cart = activeTab.cart || [];
    const discount = activeTab.discount || 0;
    const [productSales, setProductSales] = useState({});

    // Auto-select Cash when cart gets items, clear when empty
    useEffect(() => {
        setSelectedPaymentMethod(prev => {
            if (cart.length > 0 && !prev) {
                return { id: 'cash', label: 'Cash', color: '#16a34a' };
            } else if (cart.length === 0 && prev) {
                return null;
            }
            return prev;
        });
    }, [cart.length]);

    // ===== All Functions Declared BEFORE useEffect =====

    const fetchProducts = async (retries = 3) => {
        try {
            const res = await api.get('/api/products', {
                params: { includeBatches: true }
            });
            const data = res.data.data;
            setProducts(data);

            // Cache to localStorage for instant load next time
            try {
                localStorage.setItem('posCachedProducts', JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to cache products:', e);
            }
        } catch (err) {
            console.error(`Error fetching products (remaining retries: ${retries}):`, err);
            if (retries > 0) {
                setTimeout(() => fetchProducts(retries - 1), 1000);
            } else {
                setNotification({
                    open: true,
                    message: `Unable to connect to POS server. ${err.message}`,
                    severity: 'error',
                    duration: 5000
                });
            }
        }
    };

    const persistReceiptSettings = async (nextSettings) => {
        try {
            localStorage.setItem(STORAGE_KEYS.receipt, JSON.stringify(nextSettings));
            window.dispatchEvent(new Event('pos-settings-updated'));

            // Persist to database
            await api.post('/api/settings', {
                key: 'posReceiptSettings',
                value: nextSettings
            });
        } catch (error) {
            console.error('Failed to persist receipt settings:', error);
        }
    };

    const handleSettingChange = (field) => {
        setReceiptSettings(prev => {
            const next = { ...prev, [field]: !prev[field] };
            persistReceiptSettings(next);
            return next;
        });
    };

    const handleTextSettingChange = (field, value) => {
        setReceiptSettings(prev => {
            const next = { ...prev, [field]: value };
            persistReceiptSettings(next);
            return next;
        });
    };

    // Tab Management
    const updateTab = (tabId, updates) => {
        setTabs(prev => prev.map(tab =>
            tab.id === tabId ? { ...tab, ...updates } : tab
        ));
    };

    const handleAddTab = () => {
        const newId = Math.max(...tabs.map(t => t.id), 0) + 1;
        const newTab = { id: newId, name: `Order ${newId}`, cart: [], discount: 0 };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
        refocus();
    };

    const handleCloseTab = (tabId) => {
        if (tabs.length === 1) {
            // If only one tab, just clear it
            updateTab(tabId, { cart: [], discount: 0 });
            refocus();
            return;
        }

        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        if (activeTabId === tabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
        refocus();
    };

    // Cart Actions (Wrapper to update active tab)
    const setCart = (newCartOrFn) => {
        const newCart = typeof newCartOrFn === 'function' ? newCartOrFn(cart) : newCartOrFn;
        updateTab(activeTabId, { cart: newCart });
    };

    const setDiscount = (newDiscount) => {
        updateTab(activeTabId, { discount: newDiscount });
    };

    const addToCart = (product, batch) => {
        setCart(prev => {
            const existing = prev.find(item => item.batch_id === batch.id);
            const newQuantity = existing ? existing.quantity + 1 : 1;

            // Helper to get effective price based on quantity
            const getPrice = (qty) => {
                if (batch.wholesaleEnabled && batch.wholesaleMinQty && qty >= batch.wholesaleMinQty) {
                    return batch.wholesalePrice;
                }
                if (product.isOnSale && product.promoPrice < batch.sellingPrice) {
                    return product.promoPrice;
                }
                return batch.sellingPrice;
            };

            const effectivePrice = getPrice(newQuantity);

            if (existing) {
                return prev.map(item => item.batch_id === batch.id
                    ? { ...item, quantity: newQuantity, price: effectivePrice }
                    : item
                );
            }

            return [...prev, {
                product_id: product.id,
                batch_id: batch.id,
                name: product.name,
                price: effectivePrice,
                quantity: 1,
                batch_code: batch.batchCode,
                mrp: batch.mrp,
                max_quantity: batch.quantity,
                // Store metadata for recalculation
                sellingPrice: batch.sellingPrice,
                wholesaleEnabled: batch.wholesaleEnabled,
                wholesalePrice: batch.wholesalePrice,
                wholesaleMinQty: batch.wholesaleMinQty,
                isOnSale: product.isOnSale && product.promoPrice < batch.sellingPrice,
                promoPrice: product.promoPrice,
                costPrice: batch.costPrice,
                isFree: false
            }];
        });

        setLastAddedItemId(batch.id);

        // Clear search and close dialog immediately
        setSearchQuery('');
        setScannedProduct(null);
        refocus();
    };

    const removeFromCart = (batchId) => {
        setCart(prev => prev.filter(item => item.batch_id !== batchId));
        refocus();
    };

    const updateQuantity = (batchId, change) => {
        setCart(prev => prev.map(item => {
            if (item.batch_id === batchId) {
                if (item.isFree) return item; // Disable adjustments for free items
                const newQty = item.quantity + change;
                if (newQty < 1) return item;

                // Recalculate price based on new quantity
                let newPrice = item.sellingPrice;
                if (item.wholesaleEnabled && item.wholesaleMinQty && newQty >= item.wholesaleMinQty) {
                    newPrice = item.wholesalePrice;
                } else if (item.isOnSale) {
                    newPrice = item.promoPrice;
                }

                return { ...item, quantity: newQty, price: newPrice };
            }
            return item;
        }));
    };

    const handleSetQuantity = (batchId, quantity) => {
        if (quantity < 1) return;
        setCart(prev => prev.map(item => {
            if (item.batch_id === batchId) {
                if (item.isFree) return item; // Disable adjustments for free items
                // Recalculate price based on new quantity
                let newPrice = item.sellingPrice;
                if (item.wholesaleEnabled && item.wholesaleMinQty && quantity >= item.wholesaleMinQty) {
                    newPrice = item.wholesalePrice;
                } else if (item.isOnSale) {
                    newPrice = item.promoPrice;
                }

                return { ...item, quantity, price: newPrice };
            }
            return item;
        }));
    };

    const handleProductInteraction = (product) => {
        // Clear search query immediately for fast scanning
        setSearchQuery('');

        const allBatches = product.batches || [];
        const batches = allBatches.filter(b => b.quantity > 0);

        if (batches.length === 0) {
            showNotification(`${product.name} is Out of Stock!`, 'error');
            return;
        }

        const isBatchTracked = product.batchTrackingEnabled !== false;

        // Check if this was a barcode scan (exact match with barcode)
        const isBarcodeScanned = searchQuery.trim() && product.barcode && searchQuery.trim() === product.barcode.trim();

        if (!isBatchTracked) {
            if (batches.length === 1) {
                // Auto-add only if single batch available
                addToCart(product, batches[0]);
            } else {
                setScannedProduct({ product, batches, mode: 'price' });
            }
            return;
        }

        if (batches.length === 1) {
            // Auto-add only if single batch available
            addToCart(product, batches[0]);
        } else {
            setScannedProduct({ product, batches, mode: 'batch' });
        }
    };

    const handleVoidOrder = async () => {
        const confirmed = await showConfirm('Are you sure you want to VOID this entire order?');
        if (confirmed) {
            updateTab(activeTabId, { cart: [], discount: 0 });
        }
        refocus();
    };

    const handleSelectPaymentMethod = (method) => {
        setSelectedPaymentMethod(method);
    };

    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    const handlePay = async () => {
        const methodToUse = selectedPaymentMethod || { id: 'cash', label: 'Cash' };

        try {
            const items = cart.map(item => ({
                batch_id: item.batch_id,
                quantity: item.quantity,
                sellingPrice: item.price,
                isFree: item.isFree
            }));
            const { icon, ...methodWithoutIcon } = methodToUse;
            const res = await api.post('/api/sale', {
                items,
                discount: 0,
                extraDiscount: discount,
                paymentMethod: methodToUse.label,
                paymentDetails: JSON.stringify({ method: methodWithoutIcon })
            });
            const detailedRes = await api.get(`/api/sale/${res.data.saleId}`);
            setLastSale(detailedRes.data);

            handleCloseTab(activeTabId);
            fetchProducts();
            setSelectedPaymentMethod(null);

            // Show success notification
            showNotification('Sale Completed Successfully!');
            refocus();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.message || 'Payment failed';
            showError(`Payment failed: ${msg}`);
        }
    };

    const handlePayAndPrint = async () => {
        const methodToUse = selectedPaymentMethod || { id: 'cash', label: 'Cash' };

        try {
            const items = cart.map(item => ({
                batch_id: item.batch_id,
                quantity: item.quantity,
                sellingPrice: item.price,
                isFree: item.isFree
            }));
            const { icon, ...methodWithoutIcon } = methodToUse;
            const res = await api.post('/api/sale', {
                items,
                discount: 0,
                extraDiscount: discount,
                paymentMethod: methodToUse.label,
                paymentDetails: JSON.stringify({ method: methodWithoutIcon })
            });

            flushSync(() => {
                setLastSale(res.data.sale);
                handleCloseTab(activeTabId);
                setSelectedPaymentMethod(null);
            });

            // Handle Printing IMMEDIATELY after state flush
            if (receiptSettings.directPrint) {
                const rawPrinter = receiptSettings.printerType;
                const isValidPrinter = rawPrinter && printers.some(p => p.name === rawPrinter);
                const printer = isValidPrinter ? rawPrinter : (defaultPrinter || (printers.find(p => p.isDefault) || printers[0])?.name);

                if (window.electron) {
                    window.electron.ipcRenderer.send('print-manual', { printerName: printer });
                } else {
                    window.print();
                }
            } else {
                setShowReceipt(true);
            }

            // Defer non-critical product refresh until after print handoff
            fetchProducts();
            refocus();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.message || 'Payment failed';
            showError(`Payment failed: ${msg}`);
        }
    };

    // Shortcut Keys (F9, F10, F12)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts if user is typing in an input/textarea
            const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;

            // F8: Loose Sale
            if (e.key === 'F8') {
                e.preventDefault();
                setShowLooseSaleDialog(true);
            }

            // F9: Change Calculator
            if (e.key === 'F9') {
                e.preventDefault();
                setShowNumpad(true);
            }

            // F10: Pay
            if (e.key === 'F10') {
                if (isTyping && e.target.closest('.pos-search-bar')) {
                    // Allow F10 even if in search bar
                } else if (isTyping) {
                    return;
                }
                e.preventDefault();
                const activeTab = tabs.find(t => t.id === activeTabId);
                if (activeTab && activeTab.cart.length > 0) {
                    handlePay();
                }
            }

            // F12: Pay & Print
            if (e.key === 'F12') {
                if (isTyping && e.target.closest('.pos-search-bar')) {
                    // Allow F12 even if in search bar
                } else if (isTyping) {
                    return;
                }
                e.preventDefault();
                const activeTab = tabs.find(t => t.id === activeTabId);
                if (activeTab && activeTab.cart.length > 0) {
                    handlePayAndPrint();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tabs, activeTabId, selectedPaymentMethod, handlePay, handlePayAndPrint]);

    const handleFullscreenToggle = async () => {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } catch {
                showError('Failed to enter fullscreen mode');
            }
        } else {
            try {
                await document.exitFullscreen();
                setIsFullscreen(false);
            } catch {
                showError('Failed to exit fullscreen mode');
            }
        }
    };

    const handlePrintLastReceipt = () => {
        if (lastSale) {
            if (receiptSettings.directPrint) {
                const rawPrinter = receiptSettings.printerType;
                const isValidPrinter = rawPrinter && printers.some(p => p.name === rawPrinter);
                const printer = isValidPrinter ? rawPrinter : (defaultPrinter || (printers.find(p => p.isDefault) || printers[0])?.name);

                if (window.electron) {
                    window.electron.ipcRenderer.send('print-manual', { printerName: printer });
                } else {
                    window.print();
                }
            } else {
                setShowReceipt(true);
            }
        }
    };

    const handleRefund = () => {
        navigate('/refund');
    };

    // ===== useEffect hooks come AFTER function declarations =====

    useEffect(() => {
        fetchProducts();

        // Auto-refresh products every 30 seconds to get updated stock levels
        const interval = setInterval(() => {
            fetchProducts();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleSettingsUpdated = () => {
            setReceiptSettings(getStoredReceiptSettings());
            setFullscreenEnabled(getFullscreenEnabled());
            setPaymentSettings(getStoredPaymentSettings());
            setNotificationDuration(getNotificationDuration());
            setExtraDiscountEnabled(getExtraDiscountEnabled());
            setChangeCalculatorEnabledState(getChangeCalculatorEnabled());
            setPaymentMethodsEnabled(getPaymentMethodsEnabled());
            setLooseSaleEnabled(localStorage.getItem('posLooseSaleEnabled') !== 'false');
        };

        window.addEventListener('pos-settings-updated', handleSettingsUpdated);
        return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
    }, []);


    const subTotal = (cart || []).reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
    const totalMrp = (cart || []).reduce((sum, item) => sum + ((item?.mrp || 0) * (item?.quantity || 0)), 0);
    const totalQty = (cart || []).reduce((sum, item) => sum + (item?.quantity || 0), 0);
    const baseTotalAmount = Math.max(0, subTotal - discount);
    const totalProfit = useMemo(() => {
        return cart.reduce((sum, item) => {
            if (item.isFree) return sum; // Exclude free items from profit generation
            const profitPerUnit = (item.price || 0) - (item.costPrice || 0);
            return sum + (profitPerUnit * item.quantity);
        }, 0);
    }, [cart]);

    const activeConfig = useMemo(() => {
        if (!promoSettings?.enabled || !promoSettings?.config?.length) return null;
        const metConfigs = promoSettings.config.filter(c => Number(baseTotalAmount) >= Number(c.threshold) && c.isActive !== false);
        if (metConfigs.length === 0) return null;
        return metConfigs.reduce((prev, curr) => (Number(curr.threshold) > Number(prev.threshold)) ? curr : prev);
    }, [baseTotalAmount, promoSettings]);

    const alreadyHasFreeProduct = useMemo(() => cart.some(item => item.isFree), [cart]);

    // O(1) Barcode Lookup Map for Instant Scanning
    const barcodeMap = useMemo(() => {
        const map = new Map();
        products.forEach(p => {
            if (p.barcode) {
                // Handle multiple barcodes (pipe separated)
                const barcodes = p.barcode.split('|').map(b => b.trim()).filter(Boolean);
                barcodes.forEach(b => map.set(b.toLowerCase(), p));
            }
        });
        return map;
    }, [products]);

    const eligibleFreeProducts = useMemo(() => {
        if (!activeConfig) return [];

        // Reset toggle if threshold changed (optional, lets user know a new tier is hit)
        // Note: Can't set state in useMemo, use useEffect instead

        const profitLimit = Number(totalProfit) * (Number(activeConfig.profitPercentage || 20) / 100);
        const minCost = Number(activeConfig.minCostPrice || 0);

        // Max cost should be the minimum of:
        // 1. User defined max cost (if any)
        // 2. Profit based limit (percentage of total profit)
        const effectiveMaxCost = activeConfig.maxCostPrice !== null && activeConfig.maxCostPrice !== undefined ?
            Math.min(Number(activeConfig.maxCostPrice), profitLimit) :
            profitLimit;

        const filtered = products.filter(p => {
            // Category checking: if allowedGroups is set, p.category must match/start with one of them
            const allowedGroups = activeConfig.allowedGroups || [];
            const productCategory = p.category || '';
            if (allowedGroups.length > 0) {
                const isAllowed = allowedGroups.some(group =>
                    productCategory === group || productCategory.startsWith(`${group}/`)
                );
                if (!isAllowed) return false;
            }

            // Disallowed checking: if productCategory matches/starts with any disallowed group, exclude it
            const disallowedGroups = activeConfig.disallowedGroups || [];
            if (disallowedGroups.length > 0) {
                const isDisallowed = disallowedGroups.some(group =>
                    productCategory === group || productCategory.startsWith(`${group}/`)
                );
                if (isDisallowed) return false;
            }

            return p.batches && p.batches.some(b => {
                const cp = Number(b.costPrice);
                return cp >= minCost &&
                    cp <= (effectiveMaxCost + 0.001) &&
                    b.quantity > 0;
            });
        });

        // Sorting based on sales count
        let finalGifts = filtered;
        if (activeConfig.sortBySales === 'most') {
            finalGifts = [...filtered].sort((a, b) => (productSales[b.id] || 0) - (productSales[a.id] || 0));
        } else if (activeConfig.sortBySales === 'least') {
            finalGifts = [...filtered].sort((a, b) => (productSales[a.id] || 0) - (productSales[b.id] || 0));
        }

        // Apply max gifts limit
        const limit = activeConfig.maxGiftsToShow !== undefined ? activeConfig.maxGiftsToShow : 5;
        return finalGifts.slice(0, limit);
    }, [activeConfig, totalProfit, products, alreadyHasFreeProduct, productSales]);

    // Auto-remove free product if threshold is lost or profit limit changes
    useEffect(() => {
        if (alreadyHasFreeProduct) {
            const freeItem = cart.find(item => item.isFree);
            if (!freeItem) return;

            if (!activeConfig) {
                removeFromCart(freeItem.cartId);
                return;
            }

            const profitLimit = Number(totalProfit) * (Number(activeConfig.profitPercentage || 20) / 100);
            const minCost = Number(activeConfig.minCostPrice || 0);
            const maxCost = activeConfig.maxCostPrice !== null ?
                Number(activeConfig.maxCostPrice) :
                profitLimit;
            const cp = Number(freeItem.costPrice);

            const isStillEligible = cp >= minCost && cp <= (maxCost + 0.001);

            if (!isStillEligible) {
                removeFromCart(freeItem.cartId);
            }
        }
    }, [activeConfig, totalProfit, cart, alreadyHasFreeProduct]);

    // Ensure toggle is only shown when relevant
    useEffect(() => {
        if (!activeConfig) {
            setShowPromoGifts(false);
        }
    }, [activeConfig]);

    const addFreeProduct = (product) => {
        if (!activeConfig) return;

        const profitLimit = Number(totalProfit) * (Number(activeConfig.profitPercentage || 20) / 100);
        const minCost = Number(activeConfig.minCostPrice || 0);
        const maxCost = activeConfig.maxCostPrice !== null ?
            Number(activeConfig.maxCostPrice) :
            profitLimit;

        // Find the best batch (one that fits the cost limits and has stock)
        const batch = product.batches.find(b => {
            const cp = Number(b.costPrice);
            return cp >= minCost &&
                cp <= (maxCost + 0.001) &&
                b.quantity > 0;
        });

        if (!batch) {
            setNotification({ open: true, message: 'No eligible batch found for this free product.', severity: 'error' });
            return;
        }

        const newFreeItem = {
            product_id: product.id,
            batch_id: batch.id,
            name: `(FREE) ${product.name}`,
            price: 0,
            quantity: 1,
            batch_code: batch.batchCode,
            mrp: batch.mrp,
            max_quantity: batch.quantity,
            sellingPrice: batch.sellingPrice,
            wholesaleEnabled: false,
            wholesalePrice: null,
            wholesaleMinQty: null,
            isOnSale: false,
            promoPrice: null,
            costPrice: batch.costPrice,
            isFree: true
        };

        if (alreadyHasFreeProduct) {
            setCart(prev => {
                const filtered = prev.filter(item => !item.isFree);
                return [...filtered, newFreeItem];
            });
            setNotification({ open: true, message: `Gift swapped to ${product.name}!`, severity: 'success' });
        } else {
            setCart(prev => [...prev, newFreeItem]);
            setNotification({ open: true, message: `${product.name} added as a free gift!`, severity: 'success' });
        }
        refocus();
    };

    const totalAmount = receiptSettings.roundOff ? Math.round(baseTotalAmount) : baseTotalAmount;
    const totalSavings = totalMrp - totalAmount;

    const filterOptions = (options, { inputValue }) => {
        const normalizedInput = inputValue.trim().toLowerCase();
        if (!normalizedInput) return [];

        // 1. FAST PATH: Check for exact barcode match using Map
        const exactMatch = barcodeMap.get(normalizedInput);

        // Buckets for categorization to ensure intuitive results
        const namePrefix = [];
        const barcodePrefix = [];
        const nameContains = [];
        const barcodeContains = [];
        const priceMatches = [];

        // If we have an exact barcode match, it's the highest possible priority
        if (exactMatch) {
            barcodePrefix.push(exactMatch);
        }

        // 2. SEARCH PATH: Categorize all matches
        for (const option of options) {
            if (!option || option === exactMatch) continue;

            const name = (option._searchName || (option._searchName = String(option.name || '').toLowerCase()));
            const barcode = (option._searchBarcode || (option._searchBarcode = String(option.barcode || '').toLowerCase()));

            if (name.startsWith(normalizedInput)) {
                namePrefix.push(option);
            } else if (barcode.startsWith(normalizedInput)) {
                barcodePrefix.push(option);
            } else if (name.includes(normalizedInput)) {
                nameContains.push(option);
            } else if (barcode.includes(normalizedInput)) {
                barcodeContains.push(option);
            } else {
                // Price check
                const priceMatch = (option.batches || []).some((batch) =>
                    batch && (batch._searchPrice || (batch._searchPrice = String(batch.sellingPrice || ''))).includes(normalizedInput)
                );
                if (priceMatch) {
                    priceMatches.push(option);
                }
            }
        }

        // Sort alphabetically within each bucket for consistency
        const sortFn = (a, b) => (a.name || '').localeCompare(b.name || '');
        namePrefix.sort(sortFn);
        barcodePrefix.sort(sortFn);
        nameContains.sort(sortFn);
        barcodeContains.sort(sortFn);
        priceMatches.sort(sortFn);

        // Combine buckets in priority order and limit for performance
        return [
            ...namePrefix,
            ...barcodePrefix,
            ...nameContains,
            ...barcodeContains,
            ...priceMatches
        ].slice(0, 50);
    };

    // Refocus search bar after fullscreen toggle (MUI/React can lose focus during layout shift)
    useEffect(() => {
        const handleFullscreenChange = () => {
            // Wait for transition to complete
            setTimeout(() => {
                const anyDialogOpen = document.querySelector(
                    '.MuiDialog-root[role="presentation"], .MuiBackdrop-root'
                );
                if (anyDialogOpen) return;

                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.tagName === 'SELECT' ||
                    activeElement.isContentEditable;

                if (!isInput && searchBarRef.current) {
                    searchBarRef.current.focus();
                }
            }, 500); // 500ms delay to ensure transition is complete
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Global focus protection — only refocus search bar if no dialog/modal is open
    // and the click was NOT on a button, link, or interactive MUI element
    useEffect(() => {
        const handleGlobalMouseDown = (e) => {
            // Check if click was inside an interactive element we should NOT steal focus from
            const isInteractive = e.target.closest(
                'input, textarea, select, [contenteditable], ' +
                'button, a, [role="button"], [role="link"], ' +
                '[role="dialog"], [role="listbox"], [role="menu"], ' +
                '.MuiDialog-root, .MuiAutocomplete-popper, .MuiPopover-root, .MuiMenu-root, .MuiDrawer-root, ' +
                '.MuiButtonBase-root, .pos-action-btn'
            );
            if (isInteractive) return;

            // If any MUI Dialog or modal is open, don't steal focus
            const anyDialogOpen = document.querySelector(
                '.MuiDialog-root[role="presentation"], .MuiBackdrop-root'
            );
            if (anyDialogOpen) return;

            // Safe to refocus search bar after a settling delay
            setTimeout(() => {
                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.tagName === 'SELECT' ||
                    activeElement.isContentEditable;

                if (!isInput && searchBarRef.current) {
                    searchBarRef.current.focus();
                }
            }, 150);
        };

        window.addEventListener('mousedown', handleGlobalMouseDown);
        return () => window.removeEventListener('mousedown', handleGlobalMouseDown);
    }, []);

    return (
        <>
            <SuccessNotification
                open={notification.open}
                message={notification.message}
                severity={notification.severity}
                onClose={() => setNotification({ ...notification, open: false })}
                duration={notification.duration || notificationDuration}
            />
            <Box
                className="no-print"
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', lg: 'row' },
                    gap: 0,
                    px: { xs: 2, md: 3 },
                    py: { xs: 2, md: 3 },
                    height: 'calc(100vh - 72px)',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {/* Fullscreen Toggle Button - Bottom Left */}
                {fullscreenEnabled && (
                    <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                        <IconButton
                            className="pos-action-btn"
                            onClick={handleFullscreenToggle}
                            size="large"
                            sx={{
                                position: 'fixed',
                                bottom: 20,
                                left: 20,
                                zIndex: 999,
                                width: 56,
                                height: 56,
                                bgcolor: '#1976d2',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                                border: 'none',
                                '&:hover': {
                                    bgcolor: '#1565c0',
                                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.5)'
                                },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {isFullscreen ? (
                                <FullscreenExitIcon sx={{ fontSize: '1.8rem' }} />
                            ) : (
                                <FullscreenIcon sx={{ fontSize: '1.8rem' }} />
                            )}
                        </IconButton>
                    </Tooltip>
                )}

                {/* Calculator Button - Bottom Left (above fullscreen) */}
                {isCalculatorEnabled && (
                    <Tooltip title="Open POS Calculator">
                        <IconButton
                            className="pos-action-btn"
                            onClick={() => setShowCalculator(true)}
                            size="large"
                            sx={{
                                position: 'fixed',
                                bottom: fullscreenEnabled ? 86 : 20,
                                left: 20,
                                zIndex: 999,
                                width: 56,
                                height: 56,
                                bgcolor: '#0284c7',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                                border: 'none',
                                '&:hover': {
                                    bgcolor: '#0369a1',
                                    boxShadow: '0 6px 16px rgba(2, 132, 199, 0.5)'
                                },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <CalculateIcon sx={{ fontSize: '1.8rem' }} />
                        </IconButton>
                    </Tooltip>
                )}

                <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', mr: { lg: 2 } }}>
                    <POSTabs
                        tabs={tabs}
                        activeTabId={activeTabId}
                        onTabChange={setActiveTabId}
                        onTabClose={handleCloseTab}
                        onAddTab={handleAddTab}
                    />

                    <POSSearchBar
                        ref={searchBarRef}
                        products={products}
                        searchQuery={searchQuery}
                        onSearchInputChange={setSearchQuery}
                        onSelectProduct={handleProductInteraction}
                        filterOptions={filterOptions}
                        onLooseSale={() => setShowLooseSaleDialog(true)}
                        looseSaleEnabled={looseSaleEnabled}
                    />
                    <CartTable
                        cart={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemoveFromCart={removeFromCart}
                        onQuantityClick={setManualQuantityItem}
                        lastAddedItemId={lastAddedItemId}
                    />

                    {activeConfig && !showPromoGifts && (
                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', bgcolor: '#f0fff4', borderTop: '1px solid #c6f6d5' }}>
                            <Chip
                                icon={<PromoIcon />}
                                label="View Eligible Offers"
                                onClick={() => {
                                    setShowPromoGifts(true);
                                    refocus();
                                }}
                                color="primary"
                                sx={{
                                    fontWeight: 800,
                                    bgcolor: '#22ab7dff',
                                    '&:hover': { bgcolor: '#059669' },
                                    px: 2,
                                    height: 36,
                                    borderRadius: 2
                                }}
                            />
                        </Box>
                    )}

                    {showPromoGifts && eligibleFreeProducts.length > 0 && (
                        <Box sx={{ p: 1.5, borderTop: '2px dashed #22ab7dff', bgcolor: '#f0fff4', flexShrink: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PromoIcon fontSize="small" /> Eligible Free Gifts
                                    </Typography>
                                    {activeConfig && (
                                        <Chip
                                            label={`Min. Order: ≥ ₹${activeConfig.threshold}`}
                                            color="primary"
                                            size="small"
                                            sx={{
                                                fontWeight: 800,
                                                height: 24,
                                                fontSize: '0.75rem',
                                                bgcolor: 'success.main',
                                                color: 'white',
                                                px: 0.5
                                            }}
                                        />
                                    )}
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setShowPromoGifts(false);
                                        refocus();
                                    }}
                                    sx={{
                                        color: '#065f46',
                                        '&:hover': { bgcolor: 'rgba(6, 95, 70, 0.1)' }
                                    }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                gap: 1.5,
                                overflowX: 'auto',
                                pt: 1,
                                pb: 1,
                                '&::-webkit-scrollbar': { height: '6px' },
                                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e0', borderRadius: '3px' }
                            }}>
                                {eligibleFreeProducts.map((product) => {
                                    const profitLimit = totalProfit * ((activeConfig.profitPercentage || 20) / 100);
                                    const minCost = activeConfig.minCostPrice || 0;
                                    const maxCost = activeConfig.maxCostPrice !== null ? activeConfig.maxCostPrice : profitLimit;
                                    const bestBatch = product.batches.find(b => b.costPrice >= minCost && b.costPrice <= maxCost && b.quantity > 0);
                                    const isSelected = cart.find(item => item.isFree && item.product_id === product.id);

                                    return (
                                        <ButtonBase
                                            key={product.id}
                                            onClick={() => addFreeProduct(product)}
                                            sx={{
                                                flexShrink: 0,
                                                p: 2,
                                                py: 2.25,
                                                width: 160,
                                                minHeight: 110,
                                                bgcolor: isSelected ? '#ccfbf1' : 'white',
                                                border: isSelected ? '2px solid #22ab7dff' : '1px solid #c6f6d5',
                                                borderRadius: 2.5,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 0.75,
                                                transition: 'all 0.2s',
                                                boxShadow: isSelected ? '0 4px 12px rgba(34, 171, 125, 0.15)' : '0 2px 6px rgba(34, 171, 125, 0.08)',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: '0 6px 12px rgba(6, 95, 70, 0.1)',
                                                    borderColor: '#22ab7dff'
                                                }
                                            }}
                                        >
                                            <Typography variant="body2" sx={{
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                                textAlign: 'center',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                height: 38,
                                                lineHeight: 1.2,
                                                color: '#0b1d39'
                                            }}>
                                                {product.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                <Chip
                                                    label="FREE"
                                                    size="small"
                                                    sx={{
                                                        height: 18,
                                                        bgcolor: '#22ab7dff',
                                                        color: 'white',
                                                        fontWeight: 900,
                                                        fontSize: '0.6rem'
                                                    }}
                                                />
                                                {bestBatch && (
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', ml: 0.5 }}>
                                                        MRP: ₹{bestBatch.mrp}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </ButtonBase>
                                    );
                                })}
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* Vertical Resizer Slider */}
                <Box
                    onMouseDown={startResizing}
                    sx={{
                        display: { xs: 'none', lg: 'flex' },
                        width: '8px',
                        cursor: 'col-resize',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1,
                        '&:hover .handle': {
                            bgcolor: 'primary.main',
                            width: '4px'
                        },
                        zIndex: 10
                    }}
                >
                    <Box
                        className="handle"
                        sx={{
                            width: '2px',
                            height: '60px',
                            bgcolor: isResizing ? 'primary.main' : 'divider',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            ...(isResizing && { width: '4px' })
                        }}
                    />
                </Box>

                <Box
                    sx={{
                        width: { xs: '100%', lg: transactionPanelWidth },
                        minWidth: { lg: 320 },
                        height: '100%',
                        flexShrink: 0
                    }}
                >
                    <TransactionPanel
                        cart={cart}
                        discount={discount}
                        onDiscountChange={setDiscount}
                        onVoid={handleVoidOrder}
                        onPay={handlePay}
                        onPayAndPrint={handlePayAndPrint}
                        onRefund={handleRefund}
                        onSelectPaymentMethod={handleSelectPaymentMethod}
                        selectedPaymentMethod={selectedPaymentMethod}
                        paymentSettings={paymentSettings}
                        extraDiscountEnabled={extraDiscountEnabled}
                        subTotal={subTotal}
                        totalMrp={totalMrp}
                        totalQty={totalQty}
                        totalAmount={totalAmount}
                        totalSavings={totalSavings}
                        changeCalculatorEnabled={changeCalculatorEnabled}
                        paymentMethodsEnabled={paymentMethodsEnabled}
                        onPrintLastReceipt={handlePrintLastReceipt}
                        hasLastSale={!!lastSale}
                        receivedAmount={receivedAmount}
                        setReceivedAmount={setReceivedAmount}
                        showNumpad={showNumpad}
                        setShowNumpad={setShowNumpad}
                    />
                </Box>

                <BatchSelectionDialog
                    scannedProduct={scannedProduct}
                    onSelectBatch={addToCart}
                    onClose={() => {
                        setScannedProduct(null);
                        searchBarRef.current?.focus();
                    }}
                />

                <ReceiptPreviewDialog
                    open={showReceipt}
                    onClose={() => {
                        setShowReceipt(false);
                        searchBarRef.current?.focus();
                    }}
                    lastSale={lastSale}
                    receiptSettings={receiptSettings}
                    onSettingChange={handleSettingChange}
                    onTextSettingChange={handleTextSettingChange}
                    isAdmin={currentUser?.role === 'admin'}
                    shopMetadata={shopMetadata}
                    printers={printers}
                    defaultPrinter={defaultPrinter}
                />

                <QuantityDialog
                    open={Boolean(manualQuantityItem)}
                    onClose={() => {
                        setManualQuantityItem(null);
                        refocus();
                    }}
                    onConfirm={(qty) => {
                        handleSetQuantity(manualQuantityItem.batch_id, qty);
                        setManualQuantityItem(null);
                        refocus();
                    }}
                    itemName={manualQuantityItem?.name}
                    initialValue={manualQuantityItem?.quantity || 1}
                />

                <LooseSaleDialog
                    open={showLooseSaleDialog}
                    onClose={() => {
                        setShowLooseSaleDialog(false);
                        refocus();
                    }}
                    onComplete={() => {
                        setNotification({ open: true, message: 'Loose Sale Recorded Successfully!', severity: 'success' });
                        refocus();
                    }}
                />
            </Box>
            <CustomDialog {...dialogState} onClose={closeDialog} />
            <SuccessNotification
                open={notification.open}
                message={notification.message}
                severity={notification.severity}
                onClose={handleCloseNotification}
                duration={notificationDuration}
            />

            {/* Hidden Print Container for Direct Printing */}
            <Box sx={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                height: 0,
                overflow: 'hidden',
                '@media print': {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: 'auto',
                    overflow: 'visible',
                    display: 'block',
                    zIndex: 9999
                }
            }}>
                <div id="thermal-receipt-print">
                    {lastSale && <Receipt sale={lastSale} settings={receiptSettings} shopMetadata={shopMetadata} />}
                </div>
            </Box>

            <Calculator open={showCalculator} onClose={() => {
                setShowCalculator(false);
                refocus();
            }} />

            <NumpadDialog
                open={showNumpad}
                onClose={() => setShowNumpad(false)}
                initialValue={receivedAmount}
                onConfirm={(val) => {
                    setReceivedAmount(val);
                    setShowNumpad(false);
                }}
                title="Received Amount"
            />
        </>
    );
};

export default POS;
