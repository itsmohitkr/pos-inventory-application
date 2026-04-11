import React, { useState, useRef, useTransition } from 'react';
import {
    Box,
    Paper,
    Typography,
    Stack,
    Button,
    Container
} from '@mui/material';
import {
    FileUpload as UploadIcon,
    FileDownload as DownloadIcon,
    ViewList as ViewListIcon,
    LocalPrintshop as LocalPrintshopIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from '../shared/api/api';
import useCustomDialog from '../shared/hooks/useCustomDialog';
import AddProductForm from '../components/Inventory/AddProductForm';
import ProductList from '../components/Inventory/ProductList';
import BulkImportDialog from '../components/Inventory/BulkImportDialog';
import InventoryExcelView from '../components/Inventory/InventoryExcelView';
import BulkAddGrid from '../components/Inventory/BulkAddGrid';
import PriceListPanel from '../components/Inventory/PriceListPanel';

const InventoryPage = () => {
    const { showError } = useCustomDialog();
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const [showPriceList, setShowPriceList] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [excelViewOpen, setExcelViewOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [inventoryKey, setInventoryKey] = useState(0);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isPending, startTransition] = useTransition();
    const inventoryRef = useRef(null);

    const handleCategoryChange = (val) => {
        startTransition(() => {
            setCategoryFilter(val);
        });
    };

    const handleSearchChange = (val) => {
        startTransition(() => {
            setDebouncedSearch(val);
        });
    };

    const handleProductAdded = () => {
        setInventoryKey(prev => prev + 1);
        if (inventoryRef.current?.refresh) {
            inventoryRef.current.refresh();
        }
        setShowAddProduct(false);
        setShowBulkAdd(false);
    };

    const handleOpenPriceList = () => {
        setShowPriceList(true);
        setShowAddProduct(false);
        setShowBulkAdd(false);
    };

    const handleImportComplete = () => {
        setInventoryKey(prev => prev + 1);
        if (inventoryRef.current?.refresh) {
            inventoryRef.current.refresh();
        }
        setShowImport(false);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await api.get('/api/products/export', { responseType: 'blob' });
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            showError('Failed to export products');
        } finally {
            setExporting(false);
        }
    };

    return (
        <Box
            sx={{
                bgcolor: "background.default",
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    m: 3,
                    px: 4,
                    py: 2.5,
                    background: "linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)",
                    borderBottom: "1px solid rgba(16, 24, 40, 0.08)",
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}
            >
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom color="primary">
                        Inventory Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Browse products by category and manage stock efficiently.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<UploadIcon />}
                        onClick={() => setShowImport(true)}
                        sx={{ minWidth: 120 }}
                    >
                        Import CSV
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={exporting}
                        sx={{ minWidth: 120 }}
                    >
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<ViewListIcon />}
                        onClick={() => setExcelViewOpen(true)}
                        sx={{ minWidth: 160 }}
                    >
                        Spreadsheet View
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<LocalPrintshopIcon />}
                        onClick={handleOpenPriceList}
                        sx={{ minWidth: 130 }}
                    >
                        Price List
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setShowBulkAdd(true)}
                        sx={{ minWidth: 140 }}
                    >
                        Bulk Add
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddProduct(true)}
                        sx={{ minWidth: 140 }}
                    >
                        Add Product
                    </Button>
                </Stack>
            </Paper>

            <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0, px: 3, pb: 3 }}>
                {showBulkAdd ? (
                    <BulkAddGrid
                        onProductsAdded={handleProductAdded}
                        onCancel={() => setShowBulkAdd(false)}
                    />
                ) : showAddProduct ? (
                    <Container maxWidth="md" sx={{ height: '100%', overflowY: 'auto' }}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button
                                    size="small"
                                    startIcon={<ArrowBackIcon />}
                                    onClick={() => setShowAddProduct(false)}
                                >
                                    Back to Inventory
                                </Button>
                            </Box>
                            <AddProductForm onProductAdded={handleProductAdded} />
                        </Paper>
                    </Container>
                ) : (
                    <ProductList
                        key={inventoryKey}
                        ref={inventoryRef}
                        categoryFilter={categoryFilter}
                        onCategoryChange={handleCategoryChange}
                        debouncedSearch={debouncedSearch}
                        onSearchChange={handleSearchChange}
                        isPending={isPending}
                    />
                )}
            </Box>

            <BulkImportDialog
                open={showImport}
                onClose={() => setShowImport(false)}
                onImportComplete={handleImportComplete}
            />

            <InventoryExcelView
                open={excelViewOpen}
                onClose={() => setExcelViewOpen(false)}
                categoryFilter={categoryFilter}
                externalSearch={debouncedSearch}
            />

            <PriceListPanel
                open={showPriceList}
                onClose={() => setShowPriceList(false)}
            />
        </Box>
    );
};

export default InventoryPage;
