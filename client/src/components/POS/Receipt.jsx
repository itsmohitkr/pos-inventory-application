import React from 'react';
import { Box, Typography, Divider, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const Receipt = ({ sale, settings }) => {
    if (!sale) return null;

    // Default settings if none provided
    const config = settings || {
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
        customShopName: 'RESOFT POS',
        customHeader: '123 Business Street, City',
        customFooter: 'Thank You! Visit Again'
    };

    return (
        <Box id="receipt-content" sx={{
            width: '80mm',
            padding: '5mm',
            bgcolor: 'white',
            color: 'black',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '0.75rem',
            lineHeight: 1.2,
            '@media print': {
                width: '80mm',
                margin: 0,
                padding: '2mm',
            }
        }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
                {config.shopName && <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{config.customShopName}</Typography>}
                {config.header && <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{config.customHeader}</Typography>}
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>Tel: +91 98765 43210</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>---------------------------</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>TAX INVOICE</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>---------------------------</Typography>
            </Box>

            {/* Sale Info */}
            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Bill No: ORD-{sale.id}</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Date  : {new Date(sale.createdAt).toLocaleDateString()}</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Time  : {new Date(sale.createdAt).toLocaleTimeString()}</Typography>
            </Box>

            <Typography variant="body2">---------------------------</Typography>

            {/* Items Table */}
            <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px dashed black' }}>
                        {config.productName && <th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th>}
                        <th style={{ textAlign: 'center', padding: '2px 0' }}>Qty</th>
                        {config.price && <th style={{ textAlign: 'right', padding: '2px 0' }}>Price</th>}
                        <th style={{ textAlign: 'right', padding: '2px 0' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, idx) => {
                        const mrp = item.mrp || item.sellingPrice;
                        return (
                        <tr key={idx}>
                            {config.productName && (
                                <td style={{ padding: '4px 0', verticalAlign: 'top' }}>
                                    <div style={{ fontWeight: 'bold' }}>{item.productName || item.batch?.product?.name}</div>
                                    {config.barcode && (
                                        <div style={{ fontSize: '0.6rem', color: '#666' }}>BC: {item.batch?.product?.barcode}</div>
                                    )}
                                    {config.exp && item.batch?.expiryDate && (
                                        <div style={{ fontSize: '0.6rem', color: '#000' }}>
                                            EXP: {new Date(item.batch.expiryDate).toLocaleDateString()}
                                        </div>
                                    )}
                                    {config.mrp && (
                                        <div style={{ fontSize: '0.6rem' }}>MRP: ₹{mrp.toFixed(2)}</div>
                                    )}
                                </td>
                            )}
                            <td style={{ padding: '4px 0', textAlign: 'center', verticalAlign: 'top' }}>
                                {item.quantity}
                            </td>
                            {config.price && (
                                <td style={{ padding: '4px 0', textAlign: 'right', verticalAlign: 'top' }}>
                                    {item.sellingPrice.toFixed(2)}
                                </td>
                            )}
                            <td style={{ padding: '4px 0', textAlign: 'right', verticalAlign: 'top' }}>
                                {(item.quantity * item.sellingPrice).toFixed(2)}
                            </td>
                        </tr>
                    );
                    })}
                </tbody>
            </table>

            <Typography variant="body2">---------------------------</Typography>

            {/* Totals */}
            <Box sx={{ ml: 'auto', width: '80%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>₹{(sale.totalAmount + sale.discount + (sale.extraDiscount || 0)).toFixed(2)}</Typography>
                </Box>
                {config.discount && sale.discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>MRP Discount:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>-₹{sale.discount.toFixed(2)}</Typography>
                    </Box>
                )}
                {config.discount && (sale.extraDiscount || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Extra Discount:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>-₹{(sale.extraDiscount || 0).toFixed(2)}</Typography>
                    </Box>
                )}
                {config.totalValue && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>GRAND TOTAL:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>₹{sale.totalAmount.toFixed(2)}</Typography>
                    </Box>
                )}
                {config.totalSavings && (
                    <Box sx={{
                        mt: 1,
                        p: 0.5,
                        border: '1px dashed black',
                        textAlign: 'center',
                        bgcolor: '#f0f0f0'
                    }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                            TOTAL SAVINGS: ₹{(
                                sale.items.reduce((acc, item) => {
                                    const mrp = item.mrp || item.sellingPrice;
                                    return acc + ((mrp - item.sellingPrice) * item.quantity);
                                }, 0) +
                                sale.discount +
                                (sale.extraDiscount || 0)
                            ).toFixed(2)}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Typography variant="body2" sx={{ mt: 1 }}>---------------------------</Typography>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 1 }}>
                {config.footer && <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{config.customFooter}</Typography>}
                <Box sx={{ mt: 1, borderTop: '1px dashed black', pt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Software by Resoft</Typography>
                </Box>
            </Box>

            {/* Print styles to hide non-receipt elements */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
        </Box>
    );
};
export default Receipt;
