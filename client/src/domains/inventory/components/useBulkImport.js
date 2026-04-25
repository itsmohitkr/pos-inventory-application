import { useState } from 'react';
import inventoryService from '@/shared/api/inventoryService';

export const useBulkImport = (onImportComplete, showError) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [hasErrors, setHasErrors] = useState(false);

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const validateAllRows = async (allData) => {
    setValidating(true);
    const errors = [];
    const seenBarcodes = new Map();

    for (const row of allData) {
      const rowErrors = [];
      if (!row.name || !row.name.trim()) {
        rowErrors.push('Missing product name');
      }

      if (row.barcode && row.barcode.trim()) {
        const barcode = row.barcode.trim().toLowerCase();
        if (seenBarcodes.has(barcode)) {
          rowErrors.push(`Duplicate barcode in CSV (also at line ${seenBarcodes.get(barcode)})`);
        } else {
          seenBarcodes.set(barcode, row.lineNumber);
        }
      }

      row.errors = rowErrors;
      if (rowErrors.length > 0) {
        errors.push({ line: row.lineNumber, messages: rowErrors });
      }
    }

    try {
      const uniqueBarcodes = Array.from(seenBarcodes.keys()).filter((b) => b);
      if (uniqueBarcodes.length > 0) {
        const originalBarcodes = allData
          .filter((row) => row.barcode && row.barcode.trim())
          .map((row) => row.barcode.trim());

        const data = await inventoryService.validateBarcodes(originalBarcodes);
        const { existingBarcodes } = data;

        for (const row of allData) {
          if (row.barcode && row.barcode.trim()) {
            const rowBarcode = row.barcode.trim().toLowerCase();
            const exists = existingBarcodes.some((eb) => eb.toLowerCase() === rowBarcode);
            if (exists) {
              const error = 'Barcode already exists in database';
              row.errors.push(error);
              const existingError = errors.find((e) => e.line === row.lineNumber);
              if (existingError) {
                existingError.messages.push(error);
              } else {
                errors.push({ line: row.lineNumber, messages: [error] });
              }
            }
          }
        }
      }
    } catch (_error) {
      console.error('Failed to validate barcodes against database:', _error);
    }

    setValidationErrors(errors);
    setHasErrors(errors.length > 0);
    setValidating(false);
  };

  const parseCSV = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        showError('CSV file is empty or invalid');
        return;
      }

      const headerValues = parseCSVLine(lines[0]);
      const headers = headerValues.map((h) => h.trim().toLowerCase());

      const allData = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const row = { lineNumber: index + 2, errors: [] };
        headers.forEach((header, i) => {
          let value = values[i] ? values[i].trim() : '';
          if (header === 'barcode' && value && /^\d+\.00$/.test(value)) {
            value = value.replace('.00', '');
          }
          row[header] = value;
        });
        return row;
      });

      await validateAllRows(allData);
      setPreview(allData);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setValidationErrors([]);
      setHasErrors(false);
      parseCSV(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || hasErrors) return;

    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await inventoryService.importProducts(formData);
      setResult(data);

      if (data.success && onImportComplete) {
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      }
    } catch {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ line: 0, message: 'Failed to connect to server' }],
      });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setValidationErrors([]);
    setHasErrors(false);
  };

  return {
    file,
    preview,
    importing,
    result,
    validating,
    validationErrors,
    hasErrors,
    handleFileChange,
    handleImport,
    reset,
  };
};
