export const RECEIPT_VISIBILITY_FIELDS = [
  'shopName',
  'header',
  'footer',
  'productName',
  'mrp',
  'price',
  'discount',
  'totalItems',
  'totalValue',
  'exp',
  'barcode',
  'totalSavings',
  'customerDetails',
];

/** Result of the print-manual IPC call. */
export interface PrintResult {
  success?: boolean;
  error?: string;
}

// NOTE: printer resolution now lives in shared/utils/resolvePrinterName.ts —
// three call sites had drifted into three different versions of it. The
// `print-manual` invoke that used to sit here has moved into
// ReceiptPreviewDialog.tsx: per CLAUDE.md, print invokes belong in their
// component so the `is-printing-*` class timing stays next to the call. Only
// the pure resolution logic is shared.

export const fetchPrintersForPreview = async () => {
  if (!window.electron) {
    return {
      success: false,
      message: 'Not in Electron environment',
      severity: 'warning',
    };
  }

  try {
    const list = await window.electron.ipcRenderer.invoke<Array<{ name: string; isDefault?: boolean }>>('get-printers');
    return {
      success: true,
      message: `Found ${list ? list.length : 0} printers`,
      severity: 'success',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error: ${message}`,
      severity: 'error',
    };
  }
};

export const handleEnterKeySaveOrClose = ({ event, onSave, onClose }: Record<string, any>) => {
  if (event.defaultPrevented) return;
  if (event.key !== 'Enter') return;
  if (event.shiftKey) return;
  if (event.target?.tagName === 'TEXTAREA') return;

  event.preventDefault();

  if (onSave) {
    onSave();
    return;
  }

  onClose();
};
