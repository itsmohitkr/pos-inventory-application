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
import api from '../../shared/api/api';

const LooseSaleDialog = ({ open, onClose, onComplete }) => {
    const [price, setPrice] = useState('0');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isNameFocused, setIsNameFocused] = useState(false);

    useEffect(() => {
        if (open) {
            setPrice('0');
            setName('');
            setIsNameFocused(false);
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

    // Keyboard support
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            // If typing in Name field, only handle Enter and Escape
            if (isNameFocused) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                }
                return;
            }

            // Global/Price field shortcuts
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                handleNumberClick(e.key);
            } else if (e.key === '.') {
                e.preventDefault();
                if (!price.includes('.')) {
                    setPrice(prev => prev + '.');
                }
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                handleBackspace();
            } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                handleClear();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, price, name, isNameFocused, onClose]);

    const numpadRows = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        ['Clear', 0, 'DEL']
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText'
            }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Loose Sale Entry</Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                    {/* Row 1: Amount */}
                    <TextField
                        fullWidth
                        value={price}
                        InputProps={{
                            readOnly: true,
                            startAdornment: <Typography sx={{ mr: 1, fontWeight: '900', fontSize: '1.8rem', color: 'primary.main' }}>₹</Typography>
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'rgba(0,0,0,0.06)',
                                fontWeight: '900',
                                fontSize: '2.5rem',
                                color: 'primary.main',
                                '& input': { caretColor: 'transparent', textAlign: 'center', py: 2 }
                            }
                        }}
                    />

                    {/* Row 2: Item Name */}
                    <TextField
                        placeholder="Item Name / Notes (Optional)"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setIsNameFocused(true)}
                        onBlur={() => setIsNameFocused(false)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'rgba(0,0,0,0.04)',
                                '& input': { textAlign: 'left' }
                            }
                        }}
                    />

                    {/* Rows 2-5: Numpad */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                        {numpadRows.flat().map((val, idx) => (
                            <Button
                                key={idx}
                                variant="outlined"
                                color={val === 'Clear' ? 'error' : 'inherit'}
                                onClick={() => {
                                    if (typeof val === 'number') handleNumberClick(val);
                                    else if (val === 'Clear') handleClear();
                                    else handleBackspace();
                                }}
                                sx={{
                                    height: 70,
                                    fontSize: val === 'Clear' ? '1.1rem' : '1.8rem',
                                    fontWeight: 'bold',
                                    borderRadius: 2,
                                    borderColor: 'divider',
                                    color: val === 'Clear' ? 'error.main' : 'text.primary',
                                    '&:hover': { bgcolor: 'action.hover', filter: 'brightness(0.95)' }
                                }}
                            >
                                {val === 'DEL' ? <BackspaceIcon /> : val}
                            </Button>
                        ))}
                    </Box>

                    {/* Row 6: Actions */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="inherit"
                            onClick={onClose}
                            sx={{
                                height: 60,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                textTransform: 'none'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={handleSubmit}
                            disabled={loading || parseFloat(price) <= 0}
                            sx={{
                                height: 60,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                textTransform: 'none',
                                boxShadow: 3
                            }}
                        >
                            {loading ? 'Processing...' : 'Complete Sale'}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default LooseSaleDialog;
