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
    Typography
} from '@mui/material';

import POSSearchBar from './POSSearchBar';
import CartTable from './CartTable';
import TransactionPanel from './TransactionPanel';
import BatchSelectionDialog from './BatchSelectionDialog';
import ReceiptPreviewDialog from './ReceiptPreviewDialog';
import POSTabs from './POSTabs';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

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
            ...stored,
            customShopName: stored?.customShopName || shopName
        };
    } catch (error) {
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

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const cart = activeTab.cart;
    const discount = activeTab.discount;

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
        };

        window.addEventListener('pos-settings-updated', handleSettingsUpdated);
        return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products', {
                params: { includeBatches: true }
            });
            setProducts(res.data.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const persistReceiptSettings = (nextSettings) => {
        try {
            localStorage.setItem(STORAGE_KEYS.receipt, JSON.stringify(nextSettings));
            window.dispatchEvent(new Event('pos-settings-updated'));
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

    const updateTab = (tabId, updates) => {
        setTabs(prev => prev.map(tab =>
            tab.id === tabId ? { ...tab, ...updates } : tab
        ));
    };

    // Cart Actions (Wrapper to update active tab)
    const setCart = (newCartOrFn) => {
        const newCart = typeof newCartOrFn === 'function' ? newCartOrFn(cart) : newCartOrFn;
        updateTab(activeTabId, { cart: newCart });
    };

    const setDiscount = (newDiscount) => {
        updateTab(activeTabId, { discount: newDiscount });
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

    const handleVoidOrder = async () => {
        const confirmed = await showConfirm('Are you sure you want to VOID this entire order?');
        if (confirmed) {
            updateTab(activeTabId, { cart: [], discount: 0 });
        }
    };

    const handleCheckout = async () => {
        try {
            const items = cart.map(item => ({ batch_id: item.batch_id, quantity: item.quantity }));
            const res = await axios.post('/api/sale', {
                items,
                discount: 0,
                extraDiscount: discount
            });
            const detailedRes = await axios.get(`/api/sale/${res.data.saleId}`);
            setLastSale(detailedRes.data);

            // Clear current order (or close  tab if logic dictates, here we clear for simplicity or replace)
            // Option: Close tab automatically after sale
            handleCloseTab(activeTabId);

            fetchProducts();
            setShowPrintDialog(true);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.message || 'Checkout failed';
            showError(`Checkout failed: ${msg}`);
        }
    };

    const handlePrintDecision = (shouldPrint) => {
        setShowPrintDialog(false);
        if (shouldPrint) {
            setShowReceipt(true);
        }
    };

    const handleRefund = () => {
        navigate('/refund');
    };

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
                    minHeight: 'calc(100vh - 72px)'
                }}
            >
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
                    onCheckout={handleCheckout}
                    onRefund={handleRefund}
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

                <Dialog
                    open={showPrintDialog}
                    onClose={() => handlePrintDecision(false)}
                    onKeyDown={(event) => {
                        if (event.defaultPrevented) return;
                        if (event.key !== 'Enter') return;
                        if (event.shiftKey) return;
                        if (event.target?.tagName === 'TEXTAREA') return;
                        event.preventDefault();
                        handlePrintDecision(true);
                    }}
                >
                    <DialogTitle>Payment Accepted</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1">
                            Payment of ₹{lastSale?.totalAmount?.toFixed(2) || '0.00'} has been successfully accepted.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Would you like to print the receipt?
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => handlePrintDecision(false)} variant="outlined">
                            No, Thanks
                        </Button>
                        <Button onClick={() => handlePrintDecision(true)} variant="contained" color="primary">
                            Yes, Print Receipt
                        </Button>
                    </DialogActions>
                </Dialog>

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
