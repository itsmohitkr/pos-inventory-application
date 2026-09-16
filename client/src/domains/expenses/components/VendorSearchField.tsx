import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Box, CircularProgress, Link, TextField } from '@mui/material';
import { Storefront as StorefrontIcon } from '@mui/icons-material';
import vendorService, { type Vendor } from '@/shared/api/vendorService';

/** A synthetic "create a new vendor" row, appended to the search results when
 * the typed text doesn't already match an existing vendor. */
interface CreateVendorOption {
  isCreateOption: true;
  name: string;
}

type VendorOption = Vendor | CreateVendorOption;

const isCreateOption = (opt: VendorOption): opt is CreateVendorOption =>
  (opt as CreateVendorOption).isCreateOption === true;

export interface VendorFieldValue {
  vendorId: number | null;
  vendorName: string;
}

interface VendorSearchFieldProps {
  value: VendorFieldValue;
  onChange: (next: VendorFieldValue) => void;
}

/**
 * Search-or-create Autocomplete for picking a purchase's vendor — mirrors the
 * interaction shape of CustomerSearchField, sized down for a single required
 * field (name). Typing searches real Vendor records; picking an existing one
 * or the "Add <name>" option resolves to a real vendorId via the same
 * findOrCreate the server already exposes, so a vendor is only ever created
 * on an explicit selection, never as a side effect of typing or blurring.
 */
const VendorSearchField = ({ value, onChange }: VendorSearchFieldProps) => {
  const [inputValue, setInputValue] = useState(value.vendorName);
  const [options, setOptions] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against onChange (selecting an option) and onBlur both firing a
  // resolveVendor call for the same text — without this, two concurrent
  // findOrCreate calls for a brand-new name can race the DB's unique
  // constraint on Vendor.name, and the loser's error handler would silently
  // stomp the winner's resolved vendorId.
  const resolvingNameRef = useRef<string | null>(null);

  // Keep the displayed text in sync when the parent resets the form (e.g.
  // opening the dialog for a different purchase) without us having caused it.
  useEffect(() => {
    setInputValue(value.vendorName);
  }, [value.vendorName]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.trim().length < 2) {
      setOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await vendorService.getAll({ search: inputValue.trim(), limit: 8 });
        setOptions(res.vendors || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const resolvedOptions = useMemo<VendorOption[]>(() => {
    const trimmed = inputValue.trim();
    const exactMatch = options.some((opt) => opt.name.toLowerCase() === trimmed.toLowerCase());
    if (!trimmed || exactMatch) return options;
    return [...options, { isCreateOption: true, name: trimmed }];
  }, [options, inputValue]);

  const resolveVendor = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      onChange({ vendorId: null, vendorName: '' });
      return;
    }
    if (resolvingNameRef.current === trimmed) return;
    resolvingNameRef.current = trimmed;
    try {
      const { vendor } = await vendorService.findOrCreate(trimmed, phone || null, address || null);
      onChange({ vendorId: vendor.id, vendorName: vendor.name });
      setInputValue(vendor.name);
      setShowDetails(false);
      setPhone('');
      setAddress('');
    } catch {
      // Keep whatever the user typed as free text — the purchase can still be
      // saved without a linked vendor, same as before this feature existed.
      onChange({ vendorId: null, vendorName: trimmed });
    } finally {
      resolvingNameRef.current = null;
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Autocomplete<VendorOption, false, false, true>
        freeSolo
        options={resolvedOptions}
        loading={loading}
        inputValue={inputValue}
        filterOptions={(opts) => opts}
        onInputChange={(_e, newValue, reason) => {
          setInputValue(newValue);
          if (reason === 'input') onChange({ vendorId: null, vendorName: newValue });
        }}
        onChange={(_e, selected) => {
          if (selected == null) {
            onChange({ vendorId: null, vendorName: '' });
            setInputValue('');
            return;
          }
          if (typeof selected === 'string') {
            resolveVendor(selected);
            return;
          }
          if (isCreateOption(selected)) {
            resolveVendor(selected.name);
            return;
          }
          onChange({ vendorId: selected.id, vendorName: selected.name });
          setInputValue(selected.name);
        }}
        onBlur={() => {
          // Resolve whatever text is left so the form always submits a real
          // vendorId when possible, without requiring the dropdown to be used.
          if (inputValue.trim() && inputValue.trim() !== value.vendorName.trim()) {
            resolveVendor(inputValue);
          }
        }}
        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
        isOptionEqualToValue={(opt, val) =>
          !isCreateOption(opt) && typeof val !== 'string' && !isCreateOption(val) && opt.id === val.id
        }
        renderOption={(props, opt) => {
          const { key, ...rest } = props;
          return (
            <Box component="li" key={key} {...rest}>
              {isCreateOption(opt) ? `Add "${opt.name}" as a new vendor` : opt.name}
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Vendor Name"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <StorefrontIcon sx={{ fontSize: 18, color: 'action.active', ml: 0.5, mr: -0.5 }} />
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      {!value.vendorId && inputValue.trim().length > 0 && (
        <Link
          component="button"
          type="button"
          variant="caption"
          underline="hover"
          onClick={() => setShowDetails((prev) => !prev)}
          sx={{ alignSelf: 'flex-start' }}
        >
          {showDetails ? 'Hide phone / address' : 'Add phone / address (optional)'}
        </Link>
      )}
      {showDetails && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            label="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            label="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Box>
      )}
    </Box>
  );
};

export default VendorSearchField;
