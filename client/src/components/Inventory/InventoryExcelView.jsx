import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, AppBar, Toolbar, IconButton, Typography, Button,
    Box, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, TextField, InputAdornment, TableSortLabel,
    Slide, Container, Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    Search as SearchIcon,
    FileDownload as DownloadIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import api from '../../api';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const InventoryExcelView = ({ open, onClose, categoryFilter = 'all', externalSearch = '' }) => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState('name');
    const [order, setOrder] = useState('asc');

    useEffect(() => {
        if (open) {
            setSearchTerm(externalSearch);
            fetchData();
        }
    }, [open, categoryFilter, externalSearch]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/products', {
                params: {
                    includeBatches: 'true',
                    category: categoryFilter,
                    search: externalSearch
                }
            });
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const flatData = useMemo(() => {
        const rows = [];
        products.forEach(product => {
            if (product.batches && product.batches.length > 0) {
                product.batches.forEach(batch => {
                    const discRs = batch.mrp - batch.sellingPrice;
                    const discPct = batch.mrp > 0 ? (discRs / batch.mrp) * 100 : 0;
                    const marginPct = batch.sellingPrice > 0 ? ((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100 : 0;

                    rows.push({
                        id: `${product.id}-${batch.id}`,
                        name: product.name,
                        batchCode: batch.batchCode || 'N/A',
                        category: product.category || 'Uncategorized',
                        mrp: batch.mrp,
                        sp: batch.sellingPrice,
                        cp: batch.costPrice,
                        discRs: discRs,
                        discPct: discPct,
                        marginPct: marginPct,
                        barcode: product.barcode || 'N/A',
                        expiry: batch.expiryDate,
                        wsPrice: batch.wholesalePrice,
                        wsMinQty: batch.wholesaleMinQty,
                        stock: batch.quantity
                    });
                });
            } else {
                // Product with no batches (unlikely in this system but for safety)
                rows.push({
                    id: `${product.id}-none`,
                    name: product.name,
                    batchCode: 'N/A',
                    category: product.category || 'Uncategorized',
                    mrp: 0,
                    sp: 0,
                    cp: 0,
                    discRs: 0,
                    discPct: 0,
                    marginPct: 0,
                    barcode: product.barcode || 'N/A',
                    expiry: null,
                    wsPrice: null,
                    wsMinQty: null,
                    stock: 0
                });
            }
        });
        return rows;
    }, [products]);

    const filteredAndSortedData = useMemo(() => {
        if (!searchTerm || !searchTerm.trim()) {
            return flatData.sort((a, b) => {
                const isDesc = order === 'desc';
                const valA = a[orderBy];
                const valB = b[orderBy];

                if (valA < valB) return isDesc ? 1 : -1;
                if (valA > valB) return isDesc ? -1 : 1;
                return 0;
            });
        }

        const query = searchTerm.toLowerCase().trim();

        const namePrefix = [];
        const barcodePrefix = [];
        const nameContains = [];
        const barcodeContains = [];

        for (const row of flatData) {
            const name = (row.name || '').toLowerCase();
            const barcodes = row.barcode && row.barcode !== 'N/A' ? row.barcode.toLowerCase().split('|').map(b => b.trim()) : [];

            if (name.startsWith(query)) {
                namePrefix.push(row);
            } else if (barcodes.some(b => b.startsWith(query))) {
                barcodePrefix.push(row);
            } else if (name.includes(query)) {
                nameContains.push(row);
            } else if (barcodes.some(b => b.includes(query))) {
                barcodeContains.push(row);
            }
        }

        const sortFn = (a, b) => {
            const isDesc = order === 'desc';
            const valA = a[orderBy];
            const valB = b[orderBy];

            if (valA < valB) return isDesc ? 1 : -1;
            if (valA > valB) return isDesc ? -1 : 1;
            return 0;
        };

        namePrefix.sort(sortFn);
        barcodePrefix.sort(sortFn);
        nameContains.sort(sortFn);
        barcodeContains.sort(sortFn);

        return [
            ...namePrefix,
            ...barcodePrefix,
            ...nameContains,
            ...barcodeContains
        ];
    }, [flatData, searchTerm, orderBy, order]);

    const totals = useMemo(() => {
        const totalStock = filteredAndSortedData.reduce((sum, row) => sum + row.stock, 0);
        const totalValueCost = filteredAndSortedData.reduce((sum, row) => sum + (row.stock * row.cp), 0);
        const totalValueSelling = filteredAndSortedData.reduce((sum, row) => sum + (row.stock * row.sp), 0);
        const totalValueMrp = filteredAndSortedData.reduce((sum, row) => sum + (row.stock * (row.mrp || row.sp)), 0);

        return {
            totalStock: totalStock,
            avgSp: totalStock > 0 ? totalValueSelling / totalStock : 0,
            avgCp: totalStock > 0 ? totalValueCost / totalStock : 0,
            avgDiscRs: totalStock > 0 ? (totalValueMrp - totalValueSelling) / totalStock : 0,
            avgDiscPct: totalValueMrp > 0 ? ((totalValueMrp - totalValueSelling) / totalValueMrp) * 100 : 0,
            avgMargin: totalValueSelling > 0 ? ((totalValueSelling - totalValueCost) / totalValueSelling) * 100 : 0,
            avgWsPrice: filteredAndSortedData.length > 0 ? filteredAndSortedData.reduce((sum, row) => sum + (row.wsPrice || 0), 0) / filteredAndSortedData.length : 0,
            totalValueCost: totalValueCost,
            totalValueSelling: totalValueSelling
        };
    }, [filteredAndSortedData]);

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleExportCSV = () => {
        const headers = ["Name", "Batch Code", "Category", "MRP", "SP", "CP", "Disc(Rs)", "Disc(%)", "Margin(%)", "Barcode", "Expiry", "WS Price", "WS Min Qty", "Stock"];
        const csvContent = [
            headers.join(','),
            ...filteredAndSortedData.map(row => [
                `"${row.name}"`,
                `"${row.batchCode}"`,
                `"${row.category}"`,
                row.mrp,
                row.sp,
                row.cp,
                row.discRs.toFixed(2),
                row.discPct.toFixed(2),
                row.marginPct.toFixed(2),
                `"${row.barcode}"`,
                row.expiry ? new Date(row.expiry).toLocaleDateString() : 'N/A',
                row.wsPrice || 0,
                row.wsMinQty || 0,
                row.stock
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={onClose}
            TransitionComponent={Transition}
        >
            <style>
                {`
                @media print {
                    @page {
                        size: auto;
                        margin: 10mm;
                    }
                    body {
                        visibility: hidden !important;
                        background: white !important;
                    }
                    .MuiDialog-root,
                    .MuiDialog-root * {
                        visibility: visible !important;
                    }
                    .no-print,
                    .MuiAppBar-root,
                    button,
                    .MuiInputAdornment-root {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    .MuiDialog-container,
                    .MuiDialog-paper {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        overflow: visible !important;
                        height: auto !important;
                        box-shadow: none !important;
                    }
                    .MuiContainer-root {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .MuiTableContainer-root {
                        max-height: none !important;
                        overflow: visible !important;
                        height: auto !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: auto !important;
                    }
                    th, td {
                        word-wrap: break-word !important;
                        white-space: normal !important;
                        font-size: 7.5pt !important;
                        padding: 3px !important;
                        border: 1px solid #000 !important;
                        color: black !important;
                    }
                    th {
                        background-color: #eee !important;
                        -webkit-print-color-adjust: exact;
                        font-weight: bold !important;
                    }
                    .MuiTableHead-root {
                        display: table-header-group !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                    }
                }
                `}
            </style>
            <AppBar className="no-print" sx={{ position: 'relative', bgcolor: '#1a237e' }}>
                <Toolbar variant="dense">
                    <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6" component="div">
                        Full Inventory Spreadsheet View
                    </Typography>
                    <Button
                        color="inherit"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                        sx={{ mr: 2 }}
                    >
                        Export CSV
                    </Button>
                    <Button
                        color="inherit"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                    >
                        Print
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ py: 3, bgcolor: '#f8f9fa', minHeight: 'calc(100vh - 48px)' }}>
                <Paper className="no-print" elevation={0} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <TextField
                        size="small"
                        placeholder="Search name, category or barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: 400 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip label={`Rows: ${filteredAndSortedData.length}`} color="primary" variant="outlined" />
                        <Chip label={`Total Stock: ${totals.totalStock || 0}`} color="success" variant="outlined" />
                        <Chip label={`Selling Value: ₹${(totals.totalValueSelling || 0).toLocaleString()}`} color="info" variant="outlined" />
                        <Chip label={`Cost Value: ₹${(totals.totalValueCost || 0).toLocaleString()}`} color="warning" variant="outlined" />
                    </Box>
                </Paper>

                <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', borderRadius: 2 }}>
                    <Table stickyHeader size="small" sx={{
                        minWidth: 1200,
                        '& .MuiTableRow-root:nth-of-type(odd)': {
                            bgcolor: 'rgba(0, 0, 0, 0.02)'
                        }
                    }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleSort('name')}>Name</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'batchCode'} direction={orderBy === 'batchCode' ? order : 'asc'} onClick={() => handleSort('batchCode')}>Batch Code</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'category'} direction={orderBy === 'category' ? order : 'asc'} onClick={() => handleSort('category')}>Category</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'mrp'} direction={orderBy === 'mrp' ? order : 'asc'} onClick={() => handleSort('mrp')}>MRP</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'sp'} direction={orderBy === 'sp' ? order : 'asc'} onClick={() => handleSort('sp')}>SP</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'cp'} direction={orderBy === 'cp' ? order : 'asc'} onClick={() => handleSort('cp')}>CP</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'discRs'} direction={orderBy === 'discRs' ? order : 'asc'} onClick={() => handleSort('discRs')}>Disc (₹)</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'discPct'} direction={orderBy === 'discPct' ? order : 'asc'} onClick={() => handleSort('discPct')}>Disc (%)</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'marginPct'} direction={orderBy === 'marginPct' ? order : 'asc'} onClick={() => handleSort('marginPct')}>Margin (%)</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'barcode'} direction={orderBy === 'barcode' ? order : 'asc'} onClick={() => handleSort('barcode')}>Barcode</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'expiry'} direction={orderBy === 'expiry' ? order : 'asc'} onClick={() => handleSort('expiry')}>Expiry</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'wsPrice'} direction={orderBy === 'wsPrice' ? order : 'asc'} onClick={() => handleSort('wsPrice')}>WS Price</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'wsMinQty'} direction={orderBy === 'wsMinQty' ? order : 'asc'} onClick={() => handleSort('wsMinQty')}>WS Min Qty</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    <TableSortLabel active={orderBy === 'stock'} direction={orderBy === 'stock' ? order : 'asc'} onClick={() => handleSort('stock')}>Stock</TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAndSortedData.map((row) => (
                                <TableRow hover key={row.id}>
                                    <TableCell sx={{ py: 0.5, fontWeight: 500 }}>{row.name}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{row.batchCode}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{row.category}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>₹{row.mrp.toFixed(2)}</TableCell>
                                    <TableCell sx={{ py: 0.5, color: 'primary.main', fontWeight: 600 }}>₹{row.sp.toFixed(2)}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>₹{row.cp.toFixed(2)}</TableCell>
                                    <TableCell sx={{ py: 0.5, color: 'error.main' }}>₹{row.discRs.toFixed(2)}</TableCell>
                                    <TableCell sx={{ py: 0.5, fontWeight: 700 }}>{row.discPct.toFixed(1)}%</TableCell>
                                    <TableCell sx={{ py: 0.5, fontWeight: 700, color: row.marginPct > 15 ? 'success.main' : 'warning.main' }}>
                                        {row.marginPct.toFixed(1)}%
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5, fontFamily: 'monospace' }}>{row.barcode}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{row.expiry ? new Date(row.expiry).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{row.wsPrice ? `₹${row.wsPrice.toFixed(2)}` : '—'}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{row.wsMinQty || '—'}</TableCell>
                                    <TableCell sx={{ py: 0.5, fontWeight: 700, bgcolor: row.stock <= 5 ? 'rgba(255,0,0,0.05)' : 'inherit' }}>
                                        {row.stock}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Summary Row */}
                            <TableRow sx={{
                                position: 'sticky',
                                bottom: 0,
                                zIndex: 1,
                                '& .MuiTableCell-root': {
                                    bgcolor: '#e1e3f1',
                                    borderTop: '2px solid #ccc'
                                }
                            }}>
                                <TableCell colSpan={3} sx={{ fontWeight: 800, py: 1.5 }}>TOTALS / AVERAGES</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}></TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>₹{totals.avgSp?.toFixed(2) || '0.00'}</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>₹{totals.avgCp?.toFixed(2) || '0.00'}</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>₹{totals.avgDiscRs?.toFixed(2) || '0.00'}</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>{totals.avgDiscPct?.toFixed(1) || '0.0'}%</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>{totals.avgMargin?.toFixed(1) || '0.0'}%</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}></TableCell>
                                <TableCell sx={{ fontWeight: 800 }}></TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>₹{totals.avgWsPrice?.toFixed(2) || '0.00'}</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}></TableCell>
                                <TableCell sx={{ fontWeight: 900, fontSize: '1rem', color: '#1a237e' }}>{totals.totalStock || 0}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Dialog>
    );
};

export default InventoryExcelView;
