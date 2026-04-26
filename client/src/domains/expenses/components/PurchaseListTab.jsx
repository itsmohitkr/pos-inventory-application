import React from 'react';
import {
  Box, Typography, Stack, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Autocomplete,
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
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
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
              <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  {row.dueAmount > 0 && (
                    <Button size="small" color="success" onClick={() => onOpenPaymentDialog(row)} sx={{ flexDirection: 'column', fontSize: '0.65rem', minWidth: '60px', textTransform: 'none', lineHeight: 1.2, py: 0.5 }}>
                      <PaymentIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} /> Pay
                    </Button>
                  )}
                  <Button size="small" color="primary" onClick={() => onEditPurchase(row)} sx={{ flexDirection: 'column', fontSize: '0.65rem', minWidth: '50px', textTransform: 'none', lineHeight: 1.2, py: 0.5 }}>
                    <EditIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} /> Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => onDeletePurchase(row.id)} sx={{ flexDirection: 'column', fontSize: '0.65rem', minWidth: '50px', textTransform: 'none', lineHeight: 1.2, py: 0.5 }}>
                    <DeleteIcon sx={{ fontSize: '1.2rem', mb: 0.2 }} /> Delete
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {filteredPurchases.length === 0 && (
            <TableRow><TableCell colSpan={8} align="center">No purchases match criteria</TableCell></TableRow>
          )}
          {filteredPurchases.length > 0 && (
            <TableRow sx={{ bgcolor: 'rgba(242, 181, 68, 0.1)', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <TableCell colSpan={4} sx={{ py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" textAlign="right" color="primary.dark">Total Current Period</Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 1.5 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.dark">₹{totalPurchasesAmount.toLocaleString()}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 1.5 }}>
                <Typography variant="h6" fontWeight="bold" color="error.main">₹{totalPurchasesDue.toLocaleString()}</Typography>
              </TableCell>
              <TableCell colSpan={2} sx={{ py: 1.5 }} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default PurchaseListTab;
