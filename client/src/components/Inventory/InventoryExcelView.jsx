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

const InventoryExcelView = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState('name');
    const [order, setOrder] = useState('asc');

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/products', {
                params: { includeBatches: 'true' }
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
        let filtered = flatData.filter(row =>
            row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.barcode.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const isDesc = order === 'desc';
            const valA = a[orderBy];
            const valB = b[orderBy];

            if (valA < valB) return isDesc ? 1 : -1;
            if (valA > valB) return isDesc ? -1 : 1;
            return 0;
        });
    }, [flatData, searchTerm, orderBy, order]);

    const totals = useMemo(() => {
        const count = filteredAndSortedData.length;
        if (count === 0) return {};

        return {
            totalStock: filteredAndSortedData.reduce((sum, row) => sum + row.stock, 0),
            avgSp: filteredAndSortedData.reduce((sum, row) => sum + row.sp, 0) / count,
            avgCp: filteredAndSortedData.reduce((sum, row) => sum + row.cp, 0) / count,
            avgDiscRs: filteredAndSortedData.reduce((sum, row) => sum + row.discRs, 0) / count,
            avgDiscPct: filteredAndSortedData.reduce((sum, row) => sum + row.discPct, 0) / count,
            avgMargin: filteredAndSortedData.reduce((sum, row) => sum + row.marginPct, 0) / count,
            avgWsPrice: filteredAndSortedData.reduce((sum, row) => sum + (row.wsPrice || 0), 0) / count,
            totalValueCost: filteredAndSortedData.reduce((sum, row) => sum + (row.stock * row.cp), 0),
            totalValueSelling: filteredAndSortedData.reduce((sum, row) => sum + (row.stock * row.sp), 0)
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
            <AppBar sx={{ position: 'relative', bgcolor: '#1a237e' }}>
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
                <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2, border: '1px solid #e0e0e0' }}>
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
                        <Chip label={`Total Rows: ${filteredAndSortedData.length}`} color="primary" variant="outlined" />
                        <Chip label={`Total Stock: ${totals.totalStock || 0}`} color="success" variant="outlined" />
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
