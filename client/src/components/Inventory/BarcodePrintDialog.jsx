import React, { useState, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
    TextField, FormControl, InputLabel, Select, MenuItem, Typography,
    Grid, Divider, Checkbox, FormControlLabel, FormGroup, IconButton,
    Paper, Stack, Chip, RadioGroup, Radio
} from '@mui/material';
import {
    Close as CloseIcon,
    Print as PrintIcon,
    ZoomIn as ZoomInIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import Barcode from 'react-barcode';

const BarcodePrintDialog = ({ open, onClose, product }) => {
    const [quantity, setQuantity] = useState(1);
    const [dimensions, setDimensions] = useState({
        width: 2,
        height: 50
    });
    const [printMethod, setPrintMethod] = useState('a4'); // 'a4' or 'machine'
    const [margins, setMargins] = useState({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    });
    const [spacing, setSpacing] = useState({
        horizontal: 5,
        vertical: 5
    });
    const [contentOptions, setContentOptions] = useState({
        productName: true,
        mrp: true,
        sellingPrice: false,
        discount: false,
        shopName: false
    });
    const [textAlign, setTextAlign] = useState('center'); // 'left', 'center', 'right'
    const [shopName, setShopName] = useState('My Store');
    const printRef = useRef();

    const handleContentChange = (field) => {
        setContentOptions(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        const printContent = printRef.current.innerHTML;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Barcodes</title>
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; }
                            @page { margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }
                        }
                        body {
                            font-family: Arial, sans-serif;
                            padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
                        }
                        .barcode-container {
                            display: flex;
                            flex-wrap: wrap;
                            gap: ${spacing.horizontal}mm;
                            row-gap: ${spacing.vertical}mm;
                        }
                        .barcode-item {
                            display: flex;
                            flex-direction: column;
                            align-items: ${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};
                            page-break-inside: avoid;
                            border: 1px dashed #cbd5e1;
                            padding: ${spacing.vertical}mm ${spacing.horizontal}mm;
                        }
                        .barcode-info {
                            text-align: ${textAlign};
                            font-size: 10px;
                            margin-top: 2px;
                            width: 100%;
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const renderBarcodePreview = () => {
        if (!product || !product.barcode) return null;

        const barcodes = product.barcode.split('|').map(b => b.trim()).filter(Boolean);
        const primaryBarcode = barcodes[0] || product.id.toString();

        return (
            <Box 
                className="barcode-container"
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: `${spacing.horizontal}mm`,
                    rowGap: `${spacing.vertical}mm`
                }}
            >
                {Array.from({ length: quantity }).map((_, index) => (
                    <Box 
                        key={index} 
                        className="barcode-item"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
                            border: '1px dashed #94a3b8',
                            borderRadius: 1,
                            padding: `${spacing.vertical}mm ${spacing.horizontal}mm`,
                            bgcolor: '#ffffff'
                        }}
                    >
                        <Barcode
                            value={primaryBarcode}
                            width={dimensions.width}
                            height={dimensions.height}
                            fontSize={12}
                            margin={0}
                        />
                        <Box 
                            className="barcode-info"
                            sx={{ 
                                textAlign: textAlign,
                                width: '100%',
                                mt: 0.5
                            }}
                        >
                            {contentOptions.productName && (
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                    {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
                                </Typography>
                            )}
                            {contentOptions.mrp && product.batches && product.batches.length > 0 && (
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                    MRP: ₹{Math.max(...product.batches.map(b => b.mrp))}
                                </Typography>
                            )}
                            {contentOptions.sellingPrice && product.batches && product.batches.length > 0 && (
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                    Price: ₹{Math.max(...product.batches.map(b => b.sellingPrice))}
                                </Typography>
                            )}
                            {contentOptions.discount && product.batches && product.batches.length > 0 && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'green' }}>
                                    Save: ₹{Math.max(...product.batches.map(b => b.mrp - b.sellingPrice))}
                                </Typography>
                            )}
                            {contentOptions.shopName && (
                                <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                                    {shopName}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { height: '90vh' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Barcode Print Setup
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {product?.name || 'No product selected'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Left Panel - Settings */}
                    <Grid item xs={12} md={5}>
                        <Stack spacing={3}>
                            {/* Basic Settings */}
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                                    Basic Settings
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Quantity"
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        fullWidth
                                        size="small"
                                        inputProps={{ min: 1, max: 100 }}
                                    />
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Print Method</InputLabel>
                                        <Select
                                            value={printMethod}
                                            onChange={(e) => setPrintMethod(e.target.value)}
                                            label="Print Method"
                                        >
                                            <MenuItem value="a4">A4 Paper (210 x 297 mm)</MenuItem>
                                            <MenuItem value="machine">Barcode Machine</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Paper>

                            {/* Dimensions */}
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                                    Barcode Dimensions
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Width"
                                            type="number"
                                            value={dimensions.width}
                                            onChange={(e) => setDimensions({ ...dimensions, width: parseFloat(e.target.value) || 2 })}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 1, max: 5, step: 0.1 }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Height (px)"
                                            type="number"
                                            value={dimensions.height}
                                            onChange={(e) => setDimensions({ ...dimensions, height: parseInt(e.target.value) || 50 })}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 30, max: 100 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Margins */}
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                                    Page Margins (mm)
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Top"
                                            type="number"
                                            value={margins.top}
                                            onChange={(e) => setMargins({ ...margins, top: parseInt(e.target.value) || 0 })}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Right"
                                            type="number"
                                            value={margins.right}
                                            onChange={(e) => setMargins({ ...margins, right: parseInt(e.target.value) || 0 })}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Bottom"
                                            type="number"
                                            value={margins.bottom}
                                            onChange={(e) => setMargins({ ...margins, bottom: parseInt(e.target.value) || 0 })}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Left"
                                            type="number"
                                            value={margins.left}
                                            onChange={(e) => setMargins({ ...margins, left: parseInt(e.target.value) || 0 })}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Spacing */}
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                                    Barcode Spacing (mm)
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Horizontal"
                                            type="number"
                                            value={spacing.horizontal}
                                            onChange={(e) => setSpacing({ ...spacing, horizontal: parseInt(e.target.value) || 0 })}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Vertical"
                                            type="number"
                                            value={spacing.vertical}
                                            onChange={(e) => setSpacing({ ...spacing, vertical: parseInt(e.target.value) || 0 })}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Content Options */}
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                                    Display Content
                                </Typography>
                                <FormGroup>
                                    <FormControlLabel
                                        control={<Checkbox checked={contentOptions.productName} onChange={() => handleContentChange('productName')} />}
                                        label="Product Name"
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={contentOptions.mrp} onChange={() => handleContentChange('mrp')} />}
                                        label="MRP"
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={contentOptions.sellingPrice} onChange={() => handleContentChange('sellingPrice')} />}
                                        label="Selling Price"
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={contentOptions.discount} onChange={() => handleContentChange('discount')} />}
                                        label="Discount/Savings"
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={contentOptions.shopName} onChange={() => handleContentChange('shopName')} />}
                                        label="Shop Name"
                                    />
                                </FormGroup>
                                {contentOptions.shopName && (
                                    <TextField
                                        label="Shop Name"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        fullWidth
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </Paper>

                            {/* Text Alignment */}
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                                    Text Alignment
                                </Typography>
                                <FormControl component="fieldset">
                                    <RadioGroup
                                        value={textAlign}
                                        onChange={(e) => setTextAlign(e.target.value)}
                                        row
                                    >
                                        <FormControlLabel 
                                            value="left" 
                                            control={<Radio size="small" />} 
                                            label="Left" 
                                        />
                                        <FormControlLabel 
                                            value="center" 
                                            control={<Radio size="small" />} 
                                            label="Center" 
                                        />
                                        <FormControlLabel 
                                            value="right" 
                                            control={<Radio size="small" />} 
                                            label="Right" 
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Right Panel - Preview */}
                    <Grid item xs={12} md={7}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                bgcolor: '#ffffff',
                                border: '2px dashed #cbd5e1',
                                minHeight: 600,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    Preview
                                </Typography>
                                <Chip
                                    label={`${printMethod === 'a4' ? 'A4 Paper' : 'Barcode Machine'}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <Box
                                ref={printRef}
                                sx={{
                                    flex: 1,
                                    overflow: 'auto',
                                    bgcolor: printMethod === 'a4' ? '#ffffff' : '#f8fafc',
                                    p: 2,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 1
                                }}
                            >
                                {product && product.barcode ? (
                                    renderBarcodePreview()
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography color="text.secondary">
                                            No barcode available for this product
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Cancel
                </Button>
                <Button
                    onClick={handlePrint}
                    variant="contained"
                    startIcon={<PrintIcon />}
                    disabled={!product || !product.barcode}
                    sx={{ bgcolor: '#1f8a5b', '&:hover': { bgcolor: '#166d47' } }}
                >
                    Print Barcodes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BarcodePrintDialog;
