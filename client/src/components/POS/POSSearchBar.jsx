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

const POSSearchBar = ({ products, searchQuery, onSearchInputChange, onSelectProduct, filterOptions, onLooseSale, looseSaleEnabled }) => {
    const inputRef = useRef(null);
    const timerRef = useRef(null);
    const [animating, setAnimating] = React.useState(false);
    const [typewriterBarcode, setTypewriterBarcode] = React.useState('');
    const [pendingBarcode, setPendingBarcode] = React.useState('');
    const filteredProductsRef = useRef([]);

    useEffect(() => {
        // Auto-focus on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }

        // Cleanup timer on unmount
        return () => {
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

        // Set timer to refocus after 7 seconds
        timerRef.current = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 7000); // 7 seconds (middle ground between 5-10)
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
                        <Box>
                            <Typography variant="body1" fontWeight="bold">{option.name}</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {option.batches.map(b => (
                                    <Chip key={b.id} label={`₹${b.sellingPrice}`} size="small" variant="outlined" color="success" sx={{ height: 20, fontSize: '0.75rem' }} />
                                ))}
                            </Box>
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
};

export default POSSearchBar;
