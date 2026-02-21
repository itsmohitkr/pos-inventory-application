import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';

const LowStockReportPanel = ({ data, loading }) => {
    const [selectedCategory, setSelectedCategory] = useState("All Categories");

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

    const handleExportPDF = () => {
        if (filteredData.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Low Stock Report', 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Category: ${selectedCategory}`, 14, 28);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

        const tableColumn = ["Product Name", "Category", "Current Stock", "Threshold"];
        const tableRows = filteredData.map(item => [
            item.name,
            item.category || 'Uncategorized',
            item.totalQuantity.toString(),
            item.lowStockThreshold.toString()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [25, 118, 210] }
        });

        doc.save(`low_stock_report_${selectedCategory.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const handlePrint = () => {
        window.print();
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

                    <ExportOptions
                        onExportPDF={handleExportPDF}
                        onPrint={handlePrint}
                    />
                </Box>

                <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>PRODUCT</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>CATEGORY</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>CURRENT STOCK</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>THRESHOLD</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>STATUS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                                    <TableCell><Chip label={item.category || 'Uncategorized'} size="small" variant="outlined" /></TableCell>
                                    <TableCell align="center">
                                        <Typography sx={{ fontWeight: 700, color: item.totalQuantity === 0 ? '#d32f2f' : '#ed6c02' }}>
                                            {item.totalQuantity}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">{item.lowStockThreshold}</TableCell>
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
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default LowStockReportPanel;
