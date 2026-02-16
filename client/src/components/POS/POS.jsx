import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import POSTabs from './POSTabs';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';
import { getStoredPaymentSettings, getFullscreenEnabled, STORAGE_KEYS as PAYMENT_STORAGE_KEYS } from '../../utils/paymentSettings';

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
    customFooter: 'Thank You! Visit Again'
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

const POS = () => {
    const navigate = useNavigate();
    const { dialogState, showError, showWarning, showConfirm, closeDialog } = useCustomDialog();
    const [products, setProducts] = useState([]);

    // Multi-tab state
    const [tabs, setTabs] = useState([
        { id: 1, name: 'Order 1', cart: [], discount: 0 }
    ]);
    const [activeTabId, setActiveTabId] = useState(1);

    const [scannedProduct, setScannedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSale, setLastSale] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [receiptSettings, setReceiptSettings] = useState(getStoredReceiptSettings);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [paymentSettings, setPaymentSettings] = useState(() => getStoredPaymentSettings());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenEnabled, setFullscreenEnabled] = useState(getFullscreenEnabled);
    const [shouldPrintAfterPayment, setShouldPrintAfterPayment] = useState(false);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const cart = activeTab.cart;
    const discount = activeTab.discount;

    // ===== All Functions Declared BEFORE useEffect =====

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products', {
                params: { includeBatches: true }
            });
            setProducts(res.data.data);
        } catch {
            console.error("Error fetching products");
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
            if (existing) {
                if (existing.quantity >= batch.quantity) {
                    showWarning(`Cannot add more. Only ${batch.quantity} in stock.`);
                    return prev;
                }
                return prev.map(item => item.batch_id === batch.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, {
                product_id: product.id,
                batch_id: batch.id,
                name: product.name,
                price: batch.sellingPrice,
                quantity: 1,
                batch_code: batch.batchCode,
                mrp: batch.mrp,
                max_quantity: batch.quantity
            }];
        });
        setScannedProduct(null);
        setSearchQuery('');
    };

    const removeFromCart = (batchId) => {
        setCart(prev => prev.filter(item => item.batch_id !== batchId));
    };

    const updateQuantity = (batchId, change) => {
        setCart(prev => prev.map(item => {
            if (item.batch_id === batchId) {
                const newQty = item.quantity + change;
                if (newQty > item.max_quantity) {
                    showWarning(`Stock limit reached! Max: ${item.max_quantity}`);
                    return item;
                }
                if (newQty < 1) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleProductInteraction = (product) => {
        const batches = product.batches?.filter(b => b.quantity > 0) || [];
        const isBatchTracked = product.batchTrackingEnabled !== false;

        if (batches.length === 0) {
            showError('Out of stock!');
            setSearchQuery('');
            return;
        }

        if (!isBatchTracked) {
            if (batches.length === 1) {
                addToCart(product, batches[0]);
            } else {
                setScannedProduct({ product, batches, mode: 'price' });
                setSearchQuery('');
            }
            return;
        }

        if (batches.length === 1) {
            addToCart(product, batches[0]);
        } else {
            setScannedProduct({ product, batches, mode: 'batch' });
            setSearchQuery('');
        }
    };

    const handleVoidOrder = async () => {
        const confirmed = await showConfirm('Are you sure you want to VOID this entire order?');
        if (confirmed) {
            updateTab(activeTabId, { cart: [], discount: 0 });
        }
    };

    const handleSelectPaymentMethod = (method) => {
        setSelectedPaymentMethod(method);
    };

    const handlePay = async () => {
        if (!selectedPaymentMethod) {
            showError('Please select a payment method');
            return;
        }

        try {
            const items = cart.map(item => ({ batch_id: item.batch_id, quantity: item.quantity }));
            const res = await axios.post('/api/sale', {
                items,
                discount: 0,
                extraDiscount: discount,
                paymentMethod: selectedPaymentMethod.label || 'Cash',
                paymentDetails: JSON.stringify({ method: selectedPaymentMethod })
            });
            const detailedRes = await axios.get(`/api/sale/${res.data.saleId}`);
            setLastSale(detailedRes.data);

            handleCloseTab(activeTabId);
            fetchProducts();
            setSelectedPaymentMethod(null);
            
            // Show confirmation message
            showConfirm('Payment completed successfully!').then(() => {
                // Reset
            });
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
            const res = await axios.post('/api/sale', {
                items,
                discount: 0,
                extraDiscount: discount,
                paymentMethod: selectedPaymentMethod.label || 'Cash',
                paymentDetails: JSON.stringify({ method: selectedPaymentMethod })
            });
            const detailedRes = await axios.get(`/api/sale/${res.data.saleId}`);
            setLastSale(detailedRes.data);

            handleCloseTab(activeTabId);
            fetchProducts();
            setSelectedPaymentMethod(null);
            
            // Show receipt for printing
            setShowReceipt(true);
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
        };

        window.addEventListener('pos-settings-updated', handleSettingsUpdated);
        return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
    }, []);

    const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalMrp = cart.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = Math.max(0, subTotal - discount);
    const totalSavings = totalMrp - totalAmount;

    const filterOptions = (options, { inputValue }) => {
        const normalizedInput = inputValue.trim().toLowerCase();
        if (!normalizedInput) return [];

        return options.filter((option) => {
            const nameValue = option.name ? option.name.toLowerCase() : '';
            const barcodeValue = option.barcode ? option.barcode.toLowerCase() : '';
            const nameMatch = nameValue.includes(normalizedInput);
            const barcodeMatch = barcodeValue.includes(normalizedInput);
            const priceMatch = (option.batches || []).some((batch) =>
                String(batch.sellingPrice).includes(normalizedInput)
            );
            return nameMatch || barcodeMatch || priceMatch;
        });
    };

    return (
        <>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(320px, 1fr)' },
                    gap: 2,
                    px: { xs: 2, md: 3 },
                    py: { xs: 2, md: 3 },
                    minHeight: 'calc(100vh - 72px)',
                    position: 'relative'
                }}
            >
                {/* Fullscreen Toggle Button - Bottom Left */}
                {fullscreenEnabled && (
                    <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                        <IconButton
                            onClick={handleFullscreenToggle}
                            size="large"
                            sx={{
                                position: 'fixed',
                                bottom: 20,
                                left: 20,
                                zIndex: 999,
                                bgcolor: '#1976d2',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                                border: 'none',
                                '&:hover': {
                                    bgcolor: '#1565c0',
                                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.5)'
                                },
                                transition: 'all 0.3s ease'
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
                <Paper elevation={0} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <POSTabs
                        tabs={tabs}
                        activeTabId={activeTabId}
                        onTabChange={setActiveTabId}
                        onTabClose={handleCloseTab}
                        onAddTab={handleAddTab}
                    />

                    <POSSearchBar
                        products={products}
                        searchQuery={searchQuery}
                        onSearchInputChange={setSearchQuery}
                        onSelectProduct={handleProductInteraction}
                        filterOptions={filterOptions}
                    />
                    <CartTable
                        cart={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemoveFromCart={removeFromCart}
                    />
                </Paper>

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
                    subTotal={subTotal}
                    totalMrp={totalMrp}
                    totalQty={totalQty}
                    totalAmount={totalAmount}
                    totalSavings={totalSavings}
                />

                <BatchSelectionDialog
                    scannedProduct={scannedProduct}
                    onSelectBatch={addToCart}
                    onClose={() => setScannedProduct(null)}
                />

                <ReceiptPreviewDialog
                    open={showReceipt}
                    onClose={() => setShowReceipt(false)}
                    lastSale={lastSale}
                    receiptSettings={receiptSettings}
                    onSettingChange={handleSettingChange}
                    onTextSettingChange={handleTextSettingChange}
                />
            </Box>
            <CustomDialog {...dialogState} onClose={closeDialog} />
        </>
    );
};

export default POS;
