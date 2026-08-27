/**
 * Shared `.MuiOutlinedInput-root` border styling for the Add/Edit Product
 * form fields (name, category, barcode, batch/lot, expiry, quantity, MRP,
 * cost price, discount, wholesale price, min quantity, low-stock threshold).
 * Spread into a field's `sx` as `{ '& .MuiOutlinedInput-root': inputFieldSx }`.
 *
 * Untyped (not `SxProps<Theme>`) deliberately — that type is a union
 * including arrays/functions and isn't assignable as a *nested* value under
 * another sx key, only as the top-level `sx` prop itself.
 */
export const inputFieldSx = {
  bgcolor: '#ffffff',
  borderRadius: '6px',
  '& fieldset': { borderColor: '#cbd5e1' },
  '&:hover fieldset': { borderColor: '#94a3b8' },
  '&.Mui-focused fieldset': { borderColor: '#0b1d39' },
};
