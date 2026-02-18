import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, Grid, TextField, Divider, Checkbox, Paper, Button,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Cancel as CancelIcon, Print as PrintIcon } from '@mui/icons-material';
import Receipt from './Receipt';

const ReceiptPreviewDialog = ({
    open,
    onClose,
    lastSale,
    receiptSettings,
    onSettingChange,
    onTextSettingChange,
    onSave,
    isAdmin = true,
    showPrint = true,
    showShopNameField = true,
    saveLabel = 'Save'
}) => {
    const handleKeyDown = (event) => {
        if (event.defaultPrevented) return;
        if (event.key !== 'Enter') return;
        if (event.shiftKey) return;
        if (event.target?.tagName === 'TEXTAREA') return;
        event.preventDefault();
        if (onSave) {
            onSave();
            return;
        }
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            onKeyDown={handleKeyDown}
        >
            <DialogTitle sx={{ borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Bill Preview & Settings
                <IconButton onClick={onClose} size="small">
                    <CancelIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <Grid container sx={{ height: '70vh' }}>
                    {/* Settings Sidebar - Admin Only */}
                    {isAdmin && (
                        <Grid item xs={12} sm={4} sx={{ borderRight: '1px solid #eee', p: 2, overflowY: 'auto', bgcolor: '#f8f9fa' }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Receipt Content Settings</Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {showShopNameField && (
                                    <TextField
                                        label="Shop Name"
                                        size="small"
                                        fullWidth
                                        value={receiptSettings.customShopName}
                                        onChange={(e) => onTextSettingChange('customShopName', e.target.value)}
                                        sx={{ mt: 1 }}
                                    />
                                )}
                                <TextField
                                    label="Header Info"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.customHeader}
                                    onChange={(e) => onTextSettingChange('customHeader', e.target.value)}
                                />
                                <TextField
                                    label="Footer Message"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.customFooter}
                                    onChange={(e) => onTextSettingChange('customFooter', e.target.value)}
                                />

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="caption" fontWeight="bold" color="primary">PRINTER SETTINGS</Typography>
                                <TextField
                                    label="Printer Type (e.g. Thermal)"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.printerType || ''}
                                    onChange={(e) => onTextSettingChange('printerType', e.target.value)}
                                />

                                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                                    <InputLabel>Paper Size</InputLabel>
                                    <Select
                                        value={receiptSettings.paperSize || '80mm'}
                                        label="Paper Size"
                                        onChange={(e) => onTextSettingChange('paperSize', e.target.value)}
                                    >
                                        <MenuItem value="80mm">80mm (3-inch)</MenuItem>
                                        <MenuItem value="58mm">58mm (2-inch)</MenuItem>
                                        <MenuItem value="72mm">72mm (Standard)</MenuItem>
                                    </Select>
                                </FormControl>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', p: 1, borderRadius: 1, color: 'white', mt: 1 }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Direct Print Mode</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Skip this preview dialog</Typography>
                                    </Box>
                                    <Checkbox
                                        size="small"
                                        checked={receiptSettings.directPrint}
                                        onChange={() => onSettingChange('directPrint')}
                                        sx={{ color: 'white', '&.Mui-checked': { color: '#f2b544' } }}
                                    />
                                </Box>

                                <Divider sx={{ my: 2 }} />
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">CONTENT VISIBILITY</Typography>

                                {['shopName', 'header', 'footer', 'productName', 'mrp', 'price', 'discount', 'totalValue', 'exp', 'barcode', 'totalSavings'].map(field => (
                                    <Box key={field} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                            Show {field.replace(/([A-Z])/g, ' $1')}
                                        </Typography>
                                        <Checkbox
                                            size="small"
                                            checked={receiptSettings[field]}
                                            onChange={() => onSettingChange(field)}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Grid>
                    )}

                    {/* Receipt Preview Area */}
                    <Grid item xs={12} sm={isAdmin ? 8 : 12} sx={{ p: 2, display: 'flex', justifyContent: 'center', bgcolor: '#525659', overflowY: 'auto' }}>
                        <Paper elevation={10} sx={{ height: 'fit-content' }}>
                            <Receipt sale={lastSale} settings={receiptSettings} />
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
                <Button variant="outlined" onClick={onClose}>Close</Button>
                {onSave && (
                    <Button variant="contained" color="primary" onClick={onSave}>
                        {saveLabel}
                    </Button>
                )}
                {showPrint && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                    >
                        Print Receipt
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptPreviewDialog;
