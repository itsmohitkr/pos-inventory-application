import React from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';

const ExpiryReportPanel = ({ data, loading, timeframeLabel }) => {

    const handleExportPDF = () => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Expiring Products Report', 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

        const tableColumn = ["Product Name", "Category", "Batch Code", "Quantity", "Expiry Date"];
        const tableRows = [];

        data.forEach(batch => {
            const rowData = [
                batch.productName,
                batch.category,
                batch.batchCode || 'N/A',
                batch.quantity.toString(),
                new Date(batch.expiryDate).toLocaleDateString()
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [25, 118, 210] } // MUI Primary color
        });

        doc.save(`expiry_report_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">Loading expiry data...</Typography>
            </Box>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', p: 4, alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" color="text.secondary">No products expiring in this timeframe.</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box className="report-print-area" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <Box className="no-print" sx={{ p: 3, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Expiring Products
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Items reaching expiration in: {timeframeLabel}
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
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>PRODUCT</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>CATEGORY</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>BATCH</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>QNTY LEFT</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>EXPIRY DATE</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((batch) => {
                                const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                                const isCritical = daysUntilExpiry <= 7;

                                return (
                                    <TableRow key={batch.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{batch.productName}</TableCell>
                                        <TableCell><Chip label={batch.category} size="small" variant="outlined" /></TableCell>
                                        <TableCell>{batch.batchCode || '-'}</TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: batch.quantity <= 5 ? '#d32f2f' : 'inherit' }}>
                                                {batch.quantity}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: isCritical ? '#d32f2f' : 'inherit' }}>
                                                    {new Date(batch.expiryDate).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isCritical ? '#d32f2f' : 'text.secondary', fontWeight: isCritical ? 700 : 400 }}>
                                                    {daysUntilExpiry > 0 ? `in ${daysUntilExpiry} days` : 'Expired'}
                                                </Typography>
                                            </Box>
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

export default ExpiryReportPanel;
