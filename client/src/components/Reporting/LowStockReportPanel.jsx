import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, FormControl, InputLabel, Select, MenuItem, Checkbox
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';
import useSortableTable from '../../hooks/useSortableTable';
import SortableTableHead from './SortableTableHead';

const LowStockReportPanel = ({ data, loading }) => {
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [selectedItems, setSelectedItems] = useState([]);

    const categories = useMemo(() => {
        if (!data) return [];
        const uniqueCategories = new Set(data.map(p => p.category).filter(Boolean));
        return ["All Categories", ...Array.from(uniqueCategories).sort()];
    }, [data]);

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (selectedCategory === "All Categories") return data;
        return data.filter(p => p.category === selectedCategory);
    }, [data, selectedCategory]);

    const handleToggleSelect = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedItems(filteredData.map(item => item.id));
        } else {
            setSelectedItems([]);
        }
    };

    const { items: sortedData, requestSort, sortConfig } = useSortableTable(filteredData, { key: 'totalQuantity', direction: 'asc' });

    const handleExportPDF = () => {
        const itemsToExport = selectedItems.length > 0
            ? filteredData.filter(item => selectedItems.includes(item.id))
            : filteredData;

        if (itemsToExport.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Vendor Order List (Low Stock)', 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Category: ${selectedCategory}`, 14, 28);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

        const tableColumn = ["S.No", "Product Name", "Category", "MRP (₹)", "Current Stock"];
        const tableRows = itemsToExport.map((item, index) => [
            (index + 1).toString(),
            item.name,
            item.category || 'Uncategorized',
            item.mrp?.toFixed(2) || '0.00',
            item.totalQuantity.toString()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [25, 118, 210] }
        });

        doc.save(`vendor_order_${selectedCategory.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const handlePrint = () => {
        if (selectedItems.length > 0) {
            // Note: Native window.print prints the whole screen. For a selected subset, exporting PDF is the ideal path.
            // But we'll trigger PDF export for print layout consistency if they clicked "Print Selected"
            handleExportPDF();
        } else {
            window.print();
        }
    };

    if (loading) {
        return (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">Loading low stock data...</Typography>
            </Box>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', p: 4, alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" color="text.secondary">No products are currently low on stock.</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box className="report-print-area" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <Box className="no-print" sx={{ p: 3, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Low Stock Report
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Products below threshold
                            </Typography>
                        </Box>

                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Filter Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                label="Filter Category"
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                sx={{ borderRadius: 2, fontWeight: 600 }}
                            >
                                {categories.map(cat => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <ExportOptions
                            onExportPDF={handleExportPDF}
                            onPrint={handlePrint}
                            selectedCount={selectedItems.length}
                        />
                    </Box>
                </Box>

                <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                    <Table stickyHeader sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc' }}>
                                    <Checkbox
                                        indeterminate={selectedItems.length > 0 && selectedItems.length < filteredData.length}
                                        checked={filteredData.length > 0 && selectedItems.length === filteredData.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>S.NO</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>PRODUCT</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>CATEGORY</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }} align="right">MRP (₹)</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }} align="center">STOCK</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }} align="center">STATUS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedData.map((item, index) => {
                                const isItemSelected = selectedItems.includes(item.id);
                                return (
                                    <TableRow
                                        key={item.id}
                                        hover
                                        selected={isItemSelected}
                                        onClick={() => handleToggleSelect(item.id)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={isItemSelected} />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                                        <TableCell><Chip label={item.category || 'Uncategorized'} size="small" variant="outlined" /></TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>₹{item.mrp?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell align="center">
                                            <Typography sx={{ fontWeight: 700, color: item.totalQuantity === 0 ? '#d32f2f' : '#ed6c02' }}>
                                                {item.totalQuantity}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={item.totalQuantity === 0 ? "Out of Stock" : "Low Stock"}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700,
                                                    bgcolor: item.totalQuantity === 0 ? '#ffebee' : '#fff3e0',
                                                    color: item.totalQuantity === 0 ? '#d32f2f' : '#e65100'
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default LowStockReportPanel;
