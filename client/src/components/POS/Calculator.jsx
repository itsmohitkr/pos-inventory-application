import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    IconButton,
    Button,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';

const Calculator = ({ open, onClose }) => {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('0');

    useEffect(() => {
        if (!expression) {
            setResult('0');
            return;
        }
        try {
            if (/[^0-9+\-*/.]/.test(expression)) return;
            // eslint-disable-next-line no-new-func
            const evalResult = new Function('return (' + expression + ')')();
            if (typeof evalResult === 'number' && !isNaN(evalResult) && isFinite(evalResult)) {
                const roundedResult = Math.round(evalResult * 10000000) / 10000000;
                setResult(roundedResult.toString());
            }
        } catch {
            // Ignore temporary syntax errors like "5+" gracefully
        }
    }, [expression]);

    const handleInput = (val) => {
        // Prevent multiple consecutive operators
        const lastChar = expression.slice(-1);
        const isOperator = ['+', '-', '*', '/'].includes(val);
        const isLastOperator = ['+', '-', '*', '/'].includes(lastChar);

        if (isOperator && isLastOperator) {
            setExpression((prev) => prev.slice(0, -1) + val);
            return;
        }

        if (val === '.' && expression.split(/[+\-*/]/).pop().includes('.')) {
            return;
        }

        setExpression((prev) => prev + val);
    };

    const calculateResult = () => {
        if (!expression || result === 'Error' || result === '0' && expression !== '0') {
            return;
        }
        setExpression(result.toString());
    };

    const handleClear = () => {
        setExpression('');
        setResult('0');
    };

    const handleDelete = () => {
        setExpression((prev) => prev.slice(0, -1));
    };

    const buttons = [
        { label: 'C', onClick: handleClear, color: 'error.main', bgColor: 'error.light' },
        { label: <BackspaceOutlinedIcon fontSize="small" />, onClick: handleDelete, color: 'warning.main', bgColor: 'warning.light' },
        { label: '%', onClick: () => handleInput('/100*'), color: 'info.main', bgColor: 'info.light' },
        { label: '÷', onClick: () => handleInput('/'), color: 'info.main', bgColor: 'info.light' },

        { label: '7', onClick: () => handleInput('7') },
        { label: '8', onClick: () => handleInput('8') },
        { label: '9', onClick: () => handleInput('9') },
        { label: '×', onClick: () => handleInput('*'), color: 'info.main', bgColor: 'info.light' },

        { label: '4', onClick: () => handleInput('4') },
        { label: '5', onClick: () => handleInput('5') },
        { label: '6', onClick: () => handleInput('6') },
        { label: '-', onClick: () => handleInput('-'), color: 'info.main', bgColor: 'info.light' },

        { label: '1', onClick: () => handleInput('1') },
        { label: '2', onClick: () => handleInput('2') },
        { label: '3', onClick: () => handleInput('3') },
        { label: '+', onClick: () => handleInput('+'), color: 'info.main', bgColor: 'info.light' },

        { label: '00', onClick: () => handleInput('00') },
        { label: '0', onClick: () => handleInput('0') },
        { label: '.', onClick: () => handleInput('.') },
        { label: '=', onClick: calculateResult, color: 'primary.contrastText', bgColor: 'primary.main', variant: 'contained' },
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                }
            }}
            onKeyDown={(e) => {
                const keyMap = {
                    'Enter': calculateResult,
                    'Escape': onClose,
                    'Backspace': handleDelete,
                    'Delete': handleClear,
                    'Clear': handleClear,
                };

                if (keyMap[e.key]) {
                    e.preventDefault();
                    keyMap[e.key]();
                } else if (/[0-9+\-*/.%]/.test(e.key)) {
                    e.preventDefault();
                    let val = e.key;
                    if (e.key === 'x') val = '*';
                    handleInput(val);
                }
            }}
        >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
                <Typography variant="h6" fontWeight="bold">Calculator</Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                {/* Display Area */}
                <Box sx={{
                    p: 3,
                    bgcolor: '#1e293b',
                    color: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    minHeight: 120,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Typography
                        variant="body1"
                        sx={{
                            color: 'rgba(255,255,255,0.6)',
                            minHeight: 24,
                            mb: 1,
                            fontSize: '1.2rem',
                            wordBreak: 'break-all'
                        }}
                    >
                        {expression.replace(/\*/g, '×').replace(/\//g, '÷') || '\u00A0'}
                    </Typography>
                    <Typography
                        variant="h3"
                        fontWeight="bold"
                        sx={{
                            wordBreak: 'break-all',
                            lineHeight: 1
                        }}
                    >
                        {result}
                    </Typography>
                </Box>

                {/* Keypad Area */}
                <Box
                    sx={{
                        p: 2,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1.5,
                        bgcolor: 'grey.50'
                    }}
                >
                    {buttons.map((btn, index) => (
                        <Button
                            key={index}
                            variant={btn.variant || "text"}
                            onClick={btn.onClick}
                            sx={{
                                height: 64,
                                borderRadius: 2,
                                fontSize: typeof btn.label === 'string' && btn.label.length > 1 ? '1.25rem' : '1.5rem',
                                fontWeight: 'bold',
                                color: btn.color || 'text.primary',
                                bgcolor: btn.variant === 'contained' ? btn.bgColor : 'white',
                                boxShadow: btn.variant === 'contained' ? 2 : '0 2px 4px rgba(0,0,0,0.05)',
                                transition: 'all 0.1s ease-in-out',
                                '&:hover': {
                                    bgcolor: btn.variant === 'contained' ? btn.bgColor : btn.bgColor || 'grey.200',
                                    filter: 'brightness(0.95)'
                                },
                                '&:active': {
                                    filter: 'brightness(0.85)',
                                    transform: 'scale(0.95)'
                                }
                            }}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default Calculator;
