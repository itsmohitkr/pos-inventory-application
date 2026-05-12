import React from 'react';
import {
  Box, Typography, Stack, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, Chip, Autocomplete, IconButton,
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
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 3,
        px: 2,
        borderBottom: '1px solid #f1f5f9',
        mb: 2
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Inventory Purchases</Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>Manage vendor orders and stock procurement records</Typography>
      </Box>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <TextField
          size="small"
          placeholder="Search vendor or note..."
          value={purchaseSearchFilter}
          onChange={(e) => setPurchaseSearchFilter(e.target.value)}
          sx={{
            minWidth: 220,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: '#f8fafc',
              fontWeight: 600,
              '& fieldset': { borderColor: '#e2e8f0' },
            }
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ fontWeight: 600 }}>Payment Status</InputLabel>
          <Select
            value={purchaseStatusFilter}
            label="Payment Status"
            onChange={(e) => setPurchaseStatusFilter(e.target.value)}
            sx={{ borderRadius: '10px', bgcolor: '#f8fafc', fontWeight: 600 }}
          >
            <MenuItem value="All" sx={{ fontWeight: 600 }}>All Statuses</MenuItem>
            <MenuItem value="Paid" sx={{ fontWeight: 500 }}>Paid</MenuItem>
            <MenuItem value="Due" sx={{ fontWeight: 500 }}>Due</MenuItem>
            <MenuItem value="Unpaid" sx={{ fontWeight: 500 }}>Unpaid</MenuItem>
          </Select>
        </FormControl>
        <Autocomplete
          size="small"
          sx={{ minWidth: 180 }}
          options={['All', ...vendorOptions]}
          value={purchaseVendorFilter}
          onChange={(e, val) => setPurchaseVendorFilter(val || 'All')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter Vendor"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#f8fafc',
                  fontWeight: 600
                }
              }}
            />
          )}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddPurchase}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e293b' }
          }}
        >
          Log Purchase
        </Button>
      </Stack>
    </Box>

    <TableContainer sx={{ flex: 1, borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'auto', bgcolor: '#ffffff' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569', py: 1.5 }}>DATE</TableCell>
            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>VENDOR</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>METHOD</TableCell>
            <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>NOTE</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>AMOUNT</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>DUE</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>STATUS</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }}>ACTIONS</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPurchases.map((row) => (
            <TableRow
              key={row.id}
              onDoubleClick={() => onOpenPaymentHistoryDialog(row)}
              hover
              sx={{ '&:hover': { cursor: 'pointer' } }}
            >
              <TableCell sx={{ py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {new Date(row.date).getFullYear()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{row.vendor || 'N/A'}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  {row.paymentMethod || 'CASH'}
                </Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 500, color: '#64748b' }}>{row.note || '-'}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, color: '#0f172a' }}>
                ₹{row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right">
                {row.dueAmount > 0 ? (
                  <Typography variant="body2" sx={{ fontWeight: 900, color: '#dc2626' }}>
                    ₹{row.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>SETTLED</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={row.paymentStatus?.toUpperCase() || 'PAID'}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.65rem',
                    bgcolor: row.paymentStatus === 'Paid' ? '#f0fdf4' : row.paymentStatus === 'Due' ? '#fffbeb' : '#fef2f2',
                    color: row.paymentStatus === 'Paid' ? '#166534' : row.paymentStatus === 'Due' ? '#92400e' : '#991b1b',
                    border: `1px solid ${row.paymentStatus === 'Paid' ? '#16a34a' : row.paymentStatus === 'Due' ? '#f59e0b' : '#dc2626'}`,
                  }}
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  {row.dueAmount > 0 && (
                    <IconButton size="small" onClick={() => onOpenPaymentDialog(row)} aria-label="Record Payment" sx={{ bgcolor: '#f0fdf4', color: '#16a34a', '&:hover': { bgcolor: '#dcfce7' } }}>
                      <PaymentIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={() => onEditPurchase(row)} aria-label="Edit" sx={{ bgcolor: '#eff6ff', color: '#2563eb', '&:hover': { bgcolor: '#dbeafe' } }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDeletePurchase(row.id)} aria-label="Delete" sx={{ bgcolor: '#fef2f2', color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {filteredPurchases.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                <Box sx={{ opacity: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 800 }}>NO PURCHASES FOUND</Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Try adjusting your filters or date range</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {filteredPurchases.length > 0 && (
          <TableFooter
            sx={{
              position: 'sticky',
              bottom: 0,
              bgcolor: '#f8fafc',
              zIndex: 2,
              borderTop: '2px solid #e2e8f0',
              '& .MuiTableCell-root': { border: 'none' }
            }}
          >
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>
                  PERIOD TOTALS
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#3b82f6', display: 'block', fontSize: '0.65rem' }}>TOTAL AMOUNT</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  ₹{totalPurchasesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444', display: 'block', fontSize: '0.65rem' }}>TOTAL LIABILITIES</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#b91c1c' }}>
                  ₹{totalPurchasesDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  </Box>
);

export default PurchaseListTab;
