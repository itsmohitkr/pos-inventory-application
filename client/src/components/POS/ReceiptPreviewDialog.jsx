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
    saveLabel = 'Save',
    shopMetadata,
    printers = [],
    defaultPrinter = null
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
                                    label="Invoice Title"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.invoiceLabel || 'Tax Invoice'}
                                    onChange={(e) => onTextSettingChange('invoiceLabel', e.target.value)}
                                    sx={{ mt: 1 }}
                                />
                                <TextField
                                    label="Header Line 1"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.customHeader}
                                    onChange={(e) => onTextSettingChange('customHeader', e.target.value)}
                                />
                                <TextField
                                    label="Header Line 2 (Optional)"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.customHeader2 || ''}
                                    onChange={(e) => onTextSettingChange('customHeader2', e.target.value)}
                                />
                                <TextField
                                    label="Header Line 3 (Optional)"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.customHeader3 || ''}
                                    onChange={(e) => onTextSettingChange('customHeader3', e.target.value)}
                                />
                                <TextField
                                    label="Footer Message 1"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.customFooter}
                                    onChange={(e) => onTextSettingChange('customFooter', e.target.value)}
                                />
                                <TextField
                                    label="Footer Message 2 (Optional)"
                                    size="small"
                                    fullWidth
                                    value={receiptSettings.customFooter2 || ''}
                                    onChange={(e) => onTextSettingChange('customFooter2', e.target.value)}
                                />

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="caption" fontWeight="bold" color="primary">LAYOUT & STYLING</Typography>

                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <TextField
                                        label="Global Font Size"
                                        size="small"
                                        type="number"
                                        fullWidth
                                        value={receiptSettings.fontSize || 0.8}
                                        onChange={(e) => onTextSettingChange('fontSize', parseFloat(e.target.value) || 0.8)}
                                        InputProps={{ inputProps: { min: 0.5, max: 2, step: 0.05 } }}
                                    />
                                    <TextField
                                        label="Item Font Size"
                                        size="small"
                                        type="number"
                                        fullWidth
                                        value={receiptSettings.itemFontSize || 0.8}
                                        onChange={(e) => onTextSettingChange('itemFontSize', parseFloat(e.target.value) || 0.8)}
                                        InputProps={{ inputProps: { min: 0.5, max: 2, step: 0.05 } }}
                                    />
                                </Box>

                                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                    {['Title', 'Header', 'Footer'].map(alignField => (
                                        <Grid item xs={4} key={alignField}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>{alignField}</InputLabel>
                                                <Select
                                                    value={receiptSettings[`${alignField.toLowerCase()}Align`] || 'center'}
                                                    label={alignField}
                                                    onChange={(e) => onTextSettingChange(`${alignField.toLowerCase()}Align`, e.target.value)}
                                                >
                                                    <MenuItem value="left">Left</MenuItem>
                                                    <MenuItem value="center">Center</MenuItem>
                                                    <MenuItem value="right">Right</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Box sx={{ mt: 1 }}>
                                    <TextField
                                        label="Line Height"
                                        size="small"
                                        type="number"
                                        fullWidth
                                        value={receiptSettings.lineHeight || 1.1}
                                        onChange={(e) => onTextSettingChange('lineHeight', parseFloat(e.target.value) || 1.1)}
                                        InputProps={{ inputProps: { min: 0.8, max: 2.0, step: 0.1 } }}
                                    />
                                </Box>

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="caption" fontWeight="bold" color="primary">PRINTER SETTINGS</Typography>
                                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                                    <InputLabel>Printer Selection</InputLabel>
                                    <Select
                                        value={receiptSettings.printerType || ''}
                                        label="Printer Selection"
                                        onChange={(e) => onTextSettingChange('printerType', e.target.value)}
                                        displayEmpty
                                    >
                                        <MenuItem value="" disabled>
                                            {printers && printers.length > 0 ? 'Select a printer...' : 'No printers found'}
                                        </MenuItem>
                                        {printers && printers.map((printer, index) => (
                                            <MenuItem key={index} value={printer.name}>
                                                {printer.name} {printer.isDefault ? '(Default)' : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

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

                                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                                    <InputLabel>Bill Format</InputLabel>
                                    <Select
                                        value={receiptSettings.billFormat || 'Standard'}
                                        label="Bill Format"
                                        onChange={(e) => onTextSettingChange('billFormat', e.target.value)}
                                    >
                                        <MenuItem value="Standard">Standard</MenuItem>
                                        <MenuItem value="Modern">Modern (Sans-Serif)</MenuItem>
                                        <MenuItem value="Classic">Classic (Courier)</MenuItem>
                                        <MenuItem value="Minimal">Minimalist</MenuItem>
                                    </Select>
                                </FormControl>

                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" fontWeight="bold">MARGINS (mm)</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                        <TextField
                                            label="Top"
                                            size="small"
                                            type="number"
                                            value={receiptSettings.marginTop ?? 0}
                                            onChange={(e) => onTextSettingChange('marginTop', parseInt(e.target.value) || 0)}
                                            InputProps={{ inputProps: { min: 0, max: 20 } }}
                                        />
                                        <TextField
                                            label="Bottom"
                                            size="small"
                                            type="number"
                                            value={receiptSettings.marginBottom ?? 0}
                                            onChange={(e) => onTextSettingChange('marginBottom', parseInt(e.target.value) || 0)}
                                            InputProps={{ inputProps: { min: 0, max: 20 } }}
                                        />
                                        <TextField
                                            label="Sides"
                                            size="small"
                                            type="number"
                                            value={receiptSettings.marginSide ?? 4}
                                            onChange={(e) => onTextSettingChange('marginSide', parseInt(e.target.value) || 0)}
                                            InputProps={{ inputProps: { min: 0, max: 20 } }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    bgcolor: 'primary.main',
                                    p: 1.5,
                                    borderRadius: 1,
                                    color: 'white',
                                    mt: 1,
                                    cursor: 'pointer'
                                }} onClick={() => onSettingChange('directPrint')}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">🚀 Direct Print</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Skip this dialog on Pay</Typography>
                                    </Box>
                                    <Checkbox
                                        size="small"
                                        checked={receiptSettings.directPrint}
                                        sx={{ color: 'white', '&.Mui-checked': { color: '#f2b544' } }}
                                    />
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    bgcolor: '#444',
                                    p: 1.5,
                                    borderRadius: 1,
                                    color: 'white',
                                    mt: 1,
                                    cursor: 'pointer'
                                }} onClick={() => onSettingChange('roundOff')}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">Automatic Round Off</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Round total to nearest ₹</Typography>
                                    </Box>
                                    <Checkbox
                                        size="small"
                                        checked={receiptSettings.roundOff}
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
                            <Receipt sale={lastSale} settings={receiptSettings} shopMetadata={shopMetadata} />
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
                        onClick={() => {
                            if (receiptSettings.directPrint && window.electron) {
                                // Use the specifically selected printerType, fallback to defaultPrinter, then first printer
                                const printer = receiptSettings.printerType || defaultPrinter || (printers.find(p => p.isDefault) || printers[0])?.name;
                                window.electron.ipcRenderer.send('print-manual', { printerName: printer });
                            } else {
                                window.print();
                            }
                        }}
                    >
                        Print Receipt
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptPreviewDialog;
