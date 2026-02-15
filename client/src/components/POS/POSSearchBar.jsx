import React, { useEffect, useRef } from 'react';
import { Box, Autocomplete, TextField, InputAdornment, Typography, Chip, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

const POSSearchBar = ({ products, searchQuery, onSearchInputChange, onSelectProduct, filterOptions }) => {
    const inputRef = useRef(null);
    const timerRef = useRef(null);

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

    return (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(16, 24, 40, 0.08)', bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
            <Autocomplete
                id="pos-search"
                options={products}
                getOptionLabel={(option) => `${option.name}${option.barcode ? ` (${option.barcode})` : ''}`}
                filterOptions={filterOptions}
                value={null}
                inputValue={searchQuery}
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
                                    {searchQuery && (
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
                                    )}
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
        </Box>
    );
};

export default POSSearchBar;
