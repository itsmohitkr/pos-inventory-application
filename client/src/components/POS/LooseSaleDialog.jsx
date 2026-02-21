import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    TextField,
    Box,
    Typography,
    Grid,
    IconButton,
    Paper
} from '@mui/material';
import {
    Backspace as BackspaceIcon,
    Close as CloseIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import api from '../../api';

const LooseSaleDialog = ({ open, onClose, onComplete }) => {
    const [price, setPrice] = useState('0');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setPrice('0');
            setName('');
        }
    }, [open]);

    const handleNumberClick = (num) => {
        setPrice(prev => {
            if (prev === '0') return String(num);
            if (prev.length >= 10) return prev;
            return prev + num;
        });
    };

    const handleClear = () => {
        setPrice('0');
    };

    const handleBackspace = () => {
        setPrice(prev => {
            if (prev.length <= 1) return '0';
            return prev.slice(0, -1);
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) return;

        setLoading(true);
        try {
            await api.post('/api/loose-sales', {
                itemName: name.trim() || 'Loose Item',
                price: numericPrice
            });
            if (onComplete) onComplete();
            onClose();
        } catch (error) {
            console.error('Failed to create loose sale:', error);
        } finally {
            setLoading(false);
        }
    };

    // Standard Calculator Orientation
    const numpadValues = [
        7, 8, 9,
        4, 5, 6,
        1, 2, 3,
        'C', 0, 'DEL'
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Loose Sale Entry</Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
                <Grid
                    container
                    spacing={6} // Increased spacing between columns for breathing room
                    justifyContent="center"
                    alignItems="flex-start" // Align to top but with margin
                    sx={{ mt: 2 }} // Significant top margin below header
                >
                    {/* Left Column: Input Details - Centered & Wide */}
                    <Grid item xs={12} md={5.5}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            height: '100%',
                            width: '100%'
                        }}>
                            {/* Amount Box - Consistent Width */}
                            <Box sx={{
                                p: 2,
                                border: '2px solid #e2e8f0',
                                borderRadius: 2,
                                bgcolor: '#f1f5f9',
                                textAlign: 'right',
                                width: '100%'
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.8rem', letterSpacing: 1.5 }}>AMOUNT</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b' }}>
                                    ₹{price}
                                </Typography>
                            </Box>

                            {/* Item Name Input - Consistent Width */}
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#475569' }}>
                                    ITEM NAME / NOTES
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Enter item details..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    multiline
                                    rows={4}
                                    variant="outlined"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Box>

                            {/* Action Buttons - Consistent Width */}
                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    startIcon={<SaveIcon />}
                                    disabled={loading || parseFloat(price) <= 0}
                                    onClick={handleSubmit}
                                    sx={{
                                        height: 60,
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        boxShadow: '0 8px 16px rgba(34, 197, 94, 0.15)'
                                    }}
                                >
                                    {loading ? 'Processing...' : 'Complete Sale'}
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="inherit"
                                    onClick={onClose}
                                    sx={{
                                        height: 48,
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        color: '#64748b',
                                        borderColor: '#e2e8f0',
                                        '&:hover': {
                                            bgcolor: '#f8fafc',
                                            borderColor: '#cbd5e1'
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Right Column: Numpad Grid - Centered & Balanced */}
                    <Grid item xs={12} md={5.5}>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 1.5,
                            width: '100%'
                        }}>
                            {numpadValues.map((val) => (
                                <Button
                                    key={val}
                                    variant="outlined"
                                    onClick={() => {
                                        if (typeof val === 'number') handleNumberClick(val);
                                        else if (val === 'C') handleClear();
                                        else handleBackspace();
                                    }}
                                    sx={{
                                        height: 75,
                                        fontSize: '1.75rem',
                                        fontWeight: 900,
                                        borderRadius: 2,
                                        border: '1px solid #e2e8f0',
                                        bgcolor: typeof val === 'number' ? 'white' : val === 'C' ? '#fee2e2' : '#f1f5f9',
                                        color: typeof val === 'number' ? '#1e293b' : val === 'C' ? '#ef4444' : '#64748b',
                                        '&:hover': {
                                            bgcolor: typeof val === 'number' ? '#f8fafc' : val === 'C' ? '#fecaca' : '#e2e8f0',
                                            borderColor: 'primary.main',
                                            borderWidth: '1px'
                                        }
                                    }}
                                >
                                    {val === 'DEL' ? <BackspaceIcon /> : val}
                                </Button>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default LooseSaleDialog;
