import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    PictureAsPdf as PdfIcon
} from '@mui/icons-material';

const ExportOptions = ({ onExportPDF, onPrint }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
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
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleClick}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
                Export / Print
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        mt: 1,
                        minWidth: 180,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }
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
