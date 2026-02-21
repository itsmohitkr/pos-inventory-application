import React, { useMemo } from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';

const ItemSalesReportPanel = ({ sales, loading, timeframeLabel }) => {

    // Aggregate data by product
    const aggregatedData = useMemo(() => {
        if (!sales) return [];

        const itemsMap = {};

        sales.forEach(sale => {
            sale.items.forEach(item => {
                const productId = item.batch?.product?.id || 'unknown';
                const productName = item.productName || 'Unknown Product';
                const category = item.batch?.product?.category || 'Uncategorized';

                if (!itemsMap[productId]) {
                    itemsMap[productId] = {
                        id: productId,
                        name: productName,
                        category: category,
                        quantity: 0,
                        revenue: 0,
                        profit: 0
                    };
                }

                itemsMap[productId].quantity += (item.netQuantity || 0);
                itemsMap[productId].revenue += (item.sellingPrice * (item.netQuantity || 0));
                itemsMap[productId].profit += (item.profit || 0);
            });
        });

        return Object.values(itemsMap).sort((a, b) => b.revenue - a.revenue);
    }, [sales]);

    const handleExportPDF = () => {
        if (aggregatedData.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Item-Wise Sales Report', 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

        const tableColumn = ["Product Name", "Category", "Quantity", "Revenue", "Profit", "Margin"];
        const tableRows = aggregatedData.map(item => [
            item.name,
            item.category,
            item.quantity.toString(),
            `Rs ${item.revenue.toFixed(2)}`,
            `Rs ${item.profit.toFixed(2)}`,
            `${item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(2) : '0.00'}%`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [25, 118, 210] }
        });

        doc.save(`item_sales_report_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">Loading item sales data...</Typography>
            </Box>
        );
    }

    if (aggregatedData.length === 0) {
        return (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', p: 4, alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" color="text.secondary">No sales data found for this period.</Typography>
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
                            Item-Wise Sales
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sales performance by product: {timeframeLabel}
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
                                <TableCell align="center" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>QTY SOLD</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>REVENUE</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>PROFIT</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', bgcolor: '#f8fafc' }}>MARGIN</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {aggregatedData.map((item) => {
                                const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                                return (
                                    <TableRow key={item.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                                        <TableCell><Chip label={item.category} size="small" variant="outlined" /></TableCell>
                                        <TableCell align="center">{item.quantity}</TableCell>
                                        <TableCell align="right">₹{item.revenue.toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 700 }}>₹{item.profit.toFixed(2)}</TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={`${margin.toFixed(1)}%`}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700,
                                                    bgcolor: margin > 20 ? '#dcfce7' : '#f0f9ff',
                                                    color: margin > 20 ? '#15803d' : '#0369a1'
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

export default ItemSalesReportPanel;
