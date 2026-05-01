import React from 'react';
import {
  Box, Typography, Stack, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Autocomplete, IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Payment as PaymentIcon } from '@mui/icons-material';

const PurchaseListTab = ({
  filteredPurchases,
  vendorOptions,
  purchaseStatusFilter, setPurchaseStatusFilter,
  purchaseVendorFilter, setPurchaseVendorFilter,
  purchaseSearchFilter, setPurchaseSearchFilter,
  totalPurchasesAmount, totalPurchasesDue,
  onAddPurchase,
  onEditPurchase,
  onDeletePurchase,
  onOpenPaymentDialog,
  onOpenPaymentHistoryDialog,
}) => (
  <Box>
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', md: 'center' }}
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Typography variant="h6">Inventory Purchases</Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search vendor or note..."
          value={purchaseSearchFilter}
          onChange={(e) => setPurchaseSearchFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={purchaseStatusFilter} label="Status" onChange={(e) => setPurchaseStatusFilter(e.target.value)}>
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
            <MenuItem value="Due">Due</MenuItem>
            <MenuItem value="Unpaid">Unpaid</MenuItem>
          </Select>
        </FormControl>
        <Autocomplete
          size="small"
          sx={{ minWidth: 150 }}
          options={['All', ...vendorOptions]}
          value={purchaseVendorFilter}
          onChange={(e, val) => setPurchaseVendorFilter(val || 'All')}
          renderInput={(params) => <TextField {...params} label="Vendor" />}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddPurchase}>
          Log Purchase
        </Button>
      </Stack>
    </Stack>

    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {['DATE', 'VENDOR', 'METHOD', 'NOTE', 'AMOUNT', 'DUE', 'STATUS', 'ACTIONS'].map((h, i) => (
              <TableCell key={h} align={i >= 4 && i <= 5 ? 'right' : i >= 6 ? 'center' : 'left'} sx={{ fontWeight: 800 }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPurchases.map((row) => (
            <TableRow key={row.id} onDoubleClick={() => onOpenPaymentHistoryDialog(row)} sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}>
              <TableCell>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</TableCell>
              <TableCell>{row.vendor || 'N/A'}</TableCell>
              <TableCell>{row.paymentMethod || 'Cash'}</TableCell>
              <TableCell>{row.note}</TableCell>
              <TableCell align="right">₹{row.totalAmount.toLocaleString()}</TableCell>
              <TableCell align="right">
                {row.dueAmount > 0
                  ? <Typography fontWeight="bold" color="error.main">₹{row.dueAmount.toLocaleString()}</Typography>
                  : <Typography color="text.secondary">-</Typography>}
              </TableCell>
              <TableCell align="center">
                <Chip label={row.paymentStatus || 'Paid'} size="small" sx={{ fontWeight: 'bold', minWidth: 70 }}
                  color={row.paymentStatus === 'Paid' ? 'success' : row.paymentStatus === 'Due' ? 'warning' : 'error'} />
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  {row.dueAmount > 0 && (
                    <IconButton size="small" color="success" onClick={() => onOpenPaymentDialog(row)} aria-label="Pay">
                      <PaymentIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton size="small" color="primary" onClick={() => onEditPurchase(row)} aria-label="Edit">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => onDeletePurchase(row.id)} aria-label="Delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {filteredPurchases.length === 0 && (
            <TableRow><TableCell colSpan={8} align="center">No purchases match criteria</TableCell></TableRow>
          )}
          {filteredPurchases.length > 0 && (
            <TableRow sx={{ bgcolor: '#f3eee6', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <TableCell colSpan={4} sx={{ py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight={700} textAlign="right" color="text.secondary">Total Current Period</Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" fontWeight={700} color="text.primary">₹{totalPurchasesAmount.toLocaleString()}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" fontWeight={700} color="error.main">₹{totalPurchasesDue.toLocaleString()}</Typography>
              </TableCell>
              <TableCell colSpan={2} sx={{ py: 1.25, borderTop: '1px solid', borderColor: 'divider' }} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default PurchaseListTab;
