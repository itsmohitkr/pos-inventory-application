import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Divider,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  CheckCircleOutline as CheckIcon,
  DescriptionOutlined as CsvIcon,
  TableChartOutlined as TableIcon,
} from '@mui/icons-material';

interface InventoryExportViewProps {
  onExport: () => Promise<void>;
  exporting: boolean;
}

const EXPORT_COLUMNS = [
  'Product Name',
  'Primary Barcode',
  'Category',
  'Stock Quantity',
  'Cost Price (CP)',
  'Selling Price (SP)',
  'MRP',
  'Batch Code',
  'Expiry Date',
  'Margin %',
  'Discount Values',
  'Creation Date',
];

const InventoryExportView: React.FC<InventoryExportViewProps> = ({ onExport, exporting }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        bgcolor: '#ffffff',
      }}
    >
      {/* Top Action Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            color="primary"
            startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
            onClick={onExport}
            disabled={exporting}
            sx={{
              bgcolor: '#0b1d39',
              color: '#ffffff',
              borderRadius: '8px',
              px: 3,
              py: 1,
              fontWeight: 600,
              fontSize: '0.925rem',
              '&:hover': { bgcolor: '#162e56' },
              '&.Mui-disabled': {
                bgcolor: '#e2e8f0',
                color: '#94a3b8',
              },
            }}
          >
            {exporting ? 'Generating Export...' : 'Download CSV Export'}
          </Button>

          <Chip
            label="Format: CSV (UTF-8)"
            variant="outlined"
            size="small"
            icon={<CsvIcon fontSize="small" />}
            sx={{ borderColor: '#cbd5e1', fontWeight: 600, color: '#475569' }}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Compatible with Microsoft Excel, Apple Numbers, and Google Sheets
        </Typography>
      </Box>

      {/* Horizontal Divider */}
      <Divider sx={{ mb: 3, borderColor: '#e2e8f0' }} />

      {/* Content Area */}
      <Box sx={{ maxWidth: 880 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39', mb: 1 }}>
          Included Data Fields in CSV
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The exported file includes all live products, active batches, barcode mappings, cost valuations, and inventory levels:
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 1.5,
            mb: 4,
          }}
        >
          {EXPORT_COLUMNS.map((col, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.25,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <CheckIcon sx={{ fontSize: 18, color: '#059669' }} />
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                {col}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39', mb: 1 }}>
          Export Guidelines & Best Practices
        </Typography>

        <Stack spacing={1.25}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <TableIcon sx={{ fontSize: 20, color: '#64748b', mt: 0.25 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>Spreadsheet Compatibility:</strong> Barcodes and numeric IDs are formatted with standard quotes to prevent Excel from converting long numbers to scientific notation.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <CsvIcon sx={{ fontSize: 20, color: '#64748b', mt: 0.25 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>Bulk Re-import:</strong> The exported CSV can be edited in your spreadsheet program and directly re-imported via the <strong>Import</strong> tab to perform batch stock updates.
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
};

export default InventoryExportView;
