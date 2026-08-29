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

/**
 * Accent-colored label for a batch-form field (focused-label color changes,
 * default theme border/outline otherwise) — the New/Edit Batch fields in
 * BatchFormFields.tsx all used this exact block with only the accent color
 * ever varying, copy-pasted 7 times before being consolidated here.
 */
export const themedLabelSx = (accentColor: string) => ({
  '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
  '& .MuiInputLabel-root.Mui-focused': { color: accentColor, fontWeight: 700 },
  '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
});

/**
 * Full accent-colored field `sx` (label + a colored outline, not just the
 * label like `themedLabelSx` above) — the Quick Stock fields used this
 * exact shape twice, differing only in accent color.
 */
export const themedFieldSx = (accentColor: string, borderColor: string) => ({
  flex: 1,
  minWidth: 120,
  '& .MuiInputLabel-root': {
    fontSize: '0.75rem',
    color: '#475569',
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: accentColor,
    fontWeight: 700,
  },
  '& .MuiOutlinedInput-root': {
    fontSize: '0.78rem',
    bgcolor: '#ffffff',
    borderRadius: '6px',
    '& fieldset': { borderColor },
    '&:hover fieldset': { borderColor: accentColor },
    '&.Mui-focused fieldset': { borderColor: accentColor, borderWidth: '1.5px' },
  },
});
