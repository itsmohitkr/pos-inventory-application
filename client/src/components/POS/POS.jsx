import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Tooltip
} from '@mui/material';
import {
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon
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
import CustomDialog from '../common/CustomDialog';
import SuccessNotification from '../common/SuccessNotification';
import useCustomDialog from '../../hooks/useCustomDialog';
import { getStoredPaymentSettings, getFullscreenEnabled, getNotificationDuration, getExtraDiscountEnabled, getChangeCalculatorEnabled, setChangeCalculatorEnabled, getPaymentMethodsEnabled, STORAGE_KEYS as PAYMENT_STORAGE_KEYS } from '../../utils/paymentSettings';

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
    directPrint: false,
    printerType: 'Thermal Printer',
    paperSize: '80mm',
    marginTop: 0,
    marginBottom: 0,
    marginSide: 4,
    roundOff: true,
    billFormat: 'Standard',
    fontSize: 0.8,
    itemFontSize: 0.8,
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

const POS = ({ receiptSettings: propReceiptSettings, shopMetadata: propShopMetadata }) => {
    const navigate = useNavigate();
    const { dialogState, showError, showWarning, showConfirm, closeDialog } = useCustomDialog();
    const [products, setProducts] = useState([]);
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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState({ label: 'Cash', color: '#16a34a' });
    const [paymentSettings, setPaymentSettings] = useState(() => getStoredPaymentSettings());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenEnabled, setFullscreenEnabled] = useState(getFullscreenEnabled);
    const [extraDiscountEnabled, setExtraDiscountEnabled] = useState(() => getExtraDiscountEnabled());
    const [changeCalculatorEnabled, setChangeCalculatorEnabledState] = useState(getChangeCalculatorEnabled());
    const [paymentMethodsEnabled, setPaymentMethodsEnabled] = useState(getPaymentMethodsEnabled());
    const [shouldPrintAfterPayment, setShouldPrintAfterPayment] = useState(false);
    const [notificationDuration, setNotificationDuration] = useState(() => getNotificationDuration());
    const [printers, setPrinters] = useState([]);
    const [defaultPrinter, setDefaultPrinter] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [lastAddedItemId, setLastAddedItemId] = useState(null);
    const searchBarRef = useRef(null);
    const [showLooseSaleDialog, setShowLooseSaleDialog] = useState(false);
    const [looseSaleEnabled, setLooseSaleEnabled] = useState(() => localStorage.getItem('posLooseSaleEnabled') !== 'false');
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

    const refreshSettings = useCallback(async () => {
        try {
            const res = await api.get('/api/settings');
            const sett = res.data.data;
            if (sett.posReceiptSettings) setReceiptSettings(sett.posReceiptSettings);
            if (sett.posPaymentSettings) setPaymentSettings(sett.posPaymentSettings);
            if (sett.posEnableExtraDiscount !== undefined) setExtraDiscountEnabled(sett.posEnableExtraDiscount);
            if (sett.posNotificationDuration !== undefined) setNotificationDuration(sett.posNotificationDuration);
            setShopMetadata({
                shopMobile: sett.shopMobile || '',
                shopMobile2: sett.shopMobile2 || '',
                shopAddress: sett.shopAddress || '',
                shopEmail: sett.shopEmail || '',
                shopGST: sett.shopGST || '',
                shopLogo: sett.shopLogo || ''
            });
        } catch (error) {
            console.error('Failed to refresh POS settings:', error);
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

    // ===== All Functions Declared BEFORE useEffect =====

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products', {
                params: { includeBatches: true }
            });
            setProducts(res.data.data);
        } catch (err) {
            console.error("Error fetching products:", err);
            setNotification({
                open: true,
                message: `Unable to connect to POS server. ${err.message}`,
                severity: 'error',
                duration: 5000
            });
        }
    };

    const persistReceiptSettings = (nextSettings) => {
        try {
            localStorage.setItem(STORAGE_KEYS.receipt, JSON.stringify(nextSettings));
            window.dispatchEvent(new Event('pos-settings-updated'));
        } catch {
            console.error('Failed to persist receipt settings');
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
    };

    const handleCloseTab = (tabId) => {
        if (tabs.length === 1) {
            // If only one tab, just clear it
            updateTab(tabId, { cart: [], discount: 0 });
            return;
        }

        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        if (activeTabId === tabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
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
                promoPrice: product.promoPrice
            }];
        });

        setLastAddedItemId(batch.id);

        // Clear search and close dialog immediately
        setSearchQuery('');
        setScannedProduct(null);
        searchBarRef.current?.focus();
    };

    const removeFromCart = (batchId) => {
        setCart(prev => prev.filter(item => item.batch_id !== batchId));
    };

    const updateQuantity = (batchId, change) => {
        setCart(prev => prev.map(item => {
            if (item.batch_id === batchId) {
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
            if (batches.length === 1 || isBarcodeScanned) {
                // Auto-add first batch if barcode scanned or only one batch available
                addToCart(product, batches[0]);
            } else {
                setScannedProduct({ product, batches, mode: 'price' });
            }
            return;
        }

        if (batches.length === 1 || isBarcodeScanned) {
            // Auto-add first batch if barcode scanned or only one batch available
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
        searchBarRef.current?.focus();
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
        if (!selectedPaymentMethod) {
            showError('Please select a payment method');
            return;
        }

        try {
            const items = cart.map(item => ({ batch_id: item.batch_id, quantity: item.quantity }));
            const res = await api.post('/api/sale', {
                items,
                discount: 0,
                extraDiscount: discount,
                paymentMethod: selectedPaymentMethod.label || 'Cash',
                paymentDetails: JSON.stringify({ method: selectedPaymentMethod })
            });
            const detailedRes = await api.get(`/api/sale/${res.data.saleId}`);
            setLastSale(detailedRes.data);

            handleCloseTab(activeTabId);
            fetchProducts();
            setSelectedPaymentMethod(null);

            // Show success notification
            showNotification('Sale Completed Successfully!');
            searchBarRef.current?.focus();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.message || 'Payment failed';
            showError(`Payment failed: ${msg}`);
        }
    };

    const handlePayAndPrint = async () => {
        if (!selectedPaymentMethod) {
            showError('Please select a payment method');
            return;
        }

        try {
            const items = cart.map(item => ({ batch_id: item.batch_id, quantity: item.quantity }));
            const res = await api.post('/api/sale', {
                items,
                discount: 0,
                extraDiscount: discount,
                paymentMethod: selectedPaymentMethod.label || 'Cash',
                paymentDetails: JSON.stringify({ method: selectedPaymentMethod })
            });
            const detailedRes = await api.get(`/api/sale/${res.data.saleId}`);
            setLastSale(detailedRes.data);

            handleCloseTab(activeTabId);
            fetchProducts();
            setSelectedPaymentMethod(null);

            // Handle Printing
            if (receiptSettings.directPrint) {
                // Short timeout to ensure the DOM is updated for the hidden print container
                setTimeout(() => {
                    const printer = defaultPrinter || (printers.find(p => p.isDefault) || printers[0])?.name;
                    if (window.electron) {
                        window.electron.ipcRenderer.send('print-manual', { printerName: printer });
                    } else {
                        window.print();
                    }
                }, 500);
            } else {
                setShowReceipt(true);
            }
            searchBarRef.current?.focus();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.message || 'Payment failed';
            showError(`Payment failed: ${msg}`);
        }
    };

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
                setTimeout(() => {
                    const printer = defaultPrinter || (printers.find(p => p.isDefault) || printers[0])?.name;
                    if (window.electron) {
                        window.electron.ipcRenderer.send('print-manual', { printerName: printer });
                    } else {
                        window.print();
                    }
                }, 500);
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

    // Fetch printers on mount
    useEffect(() => {
        const fetchPrinters = async () => {
            if (window.electron) {
                try {
                    const printerList = await window.electron.ipcRenderer.invoke('get-printers');
                    setPrinters(printerList || []);
                    const def = printerList?.find(p => p.isDefault);
                    if (def) setDefaultPrinter(def.name);
                } catch (err) {
                    console.error('Failed to fetch printers:', err);
                }
            }
        };
        fetchPrinters();
    }, []);

    const subTotal = (cart || []).reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
    const totalMrp = (cart || []).reduce((sum, item) => sum + ((item?.mrp || 0) * (item?.quantity || 0)), 0);
    const totalQty = (cart || []).reduce((sum, item) => sum + (item?.quantity || 0), 0);
    const baseTotalAmount = Math.max(0, subTotal - discount);
    const totalAmount = receiptSettings.roundOff ? Math.round(baseTotalAmount) : baseTotalAmount;
    const totalSavings = totalMrp - totalAmount;

    const filterOptions = (options, { inputValue }) => {
        const normalizedInput = inputValue.trim().toLowerCase();
        if (!normalizedInput) return [];

        return options.filter((option) => {
            if (!option) return false;
            const nameValue = option.name ? String(option.name).toLowerCase() : '';
            const barcodeValue = option.barcode ? String(option.barcode).toLowerCase() : '';
            const nameMatch = nameValue.includes(normalizedInput);
            const barcodeMatch = barcodeValue.includes(normalizedInput);
            const priceMatch = (option.batches || []).some((batch) =>
                batch && String(batch.sellingPrice || '').includes(normalizedInput)
            );
            return nameMatch || barcodeMatch || priceMatch;
        });
    };

    // Global focus protection
    useEffect(() => {
        const handleGlobalMouseDown = (e) => {
            // Give a tiny timeout to see if focus actually moves to another input
            setTimeout(() => {
                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.isContentEditable;

                // If focus isn't on an input/editable and searchBar exists, refocus it
                if (!isInput && searchBarRef.current) {
                    searchBarRef.current.focus();
                }
            }, 50);
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
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', lg: 'row' },
                    gap: 0,
                    px: { xs: 2, md: 3 },
                    py: { xs: 2, md: 3 },
                    height: 'calc(100vh - 72px)',
                    overflow: 'hidden',
                    position: 'relative',
                    userSelect: 'none', // Prevent text selection stealing focus
                    '& input, & textarea': { userSelect: 'auto' } // Re-enable for inputs
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
                    onClose={() => setManualQuantityItem(null)}
                    onConfirm={(qty) => handleSetQuantity(manualQuantityItem.batch_id, qty)}
                    itemName={manualQuantityItem?.name}
                    initialValue={manualQuantityItem?.quantity || 1}
                />

                <LooseSaleDialog
                    open={showLooseSaleDialog}
                    onClose={() => {
                        setShowLooseSaleDialog(false);
                        searchBarRef.current?.focus();
                    }}
                    onComplete={() => {
                        setNotification({ open: true, message: 'Loose Sale Recorded Successfully!', severity: 'success' });
                        searchBarRef.current?.focus();
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
            <Box sx={{ display: 'none', displayPrint: 'block' }}>
                <div id="thermal-receipt-print">
                    {lastSale && <Receipt sale={lastSale} settings={receiptSettings} />}
                </div>
            </Box>
        </>
    );
};

export default POS;
