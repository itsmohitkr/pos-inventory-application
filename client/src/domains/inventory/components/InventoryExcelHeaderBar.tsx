interface InventoryExcelHeaderBarProps {
  onClose: () => void;
  /** Anchor for the column-visibility menu; null when closed. */
  colAnchorEl: HTMLElement | null;
  setColAnchorEl: (anchor: HTMLElement | null) => void;
  cols: Record<string, boolean>;
  setCols: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onExportCSV: () => void;
  onPrint: () => void;
}

import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Popover,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';

const InventoryExcelHeaderBar = ({
  onClose,
  colAnchorEl,
  setColAnchorEl,
  cols,
  setCols,
  onExportCSV,
  onPrint,
}: InventoryExcelHeaderBarProps) => (
  <AppBar className="no-print" sx={{ position: 'relative', bgcolor: '#1a237e' }}>
    <Toolbar variant="dense">
      <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
        <CloseIcon />
      </IconButton>
      <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6" component="div">
        Full Inventory Spreadsheet View
      </Typography>
      <Button
        color="inherit"
        startIcon={<ViewColumnIcon />}
        onClick={(e) => setColAnchorEl(e.currentTarget)}
        sx={{ mr: 2 }}
      >
        Columns
      </Button>
      <Popover
        open={Boolean(colAnchorEl)}
        anchorEl={colAnchorEl}
        onClose={() => setColAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, minWidth: 400 }}>
          <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1', mb: 1, fontWeight: 'bold' }}>
            Select Columns to Display
          </Typography>
          {Object.keys(cols).map((col) => (
            <FormControlLabel
              key={col}
              control={
                <Checkbox
                  size="small"
                  checked={cols[col]}
                  onChange={(e) => setCols({ ...cols, [col]: e.target.checked })}
                />
              }
              label={col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            />
          ))}
        </Box>
      </Popover>
      <Button color="inherit" startIcon={<DownloadIcon />} onClick={onExportCSV} sx={{ mr: 2 }}>
        Export CSV
      </Button>
      <Button color="inherit" startIcon={<PrintIcon />} onClick={onPrint}>
        Print
      </Button>
    </Toolbar>
  </AppBar>
);

export default InventoryExcelHeaderBar;
