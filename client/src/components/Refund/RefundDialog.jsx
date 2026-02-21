import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, Typography, IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import RefundProcessor from './RefundProcessor';

const RefundDialog = ({ open, onClose, sale, onRefundSuccess }) => {
    if (!sale) return null;

    const handleSuccess = () => {
        if (onRefundSuccess) onRefundSuccess();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, display: 'flex', flexDirection: 'column', maxHeight: '90vh' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, flexShrink: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Process Refund / Return - ORD-{sale.id}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <RefundProcessor
                    sale={sale}
                    onCancel={onClose}
                    onRefundSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
};

export default RefundDialog;
