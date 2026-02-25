import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import { Backspace as BackspaceIcon, Close as CloseIcon } from '@mui/icons-material';

const NumpadDialog = ({ open, onClose, onConfirm, initialValue = '', title = 'Enter Amount' }) => {
    const [value, setValue] = useState(initialValue.toString());

    useEffect(() => {
        if (open) {
            setValue(initialValue.toString());
        }
    }, [open, initialValue]);

    const handleNumberClick = (num) => {
        if (value === '0') {
            setValue(num.toString());
        } else {
            setValue(prev => prev + num);
        }
    };

    const handleDecimalClick = () => {
        if (!value.includes('.')) {
            setValue(prev => (prev === '' ? '0.' : prev + '.'));
        }
    };

    const handleBackspace = () => {
        setValue(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };

    const handleClear = () => {
        setValue('0');
    };

    const handleConfirm = () => {
        onConfirm(parseFloat(value) || 0);
        onClose();
    };

    const buttons = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '.', '0', 'clear'
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" fontWeight="bold">{title}</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{
                    bgcolor: 'action.hover',
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                    textAlign: 'right',
                    border: '2px solid',
                    borderColor: 'primary.main'
                }}>
                    <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        ₹{value}
                    </Typography>
                </Box>
                <Grid container spacing={1.5}>
                    {buttons.map((btn) => (
                        <Grid item xs={4} key={btn}>
                            {btn === 'clear' ? (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    onClick={handleClear}
                                    sx={{ height: 60, fontSize: '1.2rem', fontWeight: 'bold' }}
                                >
                                    C
                                </Button>
                            ) : (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => btn === '.' ? handleDecimalClick() : handleNumberClick(btn)}
                                    sx={{ height: 60, fontSize: '1.5rem', fontWeight: 'bold' }}
                                >
                                    {btn}
                                </Button>
                            )}
                        </Grid>
                    ))}
                    <Grid item xs={8}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={handleConfirm}
                            sx={{ height: 60, fontSize: '1.2rem', fontWeight: 'bold' }}
                        >
                            Confirm
                        </Button>
                    </Grid>
                    <Grid item xs={4}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleBackspace}
                            sx={{ height: 60 }}
                        >
                            <BackspaceIcon />
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default NumpadDialog;
