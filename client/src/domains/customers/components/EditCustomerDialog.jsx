import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

const EditCustomerDialog = ({ open, customer, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setError('');
    }
  }, [customer, open]);

  const handleSave = async () => {
    setError('');
    
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 7) {
      setError('A valid phone number (at least 7 digits) is required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(customer.id, {
        name: name.trim() || null,
        phone: trimmedPhone,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={!isSaving ? onClose : undefined} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditIcon color="primary" />
        Edit Customer
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          <TextField
            label="Name (Optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            placeholder="John Doe"
          />
          <TextField
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            size="small"
            required
            placeholder="10-digit mobile number"
            helperText="Used for WhatsApp delivery and lookups"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
            Barcode: {customer?.customerBarcode}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCustomerDialog;
