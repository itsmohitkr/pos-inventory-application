import React, { useEffect, useRef } from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';


const POSSearchBar = React.forwardRef(
  (
    {
      products,
      searchQuery,
      onSearchInputChange,
      onSelectProduct,
      filterOptions,
      onLooseSale,
      looseSaleEnabled,
    },
    ref
  ) => {
    const inputRef = useRef(null);
    const highlightedOptionRef = useRef(null);
    const ignoreNextChangeRef = useRef(false);
    const [animating, setAnimating] = React.useState(false);
    const [typewriterBarcode, setTypewriterBarcode] = React.useState('');

    const completeSelection = React.useCallback(
      (product, displayValue) => {
        if (!product) return;

        setAnimating(true);
        setTypewriterBarcode(displayValue || product.name || '');
        onSelectProduct(product);

        window.setTimeout(() => {
          setAnimating(false);
          setTypewriterBarcode('');
          onSearchInputChange('');
        }, 10);
      },
      [onSearchInputChange, onSelectProduct]
    );

    React.useImperativeHandle(ref, () => ({
      focus: () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      },
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
      };
    }, []);

    // Auto-focus when searchQuery becomes empty (after product is added)
    useEffect(() => {
      if (!searchQuery && !animating && inputRef.current) {
        const focusTimer = setTimeout(() => {
          inputRef.current?.focus();
        }, 20);
        return () => clearTimeout(focusTimer);
      }
    }, [searchQuery, animating]);

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
        const selectedProduct = highlightedOptionRef.current || filtered[0] || null;

        if (!selectedProduct) {
          if (window && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('pos-barcode-not-found', { detail: searchQuery }));
          }
          setTypewriterBarcode(searchQuery);
          window.setTimeout(() => {
            setTypewriterBarcode('');
            onSearchInputChange('');
          }, 300);
          return;
        }

        ignoreNextChangeRef.current = true;
        highlightedOptionRef.current = null;
        completeSelection(selectedProduct, searchQuery);

        window.setTimeout(() => {
          ignoreNextChangeRef.current = false;
        }, 0);
      }
    };

    return (
      <Box
        className="pos-search-bar"
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(16, 24, 40, 0.08)',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Autocomplete
          id="pos-search"
          sx={{ flex: 1 }}
          options={products}
          getOptionLabel={(option) =>
            `${option.name}${option.barcode ? ` (${option.barcode})` : ''}`
          }
          filterOptions={filterOptions}
          value={null}
          inputValue={animating ? typewriterBarcode : searchQuery}
          onInputChange={(event, newInputValue) => {
            onSearchInputChange(newInputValue);
          }}
          open={searchQuery.length > 0}
          onHighlightChange={(_event, option) => {
            highlightedOptionRef.current = option;
          }}
          onChange={(event, newValue) => {
            if (ignoreNextChangeRef.current) {
              ignoreNextChangeRef.current = false;
              return;
            }

            if (newValue) {
              highlightedOptionRef.current = null;
              completeSelection(newValue, newValue.name);
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
              onKeyDown={handleKeyDown}
              sx={{ bgcolor: 'background.paper' }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
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
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {option.name}
                      </Typography>
                      {option.isOnSale && (
                        <Chip
                          label="SALE"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            bgcolor: '#7c3aed',
                            color: 'white',
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {option.batches.map((b) => {
                        const isPromoActive = option.isOnSale && option.promoPrice < b.sellingPrice;
                        return (
                          <Box key={b.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {isPromoActive && (
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: 'line-through',
                                  color: 'text.secondary',
                                  fontSize: '0.7rem',
                                }}
                              >
                                ₹{b.sellingPrice}
                              </Typography>
                            )}
                            <Chip
                              label={`₹${isPromoActive ? option.promoPrice : b.sellingPrice}`}
                              size="small"
                              variant={isPromoActive ? 'filled' : 'outlined'}
                              color="success"
                              sx={{
                                height: 20,
                                fontSize: '0.75rem',
                                ...(isPromoActive
                                  ? { bgcolor: '#1f8a5b', color: 'white', fontWeight: 700 }
                                  : {}),
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                  {option.barcode && (
                    <Typography variant="caption" color="text.secondary">
                      {option.barcode}
                    </Typography>
                  )}
                </Box>
              </li>
            );
          }}
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
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { border: '2px solid', bgcolor: '#fff7ed' },
            }}
          >
            + LOOSE SALE
            <Typography
              variant="caption"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.75rem',
                opacity: 0.6,
                textTransform: 'none',
              }}
            >
              [F8]
            </Typography>
          </Button>
        )}
      </Box>
    );
  }
);

export default POSSearchBar;
