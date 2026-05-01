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

export const resolvePrinterName = ({ receiptSettings, printers = [], defaultPrinter = null }) => {
  const rawPrinter = receiptSettings?.printerType;
  const hasPrinters = Array.isArray(printers) && printers.length > 0;
  const isValidPrinter = hasPrinters && rawPrinter && printers.some((p) => p.name === rawPrinter);

  if (isValidPrinter) return rawPrinter;

  return defaultPrinter || (printers.find((p) => p.isDefault) || printers[0])?.name;
};

export const handleManualPrint = async ({ receiptSettings, printers, defaultPrinter }) => {
  if (receiptSettings?.directPrint && window.electron) {
    const printer = resolvePrinterName({ receiptSettings, printers, defaultPrinter });
    return window.electron.ipcRenderer.invoke('print-manual', { printerName: printer });
  }

  window.print();
  return { success: true };
};

export const fetchPrintersForPreview = async () => {
  if (!window.electron) {
    return {
      success: false,
      message: 'Not in Electron environment',
      severity: 'warning',
    };
  }

  try {
    const list = await window.electron.ipcRenderer.invoke('get-printers');
    return {
      success: true,
      message: `Found ${list ? list.length : 0} printers`,
      severity: 'success',
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error.message}`,
      severity: 'error',
    };
  }
};

export const handleEnterKeySaveOrClose = ({ event, onSave, onClose }) => {
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
