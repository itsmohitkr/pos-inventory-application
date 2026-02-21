import React from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';

const LooseSalesReportPanel = ({ data, loading, timeframeLabel }) => {
    const handleExportPDF = () => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Loose Sales Report', 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

        const tableColumn = ["Date", "Item Name", "Price (₹)"];
        const tableRows = (data || []).map(item => [
            new Date(item.createdAt).toLocaleString(),
            item.itemName || 'Loose Item',
            item.price.toFixed(2)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [245, 158, 11] }
        });

        doc.save(`loose_sales_report_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">Loading loose sales data...</Typography>
            </Box>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', p: 4, alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" color="text.secondary">No loose sales found for this period.</Typography>
                </Paper>
            </Box>
        );
    }

    const totalRevenue = data.reduce((sum, item) => sum + item.price, 0);

    return (
        <Box className="report-print-area" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Summary Card */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Paper elevation={0} sx={{ p: 2, flex: 1, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fffbeb' }}>
                    <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 'bold' }}>TOTAL LOOSE REVENUE</Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#92400e' }}>₹{totalRevenue.toFixed(2)}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 2, flex: 1, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">TOTAL TRANSACTIONS</Typography>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">{data.length}</Typography>
                </Paper>
            </Box>

            <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <Box className="no-print" sx={{ p: 3, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Loose Sales History
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            One-time sales bypassed from regular inventory
                        </Typography>
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
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>DATE & TIME</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>ITEM NAME / NOTES</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>PRICE (₹)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{item.itemName || 'Loose Item'}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{item.price.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default LooseSalesReportPanel;
