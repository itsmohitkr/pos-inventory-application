import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  LocalOffer as PromoIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

const PromotionFormDialog = ({
  open,
  onClose,
  isEditMode,
  formData,
  setFormData,
  products,
  selectedProduct,
  onProductSelect,
  productPriceInfo,
  promoPrice,
  setPromoPrice,
  onAddItem,
  onRemoveItem,
  onSubmit,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
    PaperProps={{ sx: { p: 1 } }}
  >
    <DialogTitle
      sx={{
        fontWeight: 800,
        fontSize: '1.5rem',
        color: '#0b1d39',
        borderBottom: '1px solid #f0f0f0',
        pb: 2,
      }}
    >
      {isEditMode ? 'Edit Sale Event' : 'Schedule New Sale Event'}
    </DialogTitle>
    <DialogContent sx={{ mt: 3, '&::-webkit-scrollbar': { display: 'none' } }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: '#1b3e6f',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CalendarIcon fontSize="small" /> Event Details
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Sale Name"
                placeholder="e.g. Spring Clearance Sale"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: '#1b3e6f',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <PromoIcon fontSize="small" /> Add Products
          </Typography>

          <Paper
            variant="outlined"
            sx={{ p: 3, bgcolor: '#fbfbfd', border: '1px solid #e2e8f0', mb: 3 }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={products}
                getOptionLabel={(option) => `${option.name} (${option.barcode || 'No Barcode'})`}
                value={selectedProduct}
                onChange={onProductSelect}
                renderInput={(params) => (
                  <TextField {...params} fullWidth label="Search Product" />
                )}
              />
              <TextField
                label="Sale Price"
                type="number"
                sx={{ width: 160 }}
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={onAddItem}
                disabled={!selectedProduct}
                sx={{
                  px: 4,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  background: '#22ab7dff',
                  color: 'white',
                  '&:hover': { background: '#059669' },
                  '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
                }}
              >
                Add
              </Button>
            </Box>

            {productPriceInfo && (
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {[
                  { label: 'MRP', value: `₹${productPriceInfo.mrp}`, color: '#0b1d39', bgcolor: 'white', border: '#e2e8f0' },
                  { label: 'Cost Price', value: `₹${productPriceInfo.costPrice}`, color: '#0b1d39', bgcolor: 'white', border: '#e2e8f0' },
                  { label: 'Current SP', value: `₹${productPriceInfo.sellingPrice}`, color: '#0b1d39', bgcolor: 'white', border: '#e2e8f0' },
                  {
                    label: 'Discount Amount',
                    value: `₹${Math.max(0, productPriceInfo.sellingPrice - parseFloat(promoPrice || 0)).toFixed(2)}`,
                    color: '#be185d',
                    labelColor: '#db2777',
                    bgcolor: '#fdf2f8',
                    border: '#fbcfe8',
                  },
                ].map(({ label, value, color, labelColor, bgcolor, border }) => (
                  <Box
                    key={label}
                    sx={{
                      flex: 1,
                      p: 1.5,
                      bgcolor,
                      border: `1px solid ${border}`,
                      borderRadius: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: labelColor || 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>MRP</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Current SP</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0b1d39' }}>Sale Price</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{item.productName}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>₹{item.mrp}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>₹{item.sellingPrice}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#16a34a', fontSize: '1.05rem' }}>
                      ₹{item.promoPrice}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => onRemoveItem(index)}
                        color="error"
                        sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {formData.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <InventoryIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                        No products added to this sale yet
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Search and add products above to build your promotion
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </DialogContent>
    <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0', mt: 3 }}>
      <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, px: 3 }}>
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={!formData.name || formData.items.length === 0}
        sx={{
          px: 4,
          fontWeight: 700,
          background: '#22ab7dff',
          color: 'white',
          '&:hover': { background: '#059669' },
          '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
        }}
      >
        Publish Sale
      </Button>
    </DialogActions>
  </Dialog>
);

export default PromotionFormDialog;
