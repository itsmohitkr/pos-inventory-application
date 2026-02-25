import React, { useEffect, useRef } from 'react';
import { Box, Autocomplete, TextField, InputAdornment, Typography, Chip, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { Button } from '@mui/material';

import { keyframes } from '@mui/system';

const barcodeAnim = keyframes`
    0% { opacity: 0; transform: translateX(-40px); }
    10% { opacity: 1; transform: translateX(0px); }
    80% { opacity: 1; transform: translateX(60px); }
    100% { opacity: 0; transform: translateX(120px); }
`;

const POSSearchBar = React.forwardRef(({ products, searchQuery, onSearchInputChange, onSelectProduct, filterOptions, onLooseSale, looseSaleEnabled }, ref) => {
    const inputRef = useRef(null);
    const timerRef = useRef(null);
    const [animating, setAnimating] = React.useState(false);
    const [typewriterBarcode, setTypewriterBarcode] = React.useState('');
    const [pendingBarcode, setPendingBarcode] = React.useState('');
    const filteredProductsRef = useRef([]);

    React.useImperativeHandle(ref, () => ({
        focus: () => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    }));

    useEffect(() => {
        // Auto-focus on mount with slight delay for reliability
        const timer = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 150);

        // Cleanup timer on unmount
        return () => {
            clearTimeout(timer);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const handleBlur = () => {
        // Clear any existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    const handleFocus = () => {
        // Clear timer when user manually focuses
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleClear = () => {
        onSearchInputChange('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && searchQuery.trim()) {
            event.preventDefault();
            const filtered = filterOptions(products, { inputValue: searchQuery });
            if (filtered.length > 0) {
                setAnimating(true);
                setTypewriterBarcode(searchQuery);
                onSelectProduct(filtered[0]);
                setTimeout(() => {
                    setAnimating(false);
                    setTypewriterBarcode('');
                    setPendingBarcode('');
                    onSearchInputChange('');
                }, 30); // instant
            } else {
                // No product found: show notification and clear search
                if (window && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('pos-barcode-not-found', { detail: searchQuery }));
                }
                setTypewriterBarcode(searchQuery);
                setTimeout(() => {
                    setTypewriterBarcode('');
                    onSearchInputChange('');
                }, 300);
            }
        }
    };

    return (
        <Box sx={{
            p: 2,
            borderBottom: '1px solid rgba(16, 24, 40, 0.08)',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            gap: 2,
            alignItems: 'center'
        }}>
            <Autocomplete
                id="pos-search"
                sx={{ flex: 1 }}
                options={products}
                getOptionLabel={(option) => `${option.name}${option.barcode ? ` (${option.barcode})` : ''}`}
                filterOptions={filterOptions}
                value={null}
                inputValue={animating ? typewriterBarcode : searchQuery}
                onInputChange={(event, newInputValue) => {
                    onSearchInputChange(newInputValue);
                }}
                open={searchQuery.length > 0}
                onChange={(event, newValue) => {
                    if (newValue) {
                        onSelectProduct(newValue);
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Scan Barcode or Search Item"
                        placeholder="Start typing name, barcode or price..."
                        variant="outlined"
                        fullWidth
                        autoFocus
                        inputRef={inputRef}
                        onBlur={handleBlur}
                        onFocus={handleFocus}
                        onKeyDown={handleKeyDown}
                        sx={{ bgcolor: 'background.paper' }}
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                                <>
                                    <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment>
                                    {params.InputProps.startAdornment}
                                </>
                            ),
                            endAdornment: (
                                <>
                                    {searchQuery && !animating ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={handleClear}
                                                edge="end"
                                                aria-label="clear search"
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                </>
                            )
                        }}
                    />
                )}
                renderOption={(props, option) => (
                    <li {...props}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" fontWeight="bold">{option.name}</Typography>
                                    {option.isOnSale && <Chip label="SALE" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900, bgcolor: '#7c3aed', color: 'white' }} />}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                    {option.batches.map(b => {
                                        const isPromoActive = option.isOnSale && option.promoPrice < b.sellingPrice;
                                        return (
                                            <Box key={b.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {isPromoActive && (
                                                    <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.7rem' }}>
                                                        ₹{b.sellingPrice}
                                                    </Typography>
                                                )}
                                                <Chip
                                                    label={`₹${isPromoActive ? option.promoPrice : b.sellingPrice}`}
                                                    size="small"
                                                    variant={isPromoActive ? "filled" : "outlined"}
                                                    color="success"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.75rem',
                                                        ...(isPromoActive ? { bgcolor: '#1f8a5b', color: 'white', fontWeight: 700 } : {})
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                            {option.barcode && <Typography variant="caption" color="text.secondary">{option.barcode}</Typography>}
                        </Box>
                    </li>
                )}
            />
            {looseSaleEnabled && (
                <Button
                    variant="outlined"
                    color="warning"
                    onClick={onLooseSale}
                    sx={{
                        height: 56,
                        px: 3,
                        fontWeight: 800,
                        borderRadius: 2,
                        border: '2px solid',
                        whiteSpace: 'nowrap',
                        '&:hover': { border: '2px solid', bgcolor: '#fff7ed' }
                    }}
                >
                    + LOOSE SALE
                </Button>
            )}
        </Box>
    );
});

export default POSSearchBar;
