import React, { useState, useEffect } from 'react';
import posService from '@/shared/api/posService';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  Button,
  Box,
  Grid,
  Chip,
} from '@mui/material';
import { Undo as ReturnIcon } from '@mui/icons-material';
import CustomDialog from '@/shared/components/CustomDialog';
import useCustomDialog from '@/shared/hooks/useCustomDialog';

const RefundProcessor = ({ sale, onCancel, onRefundSuccess, hideHeaderFields }) => {
  const { dialogState, showError, showSuccess, showConfirm, closeDialog } = useCustomDialog();
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    if (sale) {
      const initial = {};
      sale.items.forEach((item) => {
        const maxReturn = item.quantity - (item.returnedQuantity || 0);
        initial[item.id] = {
          checked: false,
          quantity: maxReturn > 0 ? maxReturn : 1,
          max: maxReturn,
        };
      });
      setSelectedItems(initial);
    }
  }, [sale]);

  const handleCheckChange = (id) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }));
  };

  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectedItems((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id].max > 0) {
          next[id].checked = checked;
        }
      });
      return next;
    });
  };

  const handleQuantityChange = (id, val) => {
    const qty = parseInt(val);
    const max = selectedItems[id].max;
    if (qty > max) return;
    if (qty < 1) return;

    setSelectedItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity: qty },
    }));
  };

  const processRefund = async () => {
    const itemsToReturn = Object.entries(selectedItems)
      .filter(([, data]) => data.checked)
      .map(([id, data]) => ({
        saleItemId: parseInt(id),
        quantity: data.quantity,
      }));

    if (itemsToReturn.length === 0) {
      showError('Please select at least one item to return');
      return;
    }

    const confirmed = await showConfirm(
      `Are you sure you want to process this return? Items will be returned to inventory.`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await posService.processRefund(sale.id, itemsToReturn);
      showSuccess('Return processed successfully!');
      setSelectedItems({});
      if (onRefundSuccess) onRefundSuccess();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  if (!sale) return null;

  const allReturnableItems = Object.values(selectedItems).filter((item) => item.max > 0);
  const checkedItemsCount = allReturnableItems.filter((item) => item.checked).length;
  const isAllChecked =
    allReturnableItems.length > 0 && checkedItemsCount === allReturnableItems.length;
  const isIndeterminate = checkedItemsCount > 0 && checkedItemsCount < allReturnableItems.length;

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {!hideHeaderFields && (
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  ORDER REFERENCE
                </Typography>
                <Chip 
                  label={sale.paymentStatus || 'PAID'} 
                  size="small"
                  sx={{ 
                    height: 18, 
                    fontSize: '0.6rem', 
                    fontWeight: 900,
                    bgcolor: sale.paymentStatus === 'Due' ? '#fffbeb' : '#f0fdf4',
                    color: sale.paymentStatus === 'Due' ? '#92400e' : '#166534',
                    border: `1px solid ${sale.paymentStatus === 'Due' ? '#f59e0b33' : '#16a34a33'}`
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0b1d39', lineHeight: 1 }}>
                ORD-{sale.id}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                TRANSACTION DATE
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                {new Date(sale.createdAt).toLocaleString(undefined, { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 0.5, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                BILL TOTAL
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0b1d39', lineHeight: 1 }}>
                ₹{(sale.totalAmount + sale.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      <TableContainer sx={{ flexGrow: 1, maxHeight: 500, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" width={80} sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <Checkbox
                  size="small"
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={handleSelectAll}
                  disabled={allReturnableItems.length === 0}
                />
              </TableCell>
              <TableCell sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>PRODUCT DETAILS</TableCell>
              <TableCell align="right" sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>SOLD</TableCell>
              <TableCell align="right" sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>RETURNED</TableCell>
              <TableCell align="right" width={140} sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>RETURN QTY</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sale.items.map((item) => {
              const alreadyReturned = item.returnedQuantity || 0;
              const canReturn = item.quantity - alreadyReturned;

              return (
                <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={selectedItems[item.id]?.checked || false}
                      onChange={() => handleCheckChange(item.id)}
                      disabled={canReturn === 0}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ py: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {item.batch?.product?.name || item.productName}
                        </Typography>
                        {item.sellingPrice === 0 && (
                          <Chip label="FREE" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#f0fdf4', color: '#166534' }} />
                        )}
                      </Box>
                      {item.batch?.batchCode && (
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Batch: {item.batch.batchCode}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{item.quantity}</TableCell>
                  <TableCell align="right">
                    {alreadyReturned > 0 ? (
                      <Chip 
                        label={alreadyReturned} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          bgcolor: alreadyReturned === item.quantity ? '#fef2f2' : '#fffbeb',
                          color: alreadyReturned === item.quantity ? '#991b1b' : '#92400e',
                          fontWeight: 800,
                          fontSize: '0.7rem'
                        }} 
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>0</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      size="small"
                      value={selectedItems[item.id]?.quantity || 1}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      disabled={!selectedItems[item.id]?.checked || canReturn === 0}
                      inputProps={{ min: 1, max: canReturn, style: { fontWeight: 800, textAlign: 'right' } }}
                      sx={{ 
                        width: 80,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          bgcolor: !selectedItems[item.id]?.checked || canReturn === 0 ? '#f1f5f9' : '#ffffff'
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#ffffff'
        }}
      >
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outlined"
            sx={{ 
              borderRadius: '10px', 
              textTransform: 'none', 
              fontWeight: 700,
              px: 3,
              borderColor: '#e2e8f0',
              color: '#475569',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={processRefund}
          variant="contained"
          startIcon={<ReturnIcon />}
          disabled={submitting}
          sx={{ 
            borderRadius: '10px', 
            textTransform: 'none', 
            fontWeight: 800, 
            px: 4,
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e293b' }
          }}
        >
          {submitting ? 'Processing...' : 'Process Returns'}
        </Button>
      </Box>

      <CustomDialog {...dialogState} onClose={closeDialog} />
    </Box>
  );
};

export default RefundProcessor;
