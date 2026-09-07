import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

interface CustomerListSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export const CustomerListSearchField = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search customers by name, phone number, or barcode...',
}: CustomerListSearchFieldProps) => {
  const handleClear = () => {
    if (onClear) onClear();
    else onChange('');
  };

  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'rgba(31, 41, 55, 0.55)', fontSize: '1.1rem' }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClear} edge="end" aria-label="Clear search">
              <ClearIcon sx={{ fontSize: '1rem', color: '#94a3b8' }} />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      sx={{
        width: { xs: '100%', sm: 260, md: 320, lg: 360 },
        maxWidth: 420,
        '& .MuiOutlinedInput-root': {
          color: '#1f2937',
          fontSize: '0.85rem',
          bgcolor: '#ffffff',
          height: '36px',
          borderRadius: '6px',
          '& fieldset': { borderColor: '#e2e8f0' },
          '&:hover fieldset': { borderColor: '#cbd5e1' },
          '&.Mui-focused fieldset': { borderColor: '#0b1d39', borderWidth: '1.5px' },
        },
        '& .MuiOutlinedInput-input': {
          padding: '0 10px',
          '&::placeholder': { color: 'rgba(31, 41, 55, 0.5)', opacity: 1 },
        },
      }}
    />
  );
};

export default CustomerListSearchField;
