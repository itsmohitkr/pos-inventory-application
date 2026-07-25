import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
} from '@mui/material';
import CustomerCard from './CustomerCard';

const CustomerCardPreview = ({ open, onClose, customer, shopName }) => {
  if (!customer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ 
        bgcolor: '#0f0c29', 
        color: '#D4AF37', 
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
      }}>
        Premium Card Preview
      </DialogTitle>
      <DialogContent sx={{ 
        p: 4,
        bgcolor: '#f8fafc', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400
      }}>
        <CustomerCard customer={customer} shopName={shopName} />
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', justifyContent: 'center' }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          sx={{ 
            bgcolor: '#0f0c29', 
            color: '#D4AF37', 
            px: 4,
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#1a1a3a' } 
          }}
        >
          Close Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerCardPreview;
