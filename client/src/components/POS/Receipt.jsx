import React from 'react';
import { Box, Typography } from '@mui/material';

const Receipt = ({ sale, settings, shopMetadata }) => {
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
        totalSavings: true,
        customShopName: 'RESOFT POS',
        customHeader: '123 Business Street, City',
        customFooter: 'Thank You! Visit Again',
        paperSize: '80mm',
        fontSize: 0.8,
        itemFontSize: 0.8,
        lineHeight: 1.1,
        invoiceLabel: 'Tax Invoice',
        showBranding: false,
        titleAlign: 'center',
        headerAlign: 'center',
        footerAlign: 'center'
    };

    const width = config.paperSize || '80mm';
    const marginTop = config.marginTop !== undefined ? `${config.marginTop}mm` : '2mm';
    const marginBottom = config.marginBottom !== undefined ? `${config.marginBottom}mm` : '2mm';
    const marginSide = config.marginSide !== undefined ? `${config.marginSide}mm` : '4mm';

    // Rounding logic
    const originalTotal = sale.totalAmount;
    const roundedTotal = config.roundOff ? Math.round(originalTotal) : originalTotal;
    const roundOff = roundedTotal - originalTotal;

    // Savings calculation
    const totalMrp = sale.items?.reduce((sum, item) => {
        const itemMrp = item.mrp || item.batch?.mrp || item.sellingPrice || 0;
        return sum + (itemMrp * item.quantity);
    }, 0) || 0;

    // Total savings is MRP - originalTotal
    const calculatedSavings = totalMrp - originalTotal;

    // Formatting themes
    const themes = {
        Standard: {
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            divider: '2px solid black',
            itemDivider: '0.5px solid #eee',
            headerWeight: 900,
            textWeight: 600,
            boldWeight: 800
        },
        Modern: {
            fontFamily: 'Outfit, Inter, sans-serif',
            divider: '1px solid black',
            itemDivider: 'none',
            headerWeight: 800,
            textWeight: 500,
            boldWeight: 700
        },
        Classic: {
            fontFamily: '"Courier New", Courier, monospace',
            divider: '1px dashed black',
            itemDivider: '1px dashed #ccc',
            headerWeight: 700,
            textWeight: 400,
            boldWeight: 700
        },
        Minimalist: {
            fontFamily: 'Inter, sans-serif',
            divider: '1px solid black',
            itemDivider: 'none',
            headerWeight: 900,
            textWeight: 400,
            boldWeight: 700
        }
    };

    const theme = themes[config.billFormat] || themes.Standard;

    return (
        <Box id="receipt-content" sx={{
            width: width,
            boxSizing: 'border-box',
            paddingTop: marginTop,
            paddingBottom: marginBottom,
            paddingLeft: marginSide,
            paddingRight: marginSide,
            bgcolor: 'white',
            color: '#000000',
            fontFamily: theme.fontFamily,
            fontSize: `${config.fontSize || 0.8}rem`,
            lineHeight: config.lineHeight || 1.1,
            '@media print': {
                width: '100%',
                maxWidth: width,
                margin: 0,
                boxSizing: 'border-box',
                '-webkit-print-color-adjust': 'exact',
                'print-color-adjust': 'exact',
            }
        }}>
            {/* Header */}
            {config.billFormat !== 'Minimalist' && (
                <Box sx={{ mb: 0.3 }}>
                    {config.shopName && (
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: theme.headerWeight,
                                fontSize: '1.25em',
                                color: '#000',
                                letterSpacing: '-0.02em',
                                mb: 0.2,
                                textAlign: config.titleAlign || 'center'
                            }}
                        >
                            {config.customShopName}
                        </Typography>
                    )}
                    {(config.header || config.customHeader) && (
                        <Box sx={{ textAlign: config.headerAlign || 'center' }}>
                            <Typography
                                variant="body2"
                                sx={{ fontSize: '0.9em', fontWeight: theme.textWeight, color: '#000', mb: 0.1 }}
                            >
                                {config.customHeader}
                            </Typography>
                            {config.customHeader2 && (
                                <Typography
                                    variant="body2"
                                    sx={{ fontSize: '0.9em', fontWeight: theme.textWeight, color: '#000', mb: 0.1 }}
                                >
                                    {config.customHeader2}
                                </Typography>
                            )}
                            {config.customHeader3 && (
                                <Typography
                                    variant="body2"
                                    sx={{ fontSize: '0.9em', fontWeight: theme.textWeight, color: '#000', mb: 0.1 }}
                                >
                                    {config.customHeader3}
                                </Typography>
                            )}
                            {shopMetadata?.shopMobile && (
                                <Typography variant="body2" sx={{ fontSize: '0.85em', fontWeight: theme.textWeight, color: '#000' }}>
                                    Tel: {shopMetadata.shopMobile}
                                </Typography>
                            )}
                            {shopMetadata?.shopMobile2 && (
                                <Typography variant="body2" sx={{ fontSize: '0.85em', fontWeight: theme.textWeight, color: '#000' }}>
                                    Tel 2: {shopMetadata.shopMobile2}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Box sx={{ borderBottom: theme.divider, my: 0.5 }} />
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: theme.headerWeight,
                            fontSize: '1em',
                            color: '#000',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            textAlign: 'center'
                        }}
                    >
                        {config.invoiceLabel || 'Tax Invoice'}
                    </Typography>
                    <Box sx={{ borderBottom: theme.divider, mt: 0.5, mb: 0.8 }} />
                </Box>
            )}

            {/* Sale Info */}
            <Box sx={{ mb: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.85em', fontWeight: theme.boldWeight, color: '#000' }}>Bill No: ORD-{sale.id}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85em', color: '#000' }}>{new Date(sale.createdAt).toLocaleDateString()}</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontSize: '0.85em', color: '#000' }}>Time: {new Date(sale.createdAt).toLocaleTimeString()}</Typography>
            </Box>

            <Box sx={{ borderBottom: config.billFormat === 'Minimalist' ? theme.divider : '1px solid black', mb: 0.5 }} />

            {/* Items Table */}
            <table style={{ width: '100%', fontSize: `${config.itemFontSize || 0.8}rem`, borderCollapse: 'collapse', color: '#000' }}>
                <thead>
                    <tr style={{ borderBottom: theme.divider }}>
                        {config.productName && <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: theme.headerWeight }}>Item</th>}
                        <th style={{ textAlign: 'center', padding: '2px 0', fontWeight: theme.headerWeight }}>Qty</th>
                        {config.price && <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: theme.headerWeight }}>Price</th>}
                        <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: theme.headerWeight }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, idx) => {
                        const mrp = item.mrp || item.sellingPrice;
                        return (
                            <tr key={idx} style={{ borderBottom: theme.itemDivider }}>
                                {config.productName && (
                                    <td style={{ padding: '6px 0', verticalAlign: 'top', maxWidth: '120px' }}>
                                        <div style={{
                                            fontWeight: theme.boldWeight,
                                            fontSize: '1em',
                                            lineHeight: 1.2,
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'normal'
                                        }}>
                                            {item.productName || item.batch?.product?.name}
                                            {item.isWholesale && <span style={{ fontSize: '0.8em', marginLeft: '4px', color: '#000' }}>(WS)</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.85em', marginTop: '3px', fontWeight: theme.textWeight }}>
                                            {config.barcode && <span>BC: {item.batch?.product?.barcode}</span>}
                                            {config.exp && item.batch?.expiryDate && (
                                                <span>EXP: {new Date(item.batch.expiryDate).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                        {config.mrp && (
                                            <div style={{ fontSize: '0.85em', fontWeight: theme.boldWeight, marginTop: '2px' }}>
                                                MRP: ₹{mrp.toFixed(2)}
                                            </div>
                                        )}
                                    </td>
                                )}
                                <td style={{ padding: '6px 0', textAlign: 'center', verticalAlign: 'top', fontWeight: theme.boldWeight + 100 }}>
                                    {item.quantity}
                                </td>
                                {config.price && (
                                    <td style={{ padding: '6px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: theme.textWeight }}>
                                        {item.sellingPrice.toFixed(2)}
                                    </td>
                                )}
                                <td style={{ padding: '6px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: theme.boldWeight + 100 }}>
                                    {(item.quantity * item.sellingPrice).toFixed(2)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <Box sx={{ borderBottom: theme.divider, my: 0.5 }} />

            {/* Totals */}
            <Box sx={{ ml: 'auto', width: '100%', color: '#000' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                    <Typography variant="body2" sx={{ fontSize: '1em', fontWeight: theme.textWeight }}>Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '1em', fontWeight: theme.textWeight }}>₹{(sale.totalAmount + sale.discount + (sale.extraDiscount || 0)).toFixed(2)}</Typography>
                </Box>
                {(config.discount && (sale.discount > 0 || sale.extraDiscount > 0)) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.9em', fontWeight: theme.boldWeight }}>TOTAL DISCOUNT:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.9em', fontWeight: theme.boldWeight }}>-₹{(sale.discount + (sale.extraDiscount || 0)).toFixed(2)}</Typography>
                    </Box>
                )}

                {config.roundOff && roundOff !== 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.9em', fontStyle: 'italic' }}>Round Off:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.9em' }}>{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</Typography>
                    </Box>
                )}

                <Box sx={{ borderBottom: '1.5px solid black', my: 0.5 }} />
                {config.totalValue && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.3 }}>
                        <Typography variant="body2" sx={{ fontWeight: theme.headerWeight, fontSize: '1.1em' }}>GRAND TOTAL:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: theme.headerWeight, fontSize: '1.25em' }}>₹{roundedTotal.toFixed(2)}</Typography>
                    </Box>
                )}
                {config.totalSavings && (calculatedSavings > 0) && (
                    <Box sx={{ border: '2px solid black', p: 0.8, mt: 1, textAlign: 'center', color: '#000', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900, fontSize: '1em', letterSpacing: '0.05em' }}>
                            TOTAL SAVINGS: ₹{(calculatedSavings - (config.roundOff ? roundOff : 0)).toFixed(2)}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{ borderBottom: theme.divider, my: 0.8 }} />

            {/* Footer */}
            <Box sx={{ textAlign: config.footerAlign || 'center', mt: 0.3 }}>
                {config.footer && (
                    <>
                        <Typography variant="body2" sx={{ fontWeight: theme.boldWeight, fontSize: '1em', color: '#000', mb: 0.2 }}>
                            {config.customFooter}
                        </Typography>
                        {config.customFooter2 && (
                            <Typography variant="body2" sx={{ fontWeight: theme.boldWeight, fontSize: '0.9em', color: '#000', mb: 0.2 }}>
                                {config.customFooter2}
                            </Typography>
                        )}
                    </>
                )}
                {config.showBranding && (
                    <Typography variant="caption" sx={{ fontSize: '0.85em', fontWeight: theme.boldWeight, color: '#000', display: 'block', mt: 1, opacity: 0.7 }}>
                        Software by Resoft
                    </Typography>
                )}
            </Box>

            <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                    margin: 0;
                  }
                  #receipt-content, #receipt-content * {
                    visibility: visible;
                  }
                  #receipt-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: ${width};
                    box-sizing: border-box;
                    padding: ${marginTop} ${marginSide} ${marginBottom} ${marginSide};
                  }
                  @page {
                    size: ${width} auto;
                    margin: 0;
                  }
                }
            `}</style>
        </Box>
    );
};

export default Receipt;
