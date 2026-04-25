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
    PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
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
            <Grid size={{ xs: 12 }} sm={6}>
              <TextField
                fullWidth
                label="Sale Name"
                placeholder="e.g. Spring Clearance Sale"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
                sx={{ minWidth: 350 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
                sx={{ minWidth: 250 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
                sx={{ minWidth: 250 }}
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
            sx={{ p: 3, borderRadius: 2, bgcolor: '#fbfbfd', border: '1px solid #e2e8f0', mb: 3 }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Autocomplete
                sx={{ flexGrow: 1, minWidth: 350 }}
                options={products}
                getOptionLabel={(option) => `${option.name} (${option.barcode || 'No Barcode'})`}
                value={selectedProduct}
                onChange={onProductSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Product"
                    InputProps={{ ...params.InputProps, sx: { borderRadius: 2, bgcolor: 'white' } }}
                  />
                )}
              />
              <TextField
                label="Sale Price"
                type="number"
                sx={{ width: 220, minWidth: 220 }}
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }}
              />
              <Button
                variant="contained"
                onClick={onAddItem}
                disabled={!selectedProduct}
                sx={{
                  height: 56,
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 700,
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
                <Box
                  sx={{
                    flex: 1,
                    p: 1.5,
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
                  >
                    MRP
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                    ₹{productPriceInfo.mrp}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 1.5,
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
                  >
                    Cost Price
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                    ₹{productPriceInfo.costPrice}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 1.5,
                    bgcolor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
                  >
                    Current SP
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                    ₹{productPriceInfo.sellingPrice}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 1.5,
                    bgcolor: '#fdf2f8',
                    border: '1px solid #fbcfe8',
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: '#db2777', display: 'block', mb: 0.5, fontWeight: 700 }}
                  >
                    Discount Amount
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#be185d' }}>
                    ₹
                    {Math.max(
                      0,
                      productPriceInfo.sellingPrice - parseFloat(promoPrice || 0)
                    ).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>MRP</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>
                    Current SP
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0b1d39', py: 2 }}>
                    Sale Price
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2 }} />
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
          borderRadius: 2,
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
