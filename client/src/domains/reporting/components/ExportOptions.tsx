import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Badge } from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';

interface ExportOptionsProps {
  onExportPDF: () => void;
  onPrint?: () => void;
  selectedCount?: number;
}

const ExportOptions = ({ onExportPDF, onPrint, selectedCount = 0 }: ExportOptionsProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const triggerPDF = () => {
    handleClose();
    if (onExportPDF) onExportPDF();
  };

  const triggerPrint = () => {
    handleClose();
    if (onPrint) onPrint();
  };

  return (
    <>
      <Button
        size="small"
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon fontSize="small" />}
        onClick={handleClick}
        sx={{
          height: '36px',
          borderRadius: '6px',
          textTransform: 'none',
          fontSize: '0.8rem',
          fontWeight: 600,
          px: 1.5,
          whiteSpace: 'nowrap',
          bgcolor: '#0b1d39',
          '&:hover': {
            bgcolor: '#1e293b',
          },
        }}
      >
        <Badge
          badgeContent={selectedCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              right: -8,
              top: 0,
              fontSize: '0.65rem',
              height: 16,
              minWidth: 16,
            },
          }}
        >
          {selectedCount > 0 ? 'Export Selected' : 'Export / Print'}
        </Badge>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              borderRadius: '8px',
              mt: 0.5,
              minWidth: 180,
              border: '1px solid #e2e8f0',
              py: 0.5,
            },
          },
        }}
      >
        <MenuItem onClick={triggerPrint} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <PrintIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText primary="Print Report" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <MenuItem onClick={triggerPDF} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <PdfIcon fontSize="small" sx={{ color: '#d32f2f' }} />
          </ListItemIcon>
          <ListItemText primary="Save as PDF" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportOptions;
